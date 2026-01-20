/**
 * Bill Service
 * Handles bill request operations (mock feature for waiter communication)
 * Does NOT affect payment logic or session status
 */

// Load associations first
require("../models/associations");

const TableSession = require("../models/TableSession");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const OrderItemModifier = require("../models/OrderItemModifier");
const MenuItem = require("../models/MenuItem");
const ModifierOption = require("../models/ModifierOption");
const Table = require("../models/Table");
const { Op } = require("sequelize");

/**
 * Request bill for a session
 * Sets bill_requested_at timestamp to notify waiters
 * @param {string} sessionId - UUID of the session
 * @returns {Object} Updated session data
 */
exports.requestBill = async (sessionId) => {
    const session = await TableSession.findByPk(sessionId, {
        include: [{ model: Table, as: "table" }],
    });

    if (!session) {
        throw new Error("Session not found");
    }

    if (session.status !== "active") {
        throw new Error("Can only request bill for active sessions");
    }

    // Set bill requested timestamp
    session.bill_requested_at = new Date();
    await session.save();

    return {
        sessionId: session.id,
        sessionNumber: session.session_number,
        tableId: session.table_id,
        tableNumber: session.table?.tableNumber,
        billRequestedAt: session.bill_requested_at,
        totalAmount: session.total_amount,
    };
};

/**
 * Get all pending bill requests
 * Returns sessions where bill_requested_at is not null
 * @returns {Array} List of sessions with pending bill requests
 */
exports.getPendingBillRequests = async () => {
    const sessions = await TableSession.findAll({
        where: {
            bill_requested_at: { [Op.not]: null },
            status: "active",
        },
        include: [
            {
                model: Table,
                as: "table",
                attributes: ["id", "tableNumber", "location"],
            },
            {
                model: Order,
                as: "orders",
                where: { status: { [Op.ne]: "rejected" } },
                required: false,
                include: [
                    {
                        model: OrderItem,
                        as: "items",
                        attributes: ["id", "total_price"],
                    },
                ],
            },
        ],
        order: [["bill_requested_at", "DESC"]],
    });

    const DEFAULT_TAX_RATE = 0.1;

    return sessions.map((session) => {
        // Compute totals from order items if session totals are 0
        const storedSubtotal = parseFloat(session.subtotal || 0);
        const storedTaxAmount = parseFloat(session.tax_amount || 0);
        const storedDiscountAmount = parseFloat(session.discount_amount || 0);
        const storedTotalAmount = parseFloat(session.total_amount || 0);

        let computedSubtotal = 0;
        if (session.orders) {
            session.orders.forEach((order) => {
                order.items?.forEach((item) => {
                    computedSubtotal += parseFloat(item.total_price || 0);
                });
            });
        }

        const computedTaxAmount = Math.max(0, (computedSubtotal - storedDiscountAmount) * DEFAULT_TAX_RATE);
        const computedTotalAmount = Math.max(0, computedSubtotal + computedTaxAmount - storedDiscountAmount);

        const subtotal = storedSubtotal > 0 ? storedSubtotal : computedSubtotal;
        const taxAmount = storedTaxAmount > 0 ? storedTaxAmount : computedTaxAmount;
        const totalAmount = storedTotalAmount > 0 ? storedTotalAmount : computedTotalAmount;

        return {
            sessionId: session.id,
            sessionNumber: session.session_number,
            tableId: session.table_id,
            tableNumber: session.table?.tableNumber,
            location: session.table?.location,
            billRequestedAt: session.bill_requested_at,
            subtotal,
            taxAmount,
            totalAmount,
            startedAt: session.started_at,
        };
    });
};

/**
 * Get bill preview data for a session
 * Retrieves all order details for bill display/PDF generation
 * @param {string} sessionId - UUID of the session
 * @returns {Object} Complete bill data
 */
exports.getBillPreview = async (sessionId) => {
    const session = await TableSession.findByPk(sessionId, {
        include: [
            {
                model: Table,
                as: "table",
                attributes: ["id", "tableNumber", "location"],
            },
            {
                model: Order,
                as: "orders",
                where: { status: { [Op.ne]: "rejected" } },
                required: false,
                include: [
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
                                include: [
                                    {
                                        model: ModifierOption,
                                        as: "modifierOption",
                                        attributes: ["id", "name", "price_adjustment"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!session) {
        throw new Error("Session not found");
    }

    // Format order items for bill display
    const billItems = [];
    if (session.orders) {
        session.orders.forEach((order) => {
            order.items?.forEach((item) => {
                const modifiers = item.modifiers?.map((mod) => ({
                    name: mod.modifierOption?.name || mod.option_name || "Unknown",
                    priceAdjustment: parseFloat(mod.modifierOption?.price_adjustment || mod.price_adjustment || 0),
                })) || [];

                billItems.push({
                    name: item.menuItem?.name || "Unknown Item",
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unit_price),
                    modifiers,
                    totalPrice: parseFloat(item.total_price),
                });
            });
        });
    }

    const storedSubtotal = parseFloat(session.subtotal || 0);
    const storedTaxAmount = parseFloat(session.tax_amount || 0);
    const storedDiscountAmount = parseFloat(session.discount_amount || 0);
    const storedTotalAmount = parseFloat(session.total_amount || 0);

    const computedSubtotal = billItems.reduce(
        (sum, item) => sum + (Number(item.totalPrice) || 0),
        0
    );
    // Mock/default VAT fallback for preview only (read-only; does not persist)
    const DEFAULT_TAX_RATE = 0.1;
    const computedTaxAmount = Math.max(
        0,
        (computedSubtotal - storedDiscountAmount) * DEFAULT_TAX_RATE
    );
    const computedTotalAmount = Math.max(
        0,
        computedSubtotal + computedTaxAmount - storedDiscountAmount
    );

    const subtotal = storedSubtotal > 0 ? storedSubtotal : computedSubtotal;
    const taxAmount = storedTaxAmount > 0 ? storedTaxAmount : computedTaxAmount;
    const discountAmount = storedDiscountAmount;
    const totalAmount = storedTotalAmount > 0 ? storedTotalAmount : computedTotalAmount;

    return {
        sessionId: session.id,
        sessionNumber: session.session_number,
        tableNumber: session.table?.tableNumber,
        location: session.table?.location,
        startedAt: session.started_at,
        billRequestedAt: session.bill_requested_at,
        items: billItems,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        status: session.status,
    };
};

/**
 * Clear bill request (waiter acknowledges/handles request)
 * Sets bill_requested_at back to null
 * @param {string} sessionId - UUID of the session
 * @returns {Object} Updated session data
 */
exports.clearBillRequest = async (sessionId) => {
    const session = await TableSession.findByPk(sessionId);

    if (!session) {
        throw new Error("Session not found");
    }

    session.bill_requested_at = null;
    await session.save();

    return {
        sessionId: session.id,
        message: "Bill request cleared",
    };
};
