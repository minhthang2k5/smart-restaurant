// Load associations first
require("../models/associations");

const TableSession = require("../models/TableSession");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const OrderItemModifier = require("../models/OrderItemModifier");
const MenuItem = require("../models/MenuItem");
const ModifierOption = require("../models/ModifierOption");
const ModifierGroup = require("../models/ModifierGroup");
const Table = require("../models/Table");
const User = require("../models/User");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const crypto = require("crypto");

/**
 * Generate unique session number
 * Format: SESS-YYYYMMDD-HHMMSS-XXXXXX
 * Notes:
 * - Avoids COUNT()-based sequencing, which can collide under concurrent requests.
 * - Random suffix makes collisions extremely unlikely without extra DB queries.
 */
const generateSessionNumber = async () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "");
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars

    return `SESS-${dateStr}-${timeStr}-${rand}`;
};

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-HHMMSS-XXXXXX
 */
const generateOrderNumber = async () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "");
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars

    return `ORD-${dateStr}-${timeStr}-${rand}`;
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
 * Create new table session
 */
exports.createTableSession = async (tableId, customerId = null) => {
    try {
        // Check if table exists
        const table = await Table.findByPk(tableId);
        if (!table) {
            throw new Error("Table not found");
        }
        
        // Check if table already has active session
        const activeSession = await TableSession.findOne({
            where: {
                table_id: tableId,
                status: "active",
            },
        });
        
        if (activeSession) {
            throw new Error("Table already has an active session");
        }
        
        const sessionNumber = await generateSessionNumber();
        
        const session = await TableSession.create({
            table_id: tableId,
            customer_id: customerId,
            session_number: sessionNumber,
            status: "active",
        });
        
        return session;
    } catch (error) {
        throw error;
    }
};

/**
 * Smart session check for a table
 * Returns: { active: Session|null, recentCompleted: Session|null }
 * - active: currently active session if exists
 * - recentCompleted: most recent completed session within buffer window (for post-payment detection)
 */
exports.checkTableSessionStatus = async (tableId, bufferMinutes = 30) => {
    try {
        // Check for active session
        const activeSession = await TableSession.findOne({
            where: {
                table_id: tableId,
                status: "active",
            },
            attributes: ["id", "session_number", "status", "customer_id", "started_at"],
        });

        // Check for recently completed session (within buffer window)
        const bufferTime = new Date(Date.now() - bufferMinutes * 60 * 1000);
        const recentCompleted = await TableSession.findOne({
            where: {
                table_id: tableId,
                status: "completed",
                completed_at: {
                    [Op.gte]: bufferTime,
                },
            },
            order: [["completed_at", "DESC"]],
            attributes: ["id", "session_number", "status", "customer_id", "completed_at", "total_amount"],
        });

        return {
            active: activeSession,
            recentCompleted: recentCompleted,
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Claim/link a session to a customer (used when guest logs in)
 */
exports.claimSession = async (sessionId, customerId) => {
    try {
        const session = await TableSession.findByPk(sessionId);
        
        if (!session) {
            throw new Error("Session not found");
        }
        
        if (session.status !== "active") {
            throw new Error("Can only claim active sessions");
        }
        
        // Only update if not already claimed by another customer
        if (session.customer_id && session.customer_id !== customerId) {
            // Session already belongs to a different customer - don't override
            return session;
        }
        
        session.customer_id = customerId;
        await session.save();
        
        // Also update any orders in this session that don't have customer_id
        await Order.update(
            { customer_id: customerId },
            {
                where: {
                    session_id: sessionId,
                    customer_id: null,
                },
            }
        );
        
        return session;
    } catch (error) {
        throw error;
    }
};

/**
 * Get active session for a table
 */
exports.getActiveSessionByTableId = async (tableId) => {
    try {
        const session = await TableSession.findOne({
            where: {
                table_id: tableId,
                status: "active",
            },
            include: [
                {
                    model: Table,
                    as: "table",
                    attributes: ["id", "table_number", "location"],
                },
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "email", "first_name", "last_name"],
                },
                {
                    model: Order,
                    as: "orders",
                    include: [
                        {
                            model: User,
                            as: "waiter",
                            attributes: ["id", "email", "first_name", "last_name"],
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
                },
            ],
            order: [[{ model: Order, as: "orders" }, "created_at", "ASC"]],
        });
        
        return session;
    } catch (error) {
        throw error;
    }
};

/**
 * Get session details by ID
 */
exports.getSessionDetails = async (sessionId) => {
    try {
        const session = await TableSession.findByPk(sessionId, {
            include: [
                {
                    model: Table,
                    as: "table",
                },
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "email", "first_name", "last_name"],
                },
                {
                    model: Order,
                    as: "orders",
                    include: [
                        {
                            model: User,
                            as: "waiter",
                            attributes: ["id", "email", "first_name", "last_name"],
                        },
                        {
                            model: OrderItem,
                            as: "items",
                            include: [
                                {
                                    model: MenuItem,
                                    as: "menuItem",
                                },
                                {
                                    model: OrderItemModifier,
                                    as: "modifiers",
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        
        return session;
    } catch (error) {
        throw error;
    }
};

/**
 * Create new order in session
 */
exports.createOrderInSession = async (sessionId, items, customerId = null) => {
    const transaction = await sequelize.transaction();
    let order;  // ✅ Khai báo bên ngoài try block
    let createdOrderItems = [];  // ✅ Khai báo bên ngoài
    
    try {
        // Check if session exists and is active
        const session = await TableSession.findByPk(sessionId, { transaction });
        
        if (!session) {
            throw new Error("Session not found");
        }
        
        if (session.status !== "active") {
            throw new Error("Session is not active");
        }
        
        // Create new order
        const orderNumber = await generateOrderNumber();
        order = await Order.create({
            session_id: sessionId,
            table_id: session.table_id,
            customer_id: customerId || session.customer_id,
            order_number: orderNumber,
            status: "pending",
        }, { transaction });
        
        // Add items to order
        // createdOrderItems already declared above
        
        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.menuItemId, { transaction });
            if (!menuItem) {
                throw new Error(`Menu item not found: ${item.menuItemId}`);
            }
            
            // Process modifiers
            const modifierDetails = [];
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    const modOption = await ModifierOption.findByPk(mod.optionId, {
                        include: [{ model: ModifierGroup, as: "group" }],
                        transaction,
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
                    order_id: order.id,
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
                { transaction }
            );
            
            if (modifierDetails.length > 0) {
                const modifiersData = modifierDetails.map((mod) => ({
                    order_item_id: orderItem.id,
                    ...mod,
                }));
                await OrderItemModifier.bulkCreate(modifiersData, { transaction });
            }
            
            createdOrderItems.push(orderItem);
        }
        
        // Calculate order totals
        const totals = calculateOrderTotals(createdOrderItems);
        await order.update(totals, { transaction });
        
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
    
    // Fetch complete data with Table for WebSocket emit (AFTER transaction)
    try {
        const sessionWithTable = await TableSession.findByPk(sessionId, {
            include: [{ model: Table, as: "table" }]
        });
        
        const orderWithItems = await Order.findByPk(order.id, {
            include: [{ model: OrderItem, as: "items" }],
            // Force reload from database to get updated totals
            reloadOnFindOne: true
        });
        
        return { 
            order: orderWithItems, 
            items: createdOrderItems,
            session: sessionWithTable 
        };
    } catch (fetchError) {
        // If fetch fails, still return basic data (order already saved)
        console.error("Error fetching complete order data:", fetchError.message);
        return { 
            order: { 
                id: order.id, 
                order_number: order.order_number,
                subtotal: order.subtotal,
                tax_amount: order.tax_amount,
                total_amount: order.total_amount
            }, 
            items: createdOrderItems,
            session: null 
        };
    }
};

/**
 * Complete session with payment (combines all orders)
 */
exports.completeSession = async (sessionId, paymentMethod, transactionId = null) => {
    const transaction = await sequelize.transaction();
    
    try {
        const session = await TableSession.findByPk(sessionId, {
            include: [
                {
                    model: Order,
                    as: "orders",
                    include: [{ model: OrderItem, as: "items" }],
                },
                {
                    model: Table,
                    as: "table"
                }
            ],
            transaction,
        });
        
        if (!session) {
            throw new Error("Session not found");
        }
        
        if (session.status === "completed") {
            throw new Error("Session already completed");
        }
        
        // Calculate combined totals from all orders
        let totalSubtotal = 0;
        
        for (const order of session.orders) {
            // Only include accepted/completed orders (not rejected)
            if (order.status !== "rejected") {
                totalSubtotal += parseFloat(order.subtotal || 0);
            }
        }
        
        const taxAmount = totalSubtotal * 0.1;
        const totalAmount = totalSubtotal + taxAmount;
        
        // Update session
        await session.update({
            status: "completed",
            payment_status: "paid",
            payment_method: paymentMethod,
            payment_transaction_id: transactionId,
            subtotal: totalSubtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            completed_at: new Date(),
        }, { transaction });
        
        // Mark all orders as completed
        await Order.update(
            { status: "completed" },
            {
                where: {
                    session_id: sessionId,
                    status: { [Op.ne]: "rejected" },
                },
                transaction,
            }
        );
        
        await transaction.commit();
        return session;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Cancel session
 */
exports.cancelSession = async (sessionId, reason = null) => {
    try {
        const session = await TableSession.findByPk(sessionId);
        
        if (!session) {
            throw new Error("Session not found");
        }
        
        if (session.status !== "active") {
            throw new Error("Only active sessions can be cancelled");
        }
        
        await session.update({
            status: "cancelled",
            notes: reason,
            completed_at: new Date(),
        });
        
        return session;
    } catch (error) {
        throw error;
    }
};

/**
 * Get customer's session history
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} List of customer's past sessions
 */
exports.getCustomerSessionHistory = async (customerId) => {
    try {
        const sessions = await TableSession.findAll({
            where: {
                customer_id: customerId,
                status: {
                    [Op.in]: ["completed", "cancelled"]
                }
            },
            attributes: ["id", "session_number", "status", "total_amount", "created_at", "completed_at"],
            include: [
                {
                    model: Table,
                    as: "table",
                    attributes: ["id", "table_number", "capacity"]
                },
                {
                    model: Order,
                    as: "orders",
                    attributes: ["id", "order_number", "status", "subtotal", "total_amount", "created_at"],
                    include: [
                        {
                            model: OrderItem,
                            as: "items",
                            attributes: ["id", "quantity", "unit_price", "total_price"],
                            include: [
                                {
                                    model: MenuItem,
                                    as: "menuItem",
                                    attributes: ["id", "name", "price"]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [["completed_at", "DESC"]],
        });
        
        return sessions;
    } catch (error) {
        throw error;
    }
};

module.exports = exports;
