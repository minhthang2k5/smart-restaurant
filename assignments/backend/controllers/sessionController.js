const sessionService = require("../services/sessionService");

/**
 * Create new table session
 * POST /api/sessions
 */
exports.createSession = async (req, res) => {
    try {
        const { tableId, customerId } = req.body;
        
        if (!tableId) {
            return res.status(400).json({
                success: false,
                message: "Table ID is required",
            });
        }
        
        const userId = req.user?.id || customerId;
        const session = await sessionService.createTableSession(tableId, userId);
        
        res.status(201).json({
            success: true,
            message: "Table session created successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error creating session",
        });
    }
};

/**
 * Get active session for a table
 * GET /api/sessions/table/:tableId
 */
exports.getSessionByTableId = async (req, res) => {
    try {
        const { tableId } = req.params;
        
        const session = await sessionService.getActiveSessionByTableId(tableId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "No active session found for this table",
            });
        }
        
        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching session",
        });
    }
};

/**
 * Get session details by ID
 * GET /api/sessions/:id
 */
exports.getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const session = await sessionService.getSessionDetails(id);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }
        
        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching session",
        });
    }
};

/**
 * Create order in session
 * POST /api/sessions/:id/orders
 */
exports.createOrderInSession = async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items array is required and must not be empty",
            });
        }
        
        for (const item of items) {
            if (!item.menuItemId || !item.quantity || item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Each item must have menuItemId and quantity >= 1",
                });
            }
        }
        
        const customerId = req.user?.id || null;
        const result = await sessionService.createOrderInSession(sessionId, items, customerId);
        
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error creating order",
        });
    }
};

/**
 * Complete session with payment
 * POST /api/sessions/:id/complete
 */
exports.completeSession = async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const { paymentMethod, transactionId } = req.body;
        
        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Payment method is required",
            });
        }
        
        const validPaymentMethods = ["cash", "card", "zalopay", "momo", "vnpay", "stripe"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}`,
            });
        }
        
        const session = await sessionService.completeSession(sessionId, paymentMethod, transactionId);
        
        res.status(200).json({
            success: true,
            message: "Session completed successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error completing session:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error completing session",
        });
    }
};

/**
 * Cancel session
 * POST /api/sessions/:id/cancel
 */
exports.cancelSession = async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const { reason } = req.body;
        
        const session = await sessionService.cancelSession(sessionId, reason);
        
        res.status(200).json({
            success: true,
            message: "Session cancelled successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error cancelling session:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error cancelling session",
        });
    }
};

module.exports = exports;
