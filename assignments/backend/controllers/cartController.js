/**
 * Cart Controller
 * Handles cart validation, summary, and preview before order creation
 * Note: Cart is client-side, but these endpoints help validate before placing order
 */

const cartService = require("../services/cartService");
const cartUtils = require("../utils/cartUtils");

/**
 * Validate cart items
 * POST /api/cart/validate
 * @body {Array} items - Cart items to validate
 */
exports.validateCart = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }
        
        // Validate cart limits
        const limitsValidation = cartUtils.validateCartLimits(items);
        if (!limitsValidation.valid) {
            return res.status(400).json({
                success: false,
                errors: limitsValidation.errors,
            });
        }
        
        // Validate cart items
        const validation = await cartService.validateCartItems(items);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors,
                validatedItems: validation.validatedItems,
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Cart is valid",
            validatedItems: validation.validatedItems,
        });
    } catch (error) {
        console.error("Error validating cart:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error validating cart",
        });
    }
};

/**
 * Get cart summary with pricing
 * POST /api/cart/summary
 * @body {Array} items - Cart items
 */
exports.getCartSummary = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }
        
        // Get cart summary
        const summary = await cartService.getCartSummary(items);
        
        // Format response
        const response = cartUtils.formatCartSummaryResponse(summary);
        
        if (!response.success) {
            return res.status(400).json(response);
        }
        
        res.status(200).json(response);
    } catch (error) {
        console.error("Error getting cart summary:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error getting cart summary",
        });
    }
};

/**
 * Check if cart can be converted to order
 * POST /api/cart/can-order
 * @body {Array} items - Cart items
 */
exports.canConvertToOrder = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }
        
        const result = await cartService.canConvertToOrder(items);
        
        res.status(200).json({
            success: true,
            canOrder: result.canOrder,
            reason: result.reason,
        });
    } catch (error) {
        console.error("Error checking cart:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error checking cart",
        });
    }
};

/**
 * Merge duplicate items in cart
 * POST /api/cart/merge
 * @body {Array} items - Cart items with potential duplicates
 */
exports.mergeDuplicates = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }
        
        // Normalize field names (support both snake_case and camelCase)
        const normalizedItems = items.map(item => ({
            menuItemId: item.menuItemId || item.menu_item_id,
            quantity: item.quantity,
            modifiers: (item.modifiers || []).map(mod => ({
                optionId: mod.optionId || mod.modifier_option_id,
                quantity: mod.quantity || 1
            })),
            specialInstructions: item.specialInstructions || item.special_instructions
        }));
        
        const mergedItems = cartUtils.mergeDuplicateItems(normalizedItems);
        
        res.status(200).json({
            success: true,
            message: "Items merged successfully",
            items: mergedItems,
            originalCount: items.length,
            mergedCount: mergedItems.length,
        });
    } catch (error) {
        console.error("Error merging cart items:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error merging cart items",
        });
    }
};

/**
 * Calculate cart item price
 * POST /api/cart/calculate-item
 * @body {String} menuItemId - Menu item ID
 * @body {Number} quantity - Quantity
 * @body {Array} modifiers - Selected modifiers
 */
exports.calculateItemPrice = async (req, res) => {
    try {
        const { menuItemId, quantity, modifiers } = req.body;
        
        if (!menuItemId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "Menu item ID and quantity are required",
            });
        }
        
        // Normalize modifiers field names (support both camelCase and snake_case)
        const normalizedModifiers = (modifiers || []).map(mod => ({
            optionId: mod.optionId || mod.modifierOptionId || mod.modifier_option_id,
            quantity: mod.quantity || 1
        }));
        
        // Validate single item
        const validation = await cartService.validateCartItems([
            {
                menuItemId,
                quantity,
                modifiers: normalizedModifiers,
            },
        ]);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors,
            });
        }
        
        const validatedItem = validation.validatedItems[0];
        const pricing = cartService.calculateCartItemPrice(
            validatedItem.menuItem.price,
            validatedItem.quantity,
            validatedItem.modifiers
        );
        
        res.status(200).json({
            success: true,
            menuItem: {
                id: validatedItem.menuItem.id,
                name: validatedItem.menuItem.name,
                basePrice: parseFloat(validatedItem.menuItem.price),
            },
            quantity: validatedItem.quantity,
            modifiers: validatedItem.modifiers.map((mod) => ({
                groupName: mod.group_name,
                optionName: mod.option_name,
                priceAdjustment: parseFloat(mod.price_adjustment || 0),
            })),
            pricing,
        });
    } catch (error) {
        console.error("Error calculating item price:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error calculating item price",
        });
    }
};

/**
 * Get cart statistics
 * POST /api/cart/statistics
 * @body {Array} items - Cart items
 */
exports.getStatistics = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }
        
        const stats = cartUtils.getCartStatistics(items);
        
        res.status(200).json({
            success: true,
            statistics: stats,
        });
    } catch (error) {
        console.error("Error getting cart statistics:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error getting cart statistics",
        });
    }
};

module.exports = exports;
