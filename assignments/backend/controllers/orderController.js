const orderService = require("../services/orderService");
const Order = require("../models/Order");
const { Op } = require("sequelize");



/**
 * Get active order for a table
 * GET /api/orders/table/:tableId
 */
exports.getOrderByTableId = async (req, res) => {
    try {
        const { tableId } = req.params;

        const order = await orderService.getActiveOrderByTableId(tableId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "No active order found for this table",
            });
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching order",
        });
    }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await orderService.getOrderDetails(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching order",
        });
    }
};

/**
 * Get all orders with filters
 * GET /api/orders
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { status, tableId, date, limit = 50 } = req.query;

        const where = {};

        if (status) {
            // Support comma-separated status values (e.g., "pending,accepted,preparing")
            const statusArray = status.split(',').map(s => s.trim());
            if (statusArray.length > 1) {
                where.status = { [Op.in]: statusArray };
            } else {
                where.status = status;
            }
        }

        if (tableId) {
            where.table_id = tableId;
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            where.created_at = {
                [Op.between]: [startDate, endDate],
            };
        }

        const orders = await Order.findAll({
            where,
            limit: parseInt(limit),
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: require("../models/Table"),
                    as: "table",
                    attributes: ["id", "table_number", "location"],
                },
                {
                    model: require("../models/OrderItem"),
                    as: "items",
                    // Get all fields from OrderItem
                    include: [
                        {
                            model: require("../models/OrderItemModifier"),
                            as: "modifiers",
                            // Get all fields from OrderItemModifier
                        }
                    ]
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching orders",
        });
    }
};

/**
 * Accept order (Waiter)
 * POST /api/orders/:id/accept
 */
exports.acceptOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // For testing: use req.user.id if authenticated, otherwise use dummy ID
        const waiterId = req.user?.id || req.body?.waiterId || null;

        const order = await orderService.acceptOrder(id, waiterId);

        res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error accepting order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error accepting order",
        });
    }
};

/**
 * Reject order (Waiter)
 * POST /api/orders/:id/reject
 */
exports.rejectOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        // For testing: use req.user.id if authenticated, otherwise use dummy ID
        const waiterId = req.user?.id || req.body?.waiterId || null;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required",
            });
        }

        const order = await orderService.rejectOrder(id, waiterId, reason);

        res.status(200).json({
            success: true,
            message: "Order rejected successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error rejecting order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error rejecting order",
        });
    }
};

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "accepted", "preparing", "ready", "served", "completed"];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const order = await orderService.updateOrderStatus(id, status);

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating order status",
        });
    }
};

/**
 * Update order item status
 * PATCH /api/orders/items/:itemId/status
 */
exports.updateOrderItemStatus = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "confirmed", "preparing", "ready", "served", "cancelled"];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const orderItem = await orderService.updateOrderItemStatus(itemId, status);

        res.status(200).json({
            success: true,
            message: "Order item status updated successfully",
            data: orderItem,
        });
    } catch (error) {
        console.error("Error updating order item status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating order item status",
        });
    }
};

/**
 * Complete order (mark as completed)
 * POST /api/orders/:id/complete
 * Note: Payment handled at Session level
 */
exports.completeOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await orderService.completeOrder(id);

        res.status(200).json({
            success: true,
            message: "Order completed successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error completing order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error completing order",
        });
    }
};

module.exports = exports;