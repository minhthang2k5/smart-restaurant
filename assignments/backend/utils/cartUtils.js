/**
 * Cart Utilities
 * Helper functions for cart operations and formatting
 */

/**
 * Format cart item for display
 * @param {Object} cartItem - Cart item with menuItem and modifiers
 * @returns {Object} Formatted cart item
 */
exports.formatCartItem = (cartItem) => {
    const { menuItem, quantity, modifiers, specialInstructions } = cartItem;
    
    const modifierNames = modifiers.map((mod) => mod.option_name).join(", ");
    
    return {
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        basePrice: parseFloat(menuItem.price),
        quantity,
        modifiers: modifiers.map((mod) => ({
            groupName: mod.group_name,
            optionName: mod.option_name,
            priceAdjustment: parseFloat(mod.price_adjustment || 0),
        })),
        modifiersSummary: modifierNames || "No modifiers",
        specialInstructions: specialInstructions || null,
    };
};

/**
 * Format cart summary for API response
 * @param {Object} cartSummary - Cart summary from cartService
 * @returns {Object} Formatted response
 */
exports.formatCartSummaryResponse = (cartSummary) => {
    if (!cartSummary.valid) {
        return {
            success: false,
            errors: cartSummary.errors,
            cart: null,
        };
    }
    
    const formattedItems = cartSummary.summary.items.map((item) => ({
        menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            basePrice: parseFloat(item.menuItem.price),
            photos: item.menuItem.photos || [],
        },
        quantity: item.quantity,
        modifiers: item.modifiers.map((mod) => ({
            groupName: mod.group_name,
            optionName: mod.option_name,
            priceAdjustment: parseFloat(mod.price_adjustment || 0),
        })),
        specialInstructions: item.specialInstructions,
        pricing: {
            subtotal: item.pricing.subtotal,
            modifiersTotal: item.pricing.modifiersTotal,
            totalPrice: item.pricing.totalPrice,
        },
    }));
    
    return {
        success: true,
        errors: [],
        cart: {
            items: formattedItems,
            itemCount: cartSummary.summary.totals.itemCount,
            subtotal: cartSummary.summary.totals.subtotal,
            tax: cartSummary.summary.totals.tax,
            total: cartSummary.summary.totals.total,
        },
    };
};

/**
 * Merge duplicate items in cart
 * If same menuItemId with same modifiers, merge quantities
 * @param {Array} cartItems - Array of cart items
 * @returns {Array} Merged cart items
 */
exports.mergeDuplicateItems = (cartItems) => {
    const merged = [];
    
    for (const item of cartItems) {
        const modifierIds = (item.modifiers || [])
            .map((m) => m.optionId)
            .sort()
            .join(",");
        
        const existingIndex = merged.findIndex((m) => {
            const existingModifierIds = (m.modifiers || [])
                .map((mod) => mod.optionId)
                .sort()
                .join(",");
            
            return (
                m.menuItemId === item.menuItemId &&
                existingModifierIds === modifierIds &&
                m.specialInstructions === item.specialInstructions
            );
        });
        
        if (existingIndex >= 0) {
            // Merge quantities
            merged[existingIndex].quantity += item.quantity;
        } else {
            // Add new item
            merged.push({ ...item });
        }
    }
    
    return merged;
};

/**
 * Remove item from cart
 * @param {Array} cartItems - Array of cart items
 * @param {String} menuItemId - Menu item ID to remove
 * @param {Number} index - Optional index if multiple items with same ID
 * @returns {Array} Updated cart items
 */
exports.removeItemFromCart = (cartItems, menuItemId, index = null) => {
    if (index !== null) {
        return cartItems.filter((_, i) => i !== index);
    }
    
    const itemIndex = cartItems.findIndex((item) => item.menuItemId === menuItemId);
    
    if (itemIndex >= 0) {
        return [...cartItems.slice(0, itemIndex), ...cartItems.slice(itemIndex + 1)];
    }
    
    return cartItems;
};

/**
 * Update item quantity in cart
 * @param {Array} cartItems - Array of cart items
 * @param {Number} index - Index of item to update
 * @param {Number} newQuantity - New quantity
 * @returns {Array} Updated cart items
 */
exports.updateItemQuantity = (cartItems, index, newQuantity) => {
    if (index < 0 || index >= cartItems.length) {
        throw new Error("Invalid item index");
    }
    
    if (newQuantity < 1) {
        throw new Error("Quantity must be at least 1");
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity,
    };
    
    return updatedItems;
};

/**
 * Clear all items from cart
 * @returns {Array} Empty cart
 */
exports.clearCart = () => {
    return [];
};

/**
 * Generate cart item display name
 * Includes item name and modifiers summary
 * @param {String} itemName - Menu item name
 * @param {Array} modifiers - Array of modifier objects
 * @returns {String} Display name
 */
exports.getCartItemDisplayName = (itemName, modifiers = []) => {
    if (!modifiers || modifiers.length === 0) {
        return itemName;
    }
    
    const modifierNames = modifiers.map((mod) => mod.option_name).join(", ");
    return `${itemName} (${modifierNames})`;
};

/**
 * Validate cart size limits
 * @param {Array} cartItems - Cart items
 * @param {Object} limits - { maxItems, maxQuantityPerItem, maxTotalQuantity }
 * @returns {Object} { valid: boolean, errors: Array }
 */
exports.validateCartLimits = (cartItems, limits = {}) => {
    const errors = [];
    const defaults = {
        maxItems: 50,
        maxQuantityPerItem: 99,
        maxTotalQuantity: 100,
    };
    
    const { maxItems, maxQuantityPerItem, maxTotalQuantity } = {
        ...defaults,
        ...limits,
    };
    
    // Check max items
    if (cartItems.length > maxItems) {
        errors.push(`Cart cannot contain more than ${maxItems} items`);
    }
    
    // Check individual item quantities
    for (const item of cartItems) {
        if (item.quantity > maxQuantityPerItem) {
            errors.push(
                `Quantity for each item cannot exceed ${maxQuantityPerItem}`
            );
            break;
        }
    }
    
    // Check total quantity
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > maxTotalQuantity) {
        errors.push(`Total quantity cannot exceed ${maxTotalQuantity} items`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Convert cart items to order items format
 * Used when creating order from cart
 * @param {Array} validatedCartItems - Validated cart items from cartService
 * @returns {Array} Order items format
 */
exports.convertCartToOrderItems = (validatedCartItems) => {
    return validatedCartItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        modifiers: item.modifiers.map((mod) => ({
            optionId: mod.modifier_option_id,
        })),
    }));
};

/**
 * Get cart statistics
 * @param {Array} cartItems - Cart items
 * @returns {Object} Statistics
 */
exports.getCartStatistics = (cartItems) => {
    const totalItems = cartItems.length;
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const itemsWithModifiers = cartItems.filter(
        (item) => item.modifiers && item.modifiers.length > 0
    ).length;
    const itemsWithInstructions = cartItems.filter(
        (item) => item.specialInstructions
    ).length;
    
    return {
        totalItems,
        totalQuantity,
        itemsWithModifiers,
        itemsWithInstructions,
        averageQuantityPerItem:
            totalItems > 0 ? (totalQuantity / totalItems).toFixed(2) : 0,
    };
};

module.exports = exports;
