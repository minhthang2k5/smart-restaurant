const sessionService = require("../services/sessionService");
const cartService = require("../services/cartService");
const { emitNewOrder, emitSessionCompleted } = require("../socket");

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
 * Smart session status check for a table
 * GET /api/sessions/table/:tableId/check
 * Returns both active session and recent completed session info
 * Used by frontend to determine ordering vs post-payment mode
 */
exports.checkTableSessionStatus = async (req, res) => {
    try {
        const { tableId } = req.params;
        
        const result = await sessionService.checkTableSessionStatus(tableId);
        
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Error checking session status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error checking session status",
        });
    }
};

/**
 * Claim/link session to customer (called after login)
 * POST /api/sessions/:id/claim
 */
exports.claimSession = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.id || req.body?.customerId;
        
        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required",
            });
        }
        
        const session = await sessionService.claimSession(id, customerId);
        
        res.status(200).json({
            success: true,
            message: "Session claimed successfully",
            data: session,
        });
    } catch (error) {
        console.error("Error claiming session:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error claiming session",
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
        
        // Validate cart items before creating order
        const validation = await cartService.validateCartItems(items);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: "Cart validation failed",
                errors: validation.errors,
            });
        }
        
        // Check if cart can be converted to order
        const canOrderCheck = await cartService.canConvertToOrder(items);
        
        if (!canOrderCheck.canOrder) {
            return res.status(400).json({
                success: false,
                message: canOrderCheck.reason,
            });
        }
        
        const customerId = req.user?.id || null;
        const result = await sessionService.createOrderInSession(sessionId, items, customerId);
        
        // 🔥 Emit new order to kitchen display
        try {
            emitNewOrder({
                id: result.order.id,
                orderNumber: result.order.order_number,
                tableNumber: result.session.table.table_number,
                tableId: result.session.table_id,
                items: result.order.items.map(item => ({
                    id: item.id,
                    name: item.item_name,
                    quantity: item.quantity,
                    specialInstructions: item.special_instructions
                })),
                totalAmount: result.order.total_amount,
                status: result.order.status,
                createdAt: result.order.created_at,
                priority: 'normal'
            });
            
            console.log(`✅ WebSocket: New order #${result.order.order_number} sent to kitchen`);
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
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
        
        // 🔥 Emit session completed to customer
        try {
            emitSessionCompleted(session.table_id, {
                id: session.id,
                tableNumber: session.table.table_number,
                totalAmount: session.total_amount,
                paymentStatus: session.payment_status
            });
            
            console.log(`✅ WebSocket: Session completed notification sent to table ${session.table.table_number}`);
        } catch (socketError) {
            console.error('WebSocket emit error (non-critical):', socketError.message);
        }
        
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

/**
 * Get customer's order history
 * GET /api/sessions/my-sessions
 * Requires authentication
 */
exports.getMySessionHistory = async (req, res) => {
    try {
        const customerId = req.user?.id;
        
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        
        const sessions = await sessionService.getCustomerSessionHistory(customerId);
        
        res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        console.error("Error fetching session history:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching session history",
        });
    }
};

module.exports = exports;
