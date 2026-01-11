# Cart API Documentation

## Overview
Cart API cung cấp các endpoint để validate và tính toán giỏ hàng trước khi tạo order. 

**Lưu ý quan trọng:** 
- Cart chỉ tồn tại ở **client-side** (localStorage/state management)
- Các API này giúp **validate** và **preview** trước khi place order
- Khi place order, cart items được gửi qua `POST /api/sessions/:id/orders`

## Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │
       │ 1. Add items to cart (client-side)
       │ 2. Validate cart
       ▼
┌─────────────────┐
│   Cart API      │
│  /api/cart/*    │
└────────┬────────┘
         │
         │ 3. Place order
         ▼
┌──────────────────┐
│   Session API    │
│ /api/sessions    │
└──────────────────┘
```

## Cart Item Structure

```javascript
{
  menuItemId: "uuid-string",      // Required
  quantity: 2,                    // Required, min: 1
  specialInstructions: "No onions", // Optional
  modifiers: [                    // Optional
    {
      optionId: "uuid-string"     // Required if modifiers provided
    }
  ]
}
```

---

## API Endpoints

### 1. Validate Cart
**Endpoint:** `POST /api/cart/validate`

**Purpose:** Validate cart items trước khi place order

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 2,
      "specialInstructions": "Extra spicy",
      "modifiers": [
        {
          "optionId": "7494fcf4-ed49-475f-a035-8fba289862ad"
        }
      ]
    },
    {
      "menuItemId": "ca078bca-2dd6-4679-a110-da6302df6006",
      "quantity": 1
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart is valid",
  "validatedItems": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "menuItem": {
        "id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
        "name": "Grilled Chicken",
        "description": "Tender grilled chicken",
        "price": "12.50",
        "status": "available"
      },
      "quantity": 2,
      "specialInstructions": "Extra spicy",
      "modifiers": [
        {
          "modifier_group_id": "group-uuid",
          "modifier_option_id": "7494fcf4-ed49-475f-a035-8fba289862ad",
          "group_name": "Size",
          "option_name": "Large",
          "price_adjustment": "2.00"
        }
      ]
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "errors": [
    "Item 1: \"Grilled Chicken\" is currently sold out",
    "Item 2: Modifier option not found"
  ],
  "validatedItems": []
}
```

**Use Case:**
```javascript
// Frontend usage
const validateCart = async () => {
  const response = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    alert('Cart validation failed: ' + result.errors.join(', '));
    return false;
  }
  
  return true;
};
```

---

### 2. Get Cart Summary
**Endpoint:** `POST /api/cart/summary`

**Purpose:** Lấy tổng hợp giỏ hàng với giá chi tiết

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 2,
      "modifiers": [
        {
          "optionId": "7494fcf4-ed49-475f-a035-8fba289862ad"
        }
      ]
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "errors": [],
  "cart": {
    "items": [
      {
        "menuItem": {
          "id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
          "name": "Grilled Chicken",
          "basePrice": 12.50
        },
        "quantity": 2,
        "modifiers": [
          {
            "groupName": "Size",
            "optionName": "Large",
            "priceAdjustment": 2.00
          }
        ],
        "specialInstructions": null,
        "pricing": {
          "subtotal": 25.00,
          "modifiersTotal": 4.00,
          "totalPrice": 29.00
        }
      }
    ],
    "itemCount": 2,
    "subtotal": 29.00,
    "tax": 2.90,
    "total": 31.90
  }
}
```

**Use Case:**
```javascript
// Display cart summary
const getCartSummary = async () => {
  const response = await fetch('/api/cart/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  const { cart: cartSummary } = await response.json();
  
  // Update UI
  document.getElementById('subtotal').textContent = `$${cartSummary.subtotal}`;
  document.getElementById('tax').textContent = `$${cartSummary.tax}`;
  document.getElementById('total').textContent = `$${cartSummary.total}`;
};
```

---

### 3. Check Can Convert to Order
**Endpoint:** `POST /api/cart/can-order`

**Purpose:** Kiểm tra xem cart có thể place order không

**Request Body:**
```json
{
  "items": [...]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "canOrder": true,
  "reason": null
}
```

**Cannot Order Response (200):**
```json
{
  "success": true,
  "canOrder": false,
  "reason": "Item 1: \"Special Fish\" is currently sold out"
}
```

**Use Case:**
```javascript
// Before showing "Place Order" button
const checkCanOrder = async () => {
  const response = await fetch('/api/cart/can-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  const result = await response.json();
  
  if (result.canOrder) {
    enablePlaceOrderButton();
  } else {
    disablePlaceOrderButton();
    showMessage(result.reason);
  }
};
```

---

### 4. Merge Duplicate Items
**Endpoint:** `POST /api/cart/merge`

**Purpose:** Gộp các items giống nhau trong cart

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 2
    },
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 3
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Items merged successfully",
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 5
    }
  ],
  "originalCount": 2,
  "mergedCount": 1
}
```

---

### 5. Calculate Single Item Price
**Endpoint:** `POST /api/cart/calculate-item`

**Purpose:** Tính giá một item với modifiers

**Request Body:**
```json
{
  "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
  "quantity": 2,
  "modifiers": [
    {
      "optionId": "7494fcf4-ed49-475f-a035-8fba289862ad"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "menuItem": {
    "id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
    "name": "Grilled Chicken",
    "basePrice": 12.50
  },
  "quantity": 2,
  "modifiers": [
    {
      "groupName": "Size",
      "optionName": "Large",
      "priceAdjustment": 2.00
    }
  ],
  "pricing": {
    "subtotal": 25.00,
    "modifiersTotal": 4.00,
    "totalPrice": 29.00
  }
}
```

**Use Case:**
```javascript
// Update price when user selects modifiers
const updateItemPrice = async () => {
  const response = await fetch('/api/cart/calculate-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menuItemId: currentItem.id,
      quantity: selectedQuantity,
      modifiers: selectedModifiers
    })
  });
  
  const { pricing } = await response.json();
  document.getElementById('item-price').textContent = `$${pricing.totalPrice}`;
};
```

---

### 6. Get Cart Statistics
**Endpoint:** `POST /api/cart/statistics`

**Purpose:** Lấy thống kê về cart

**Request Body:**
```json
{
  "items": [...]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statistics": {
    "totalItems": 5,
    "totalQuantity": 12,
    "itemsWithModifiers": 3,
    "itemsWithInstructions": 2,
    "averageQuantityPerItem": "2.40"
  }
}
```

---

## Frontend Integration Guide

### Complete Cart Flow

```javascript
// 1. Initialize cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 2. Add item to cart
const addToCart = async (menuItemId, quantity, modifiers, specialInstructions) => {
  // Add to local cart
  cart.push({
    menuItemId,
    quantity,
    modifiers,
    specialInstructions
  });
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Validate and get summary
  const summary = await getCartSummary();
  updateCartUI(summary);
};

// 3. Get cart summary
const getCartSummary = async () => {
  const response = await fetch('/api/cart/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  return await response.json();
};

// 4. Place order
const placeOrder = async () => {
  // Validate cart first
  const canOrder = await checkCanOrder();
  if (!canOrder) return;
  
  // Get session ID
  const sessionId = localStorage.getItem('sessionId');
  
  // Create order in session
  const response = await fetch(`/api/sessions/${sessionId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  const { data: order } = await response.json();
  
  // Clear cart after successful order
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Show success message
  alert(`Order placed! Order #${order.order_number}`);
  
  // Navigate to order status
  window.location.href = '/order-status';
};

// 5. Check if can order
const checkCanOrder = async () => {
  const response = await fetch('/api/cart/can-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart })
  });
  
  const result = await response.json();
  
  if (!result.canOrder) {
    alert(result.reason);
    return false;
  }
  
  return true;
};
```

---

## React/Redux Example

```javascript
// Redux cart slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to validate cart
export const validateCart = createAsyncThunk(
  'cart/validate',
  async (items) => {
    const response = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return await response.json();
  }
);

// Async thunk to get cart summary
export const getCartSummary = createAsyncThunk(
  'cart/summary',
  async (items) => {
    const response = await fetch('/api/cart/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return await response.json();
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    summary: null,
    loading: false,
    error: null
  },
  reducers: {
    addToCart: (state, action) => {
      state.items.push(action.payload);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((_, index) => index !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload;
      state.items[index].quantity = quantity;
    },
    clearCart: (state) => {
      state.items = [];
      state.summary = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCartSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCartSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.cart;
      })
      .addCase(getCartSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

---

## Error Handling

### Common Errors

1. **Cart validation failed**
```json
{
  "success": false,
  "errors": [
    "Item 1: Menu item not found",
    "Item 2: Quantity must be at least 1"
  ]
}
```

2. **Item sold out**
```json
{
  "success": false,
  "errors": [
    "Item 1: \"Special Fish\" is currently sold out"
  ]
}
```

3. **Invalid modifiers**
```json
{
  "success": false,
  "errors": [
    "Item 1: Please select at least one option for \"Size\"",
    "Item 1: \"Spice Level\" allows maximum 1 selection(s)"
  ]
}
```

4. **Cart limits exceeded**
```json
{
  "success": false,
  "errors": [
    "Cart cannot contain more than 50 items",
    "Total quantity cannot exceed 100 items"
  ]
}
```

---

## Best Practices

### 1. Validate Before Order
```javascript
// Always validate cart before placing order
const placeOrder = async () => {
  // Step 1: Validate
  const validation = await validateCart(cart);
  if (!validation.success) {
    showErrors(validation.errors);
    return;
  }
  
  // Step 2: Check if can order
  const canOrderCheck = await checkCanOrder(cart);
  if (!canOrderCheck.canOrder) {
    alert(canOrderCheck.reason);
    return;
  }
  
  // Step 3: Place order
  await createOrder(cart);
};
```

### 2. Real-time Price Updates
```javascript
// Update price when modifiers change
const handleModifierChange = async () => {
  const pricing = await calculateItemPrice(
    menuItemId,
    quantity,
    selectedModifiers
  );
  
  updatePriceDisplay(pricing.totalPrice);
};
```

### 3. Merge Duplicates
```javascript
// Merge duplicates before displaying cart
const displayCart = async () => {
  const merged = await mergeDuplicates(cart);
  cart = merged.items;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCartItems(cart);
};
```

### 4. Error Recovery
```javascript
// Handle validation errors gracefully
const handleValidationErrors = (errors) => {
  errors.forEach(error => {
    if (error.includes('sold out')) {
      // Mark item as unavailable in UI
      markItemUnavailable(error);
    } else if (error.includes('modifier')) {
      // Show modifier selection error
      highlightModifierError(error);
    }
  });
};
```

---

## Testing

### Postman Examples

**1. Validate Cart**
```bash
POST http://localhost:3000/api/cart/validate
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 2
    }
  ]
}
```

**2. Get Summary**
```bash
POST http://localhost:3000/api/cart/summary
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
      "quantity": 2,
      "modifiers": [
        {
          "optionId": "7494fcf4-ed49-475f-a035-8fba289862ad"
        }
      ]
    }
  ]
}
```

---

## Notes

1. **Cart is client-side only** - Không lưu trữ cart trên server
2. **Validation is optional** - Frontend có thể skip validation nhưng nên validate
3. **Real-time updates** - Gọi summary API khi cart thay đổi để update giá
4. **Session integration** - Cart được convert thành Order qua Session API

---

## Related APIs

- [Session API](./ORDER.md#session-api) - Create session and place orders
- [Order API](./ORDER.md#order-api) - Track order status
- [Menu API](./MENU_API_DOCUMENTATION.md) - Get menu items and modifiers
