// Load associations first
require("../models/associations");

const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const OrderItemModifier = require("../models/OrderItemModifier");
const MenuItem = require("../models/MenuItem");
const ModifierOption = require("../models/ModifierOption");
const ModifierGroup = require("../models/ModifierGroup");
const TableSession = require("../models/TableSession");
const Table = require("../models/Table");
const User = require("../models/User");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

// WebSocket imports
const { 
    emitNewOrder, 
    emitOrderStatusUpdate, 
    emitOrderReady, 
    emitItemStatusUpdate,
    emitOrderRejected 
} = require("../socket");

/**
 * Order Status State Machine
 * Defines valid transitions between order statuses
 */
const VALID_ORDER_TRANSITIONS = {
    pending: ["accepted", "rejected"],
    accepted: ["preparing"],
    preparing: ["ready"],
    ready: ["served"],
    served: ["completed"],
    rejected: [], // Terminal state - no transitions allowed
    completed: [], // Terminal state - no transitions allowed
};

/**
 * Order Item Status State Machine
 * Defines valid transitions for individual order items
 */
const VALID_ORDER_ITEM_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing"],
    preparing: ["ready"],
    ready: ["served"],
    served: [], // Terminal state
    cancelled: [], // Terminal state
};

/**
 * Validate if a status transition is allowed
 */
const validateStatusTransition = (currentStatus, newStatus, transitionMap) => {
    const allowedTransitions = transitionMap[currentStatus];
    
    if (!allowedTransitions) {
        throw new Error(`Invalid current status: ${currentStatus}`);
    }
    
    if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
            `Invalid transition: Cannot change from "${currentStatus}" to "${newStatus}". ` +
            `Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none (terminal state)"}`
        );
    }
    
    return true;
};

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXX
 */
const generateOrderNumber = async () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await Order.count({
        where: {
            created_at: {
                [Op.between]: [startOfDay, endOfDay],
            },
        },
    });
    
    const orderNum = String(count + 1).padStart(4, "0");
    return `ORD-${dateStr}-${orderNum}`;
};

/**
 * Calculate order item total with modifiers
 */
const calculateOrderItemTotal = (unitPrice, quantity, modifiers = []) => {
    const subtotal = parseFloat(unitPrice) * quantity;
    const modifiersTotal = modifiers.reduce((sum, mod) => {
        return sum + (parseFloat(mod.price_adjustment || 0) * quantity);
    }, 0);
    
    return {
        subtotal: subtotal.toFixed(2),
        modifiersTotal: modifiersTotal.toFixed(2),
        totalPrice: (subtotal + modifiersTotal).toFixed(2),
    };
};

/**
 * Calculate order totals
 */
const calculateOrderTotals = (orderItems) => {
    const subtotal = orderItems.reduce((sum, item) => {
        return sum + parseFloat(item.total_price || 0);
    }, 0);
    
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + taxAmount;
    
    return {
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        discount_amount: "0.00",
        total_amount: totalAmount.toFixed(2),
    };
};



/**
 * Add items to order
 * Can be used independently for adding items to existing order
 */
exports.addItemsToOrder = async (orderId, items, transaction = null) => {
    const shouldCommit = !transaction;
    const txn = transaction || await sequelize.transaction();
    
    try {
        const order = await Order.findByPk(orderId, { transaction: txn });
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        if (order.status === "completed" || order.status === "rejected") {
            throw new Error("Cannot add items to completed or rejected order");
        }
        
        const createdOrderItems = [];
        
        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.menuItemId, { transaction: txn });
            if (!menuItem) {
                throw new Error(`Menu item not found: ${item.menuItemId}`);
            }
            
            // Process modifiers
            const modifierDetails = [];
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    const modOption = await ModifierOption.findByPk(mod.optionId, {
                        include: [{ model: ModifierGroup, as: "group" }],
                        transaction: txn,
                    });
                    
                    if (modOption) {
                        modifierDetails.push({
                            modifier_group_id: modOption.group_id,
                            modifier_option_id: modOption.id,
                            price_adjustment: modOption.price_adjustment,
                            group_name: modOption.group.name,
                            option_name: modOption.name,
                        });
                    }
                }
            }
            
            const { subtotal, totalPrice } = calculateOrderItemTotal(
                menuItem.price,
                item.quantity,
                modifierDetails
            );
            
            const orderItem = await OrderItem.create(
                {
                    order_id: orderId,
                    menu_item_id: menuItem.id,
                    quantity: item.quantity,
                    unit_price: menuItem.price,
                    subtotal: subtotal,
                    total_price: totalPrice,
                    status: "pending",
                    special_instructions: item.specialInstructions || null,
                    item_name: menuItem.name,
                    item_description: menuItem.description,
                },
                { transaction: txn }
            );
            
            if (modifierDetails.length > 0) {
                const modifiersData = modifierDetails.map((mod) => ({
                    order_item_id: orderItem.id,
                    ...mod,
                }));
                await OrderItemModifier.bulkCreate(modifiersData, { transaction: txn });
            }
            
            createdOrderItems.push(orderItem);
        }
        
        // Recalculate totals
        const allOrderItems = await OrderItem.findAll({
            where: { order_id: orderId },
            transaction: txn,
        });
        
        const totals = calculateOrderTotals(allOrderItems);
        await order.update(totals, { transaction: txn });
        
        if (shouldCommit) {
            await txn.commit();
            
            // WebSocket: Notify customer about new items added
            try {
                const orderWithSession = await Order.findByPk(orderId, {
                    include: [{ model: TableSession, as: "tableSession" }],
                });
                
                if (orderWithSession?.tableSession) {
                    emitOrderStatusUpdate(orderWithSession.tableSession.table_id, {
                        orderId: orderWithSession.id,
                        orderNumber: orderWithSession.order_number,
                        status: orderWithSession.status,
                        newItemsAdded: createdOrderItems.length,
                        subtotal: orderWithSession.subtotal,
                        total: orderWithSession.total_amount,
                    });
                }
            } catch (socketError) {
                console.error("WebSocket emit failed in addItemsToOrder:", socketError.message);
            }
        }
        
        return { order, newItems: createdOrderItems };
    } catch (error) {
        if (shouldCommit) {
            await txn.rollback();
        }
        throw error;
    }
};

/**
 * Get order with full details
 */
exports.getOrderDetails = async (orderId) => {
    try {
        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: Table,
                    as: "table",
                    attributes: ["id", "table_number", "location"],
                },
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "first_name", "last_name", "email"],
                },
                {
                    model: User,
                    as: "waiter",
                    attributes: ["id", "first_name", "last_name"],
                },
                {
                    model: OrderItem,
                    as: "items",
                    include: [
                        {
                            model: MenuItem,
                            as: "menuItem",
                            attributes: ["id", "name", "price"],
                            include: [
                                {
                                    model: require("../models/MenuItemPhoto"),
                                    as: "photos",
                                    attributes: ["id", "url", "is_primary"],
                                },
                            ],
                        },
                        {
                            model: OrderItemModifier,
                            as: "modifiers",
                        },
                    ],
                },
            ],
        });
        
        return order;
    } catch (error) {
        throw error;
    }
};

/**
 * Get active order by table ID
 */
exports.getActiveOrderByTableId = async (tableId) => {
    try {
        const order = await Order.findOne({
            where: {
                table_id: tableId,
                status: {
                    [Op.in]: ["pending", "accepted", "preparing", "ready", "served"],
                },
            },
            include: [
                {
                    model: Table,
                    as: "table",
                    attributes: ["id", "table_number", "location"],
                },
                {
                    model: OrderItem,
                    as: "items",
                    include: [
                        {
                            model: MenuItem,
                            as: "menuItem",
                            attributes: ["id", "name", "price"],
                        },
                        {
                            model: OrderItemModifier,
                            as: "modifiers",
                        },
                    ],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        
        return order;
    } catch (error) {
        throw error;
    }
};

/**
 * Accept order (Waiter)
 */
exports.acceptOrder = async (orderId, waiterId) => {
    const transaction = await sequelize.transaction();
    
    try {
        const order = await Order.findByPk(orderId, { transaction });
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        if (order.status !== "pending") {
            throw new Error("Only pending orders can be accepted");
        }
        
        await order.update(
            {
                status: "accepted",
                waiter_id: waiterId,
                accepted_at: new Date(),
            },
            { transaction }
        );
        
        // Update all items to confirmed
        await OrderItem.update(
            { status: "confirmed" },
            {
                where: { order_id: orderId, status: "pending" },
                transaction,
            }
        );
        
        await transaction.commit();
        
        // 🔥 Emit order status update to customer and kitchen
        try {
            const orderWithDetails = await Order.findByPk(orderId, {
                include: [
                    { model: TableSession, as: 'tableSession', include: [{ model: Table, as: 'table' }] },
                    { model: OrderItem, as: 'items' }
                ]
            });
            
            if (orderWithDetails && orderWithDetails.tableSession) {
                emitOrderStatusUpdate(orderWithDetails.tableSession.table_id, {
                    id: order.id,
                    orderNumber: order.order_number,
                    status: 'accepted',
                    previousStatus: 'pending'
                });
                
                console.log(`✅ WebSocket: Order #${order.order_number} accepted → Customer table-${orderWithDetails.tableSession.table_id}`);
            } else {
                console.warn(`⚠️ Cannot emit accepted status - missing tableSession for order ${orderId}`);
            }
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
        return order;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Reject order (Waiter)
 */
exports.rejectOrder = async (orderId, waiterId, reason) => {
    try {
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        if (order.status !== "pending") {
            throw new Error("Only pending orders can be rejected");
        }
        
        await order.update({
            status: "rejected",
            waiter_id: waiterId,
            rejection_reason: reason,
        });
        
        // 🔥 Emit order rejected notification to customer
        try {
            const orderWithSession = await Order.findByPk(orderId, {
                include: [{ model: TableSession, as: 'tableSession', include: [{ model: Table, as: 'table' }] }]
            });
            
            if (orderWithSession && orderWithSession.tableSession) {
                emitOrderRejected(orderWithSession.tableSession.table_id, {
                    id: order.id,
                    orderNumber: order.order_number,
                    rejectionReason: reason
                });
                
                console.log(`✅ WebSocket: Order #${order.order_number} rejection notification sent`);
            }
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
        return order;
    } catch (error) {
        throw error;
    }
};

/**
 * Update order status with state machine validation
 */
exports.updateOrderStatus = async (orderId, status) => {
    try {
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        // Validate state transition
        const previousStatus = order.status;
        validateStatusTransition(order.status, status, VALID_ORDER_TRANSITIONS);
        
        await order.update({ status });
        
        // 🔥 Emit order status update to customer
        try {
            const orderWithSession = await Order.findByPk(orderId, {
                include: [
                    { model: TableSession, as: 'tableSession', include: [{ model: Table, as: 'table' }] },
                    { model: OrderItem, as: 'items' }
                ]
            });
            
            if (orderWithSession && orderWithSession.tableSession) {
                emitOrderStatusUpdate(orderWithSession.tableSession.table_id, {
                    id: order.id,
                    orderNumber: order.order_number,
                    status: status,
                    previousStatus: previousStatus
                });
                
                // If order is ready, notify waiter
                if (status === 'ready') {
                    emitOrderReady({
                        id: order.id,
                        orderNumber: order.order_number,
                        tableNumber: orderWithSession.tableSession.table.table_number,
                        tableId: orderWithSession.tableSession.table_id,
                        itemCount: orderWithSession.items.length
                    });
                }
                
                console.log(`✅ WebSocket: Order #${order.order_number} status → ${status}`);
            }
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
        return order;
    } catch (error) {
        throw error;
    }
};

/**
 * Update order item status with state machine validation
 */
exports.updateOrderItemStatus = async (orderItemId, status) => {
    try {
        const orderItem = await OrderItem.findByPk(orderItemId);
        
        if (!orderItem) {
            throw new Error("Order item not found");
        }
        
        // Validate state transition
        const previousStatus = orderItem.status;
        validateStatusTransition(orderItem.status, status, VALID_ORDER_ITEM_TRANSITIONS);
        
        await orderItem.update({ status });
        
        // 🔥 Emit item status update to customer
        try {
            const itemWithDetails = await OrderItem.findByPk(orderItemId, {
                include: [
                    { model: MenuItem, as: 'menuItem' },
                    { 
                        model: Order, 
                        as: 'order',
                        include: [{ model: TableSession, as: 'tableSession', include: [{ model: Table, as: 'table' }] }]
                    }
                ]
            });
            
            if (itemWithDetails && itemWithDetails.order && itemWithDetails.order.tableSession) {
                emitItemStatusUpdate(itemWithDetails.order.tableSession.table_id, {
                    id: orderItem.id,
                    orderId: orderItem.order_id,
                    orderNumber: itemWithDetails.order.order_number,
                    menuItemName: itemWithDetails.menuItem.name,
                    quantity: orderItem.quantity,
                    status: status,
                    previousStatus: previousStatus
                });
                
                console.log(`✅ WebSocket: Item ${itemWithDetails.menuItem.name} status → ${status}`);
            }
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
        return orderItem;
    } catch (error) {
        throw error;
    }
};

/**
 * Complete order (mark as completed)
 * Note: Payment is handled at Session level
 */
exports.completeOrder = async (orderId) => {
    const transaction = await sequelize.transaction();
    
    try {
        const order = await Order.findByPk(orderId, { transaction });
        
        if (!order) {
            throw new Error("Order not found");
        }
        
        if (order.status === "completed") {
            throw new Error("Order already completed");
        }
        
        await order.update(
            {
                status: "completed",
                completed_at: new Date(),
            },
            { transaction }
        );
        
        await OrderItem.update(
            { status: "served" },
            {
                where: { order_id: orderId },
                transaction,
            }
        );
        
        await transaction.commit();
        
        // WebSocket: Notify customer about order completion
        try {
            const orderWithSession = await Order.findByPk(orderId, {
                include: [{ model: TableSession, as: "tableSession" }],
            });
            
            if (orderWithSession?.tableSession) {
                emitOrderStatusUpdate(orderWithSession.tableSession.table_id, {
                    orderId: orderWithSession.id,
                    orderNumber: orderWithSession.order_number,
                    status: "completed",
                    completedAt: orderWithSession.completed_at,
                });
            }
        } catch (socketError) {
            console.error("WebSocket emit failed in completeOrder:", socketError.message);
        }
        
        return order;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = exports;