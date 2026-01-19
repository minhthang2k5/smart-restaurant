/**
 * Cart Service
 * Handles cart validation and processing before order creation
 * Note: Cart is client-side only, this service validates before converting to Order
 */

// Load associations first
require("../models/associations");

const MenuItem = require("../models/MenuItem");
const ModifierOption = require("../models/ModifierOption");
const ModifierGroup = require("../models/ModifierGroup");
const MenuItemModifierGroup = require("../models/MenuItemModifierGroup");

/**
 * Validate cart items before creating order
 * @param {Array} cartItems - Array of cart items with structure:
 *   [{
 *     menuItemId: UUID,
 *     quantity: Number,
 *     specialInstructions: String (optional),
 *     modifiers: [{ optionId: UUID }] (optional)
 *   }]
 * @returns {Object} { valid: boolean, errors: Array, validatedItems: Array }
 */
exports.validateCartItems = async (cartItems) => {
    const errors = [];
    const validatedItems = [];
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        errors.push("Cart must contain at least one item");
        return { valid: false, errors, validatedItems: [] };
    }
    
    for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const itemErrors = [];
        
        // Normalize field names (support both snake_case and camelCase)
        const menuItemId = item.menuItemId || item.menu_item_id;
        const quantity = item.quantity;
        const specialInstructions = item.specialInstructions || item.special_instructions;
        const modifiers = item.modifiers || [];
        
        // Validate required fields
        if (!menuItemId) {
            itemErrors.push(`Item ${i + 1}: Menu item ID is required`);
            continue;
        }
        
        if (!quantity || quantity < 1) {
            itemErrors.push(`Item ${i + 1}: Quantity must be at least 1`);
        }
        
        // Validate menu item exists and is available
        const menuItem = await MenuItem.findByPk(menuItemId, {
            include: [
                {
                    model: ModifierGroup,
                    as: "modifierGroups",
                    through: { attributes: [] }, // Exclude junction table attributes
                    include: [
                        {
                            model: ModifierOption,
                            as: "options",
                        },
                    ],
                },
                {
                    model: require("../models/MenuItemPhoto"),
                    as: "photos",
                    attributes: ["id", "url", "is_primary"],
                },
            ],
        });
        
        if (!menuItem) {
            itemErrors.push(`Item ${i + 1}: Menu item not found`);
        }
        
        // Check if item is available (only if menuItem exists)
        if (menuItem && menuItem.status === "sold_out") {
            itemErrors.push(`Item ${i + 1}: "${menuItem.name}" is currently sold out`);
        }
        
        if (menuItem && menuItem.status === "unavailable") {
            itemErrors.push(`Item ${i + 1}: "${menuItem.name}" is currently unavailable`);
        }
        
        // Validate modifiers if provided (only if menuItem exists)
        const validatedModifiers = [];
        if (menuItem && modifiers && Array.isArray(modifiers) && modifiers.length > 0) {
            const modifierValidation = await this.validateModifiers(
                menuItem,
                modifiers
            );
            
            if (!modifierValidation.valid) {
                itemErrors.push(...modifierValidation.errors.map(err => `Item ${i + 1}: ${err}`));
            } else {
                validatedModifiers.push(...modifierValidation.validatedModifiers);
            }
        }
        
        // If this item has errors, add them to the main errors array
        if (itemErrors.length > 0) {
            errors.push(...itemErrors);
        } else {
            // Item is valid, add to validated items
            validatedItems.push({
                menuItemId: menuItemId,
                menuItem: {
                    id: menuItem.id,
                    name: menuItem.name,
                    description: menuItem.description,
                    price: menuItem.price,
                    status: menuItem.status,
                    photos: menuItem.photos || [],
                },
                quantity: quantity,
                specialInstructions: specialInstructions || null,
                modifiers: validatedModifiers,
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        validatedItems,
    };
};

/**
 * Validate modifiers for a menu item
 * @param {Object} menuItem - MenuItem instance with modifierGroups included
 * @param {Array} selectedModifiers - Array of { optionId: UUID }
 * @returns {Object} { valid: boolean, errors: Array, validatedModifiers: Array }
 */
exports.validateModifiers = async (menuItem, selectedModifiers) => {
    const errors = [];
    const validatedModifiers = [];
    
    if (!selectedModifiers || selectedModifiers.length === 0) {
        return { valid: true, errors: [], validatedModifiers: [] };
    }
    
    // Get all modifier groups for this menu item
    const modifierGroups = menuItem.modifierGroups || [];
    
    if (modifierGroups.length === 0 && selectedModifiers.length > 0) {
        errors.push("This item does not support modifiers");
        return { valid: false, errors, validatedModifiers: [] };
    }
    
    // Group selected modifiers by their group
    const selectedByGroup = {};
    
    for (const modifier of selectedModifiers) {
        // Normalize field names (support both snake_case and camelCase)
        const optionId = modifier.optionId || modifier.modifier_option_id;
        const modifierQuantity = modifier.quantity || 1;
        
        if (!optionId) {
            errors.push("Modifier option ID is required");
            continue;
        }
        
        // Find the modifier option
        const modifierOption = await ModifierOption.findByPk(optionId, {
            include: [{ model: ModifierGroup, as: "group" }],
        });
        
        if (!modifierOption) {
            errors.push(`Modifier option not found: ${modifier.optionId}`);
            continue;
        }
        
        // Check if this modifier belongs to this menu item
        const belongsToItem = modifierGroups.some(
            (mg) => mg.id === modifierOption.group_id
        );
        
        if (!belongsToItem) {
            errors.push(`Modifier "${modifierOption.name}" is not available for this item`);
            continue;
        }
        
        // Group by modifier group
        if (!selectedByGroup[modifierOption.group_id]) {
            selectedByGroup[modifierOption.group_id] = [];
        }
        selectedByGroup[modifierOption.group_id].push(modifierOption);
        
        validatedModifiers.push({
            modifier_group_id: modifierOption.group_id,
            modifier_option_id: modifierOption.id,
            group_name: modifierOption.group?.name || 'Unknown Group',
            option_name: modifierOption.name,
            price_adjustment: modifierOption.price_adjustment,
        });
    }
    
    // Validate min/max selections for each group
    for (const modGroup of modifierGroups) {
        // modGroup is already a ModifierGroup object
        const selectedCount = selectedByGroup[modGroup.id]?.length || 0;
        
        if (modGroup.is_required && selectedCount === 0) {
            errors.push(`Please select at least one option for "${modGroup.name}"`);
        }
        
        if (modGroup.min_selections && selectedCount < modGroup.min_selections) {
            errors.push(
                `"${modGroup.name}" requires at least ${modGroup.min_selections} selection(s)`
            );
        }
        
        if (modGroup.max_selections && selectedCount > modGroup.max_selections) {
            errors.push(
                `"${modGroup.name}" allows maximum ${modGroup.max_selections} selection(s)`
            );
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        validatedModifiers,
    };
};

/**
 * Calculate cart item price with modifiers
 * @param {Number} basePrice - Base price of menu item
 * @param {Number} quantity - Quantity
 * @param {Array} modifiers - Array of validated modifiers
 * @returns {Object} { subtotal, modifiersTotal, totalPrice }
 */
exports.calculateCartItemPrice = (basePrice, quantity, modifiers = []) => {
    const subtotal = parseFloat(basePrice) * quantity;
    
    const modifiersTotal = modifiers.reduce((sum, mod) => {
        return sum + parseFloat(mod.price_adjustment || 0) * quantity;
    }, 0);
    
    const totalPrice = subtotal + modifiersTotal;
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        modifiersTotal: parseFloat(modifiersTotal.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
    };
};

/**
 * Calculate total cart value
 * @param {Array} cartItems - Array of validated cart items with prices
 * @returns {Object} { subtotal, tax, total, itemCount }
 */
exports.calculateCartTotal = (cartItems) => {
    const subtotal = cartItems.reduce((sum, item) => {
        const itemPrice = this.calculateCartItemPrice(
            item.menuItem.price,
            item.quantity,
            item.modifiers
        );
        return sum + itemPrice.totalPrice;
    }, 0);
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        itemCount,
    };
};

/**
 * Get cart summary with full details
 * @param {Array} cartItems - Raw cart items from frontend
 * @returns {Object} Cart summary with validation and pricing
 */
exports.getCartSummary = async (cartItems) => {
    const validation = await this.validateCartItems(cartItems);
    
    if (!validation.valid) {
        return {
            valid: false,
            errors: validation.errors,
            summary: null,
        };
    }
    
    const totals = this.calculateCartTotal(validation.validatedItems);
    
    const itemsWithPricing = validation.validatedItems.map((item) => {
        const pricing = this.calculateCartItemPrice(
            item.menuItem.price,
            item.quantity,
            item.modifiers
        );
        
        return {
            ...item,
            pricing,
        };
    });
    
    return {
        valid: true,
        errors: [],
        summary: {
            items: itemsWithPricing,
            totals,
        },
    };
};

/**
 * Check if cart can be converted to order
 * Validates all items and ensures they meet order requirements
 * @param {Array} cartItems - Cart items to validate
 * @returns {Object} { canOrder: boolean, reason: String }
 */
exports.canConvertToOrder = async (cartItems) => {
    const validation = await this.validateCartItems(cartItems);
    
    if (!validation.valid) {
        return {
            canOrder: false,
            reason: validation.errors.join("; "),
        };
    }
    
    // Check if cart is empty
    if (validation.validatedItems.length === 0) {
        return {
            canOrder: false,
            reason: "Cart is empty",
        };
    }
    
    // All checks passed
    return {
        canOrder: true,
        reason: null,
    };
};

module.exports = exports;
