# Order Management System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [API Endpoints - Complete Reference](#api-endpoints)
   - [Session API](#session-api)
   - [Order API](#order-api)
5. [Frontend Integration Guide](#frontend-integration-guide)
6. [Workflow Examples](#workflow-examples)

## Overview
Hệ thống quản lý Order được thiết kế theo mô hình **Session-based**, cho phép khách hàng tạo nhiều orders riêng biệt trong cùng một phiên ngồi, mỗi order có thể được waiter xử lý độc lập.

## Architecture

### Session-Based Design
- **TableSession**: Nhóm nhiều orders lại với nhau cho một bàn
- **Order**: Mỗi lần khách order được tạo thành một order riêng
- **OrderItem**: Các món ăn trong mỗi order
- **OrderItemModifier**: Các tùy chọn cho từng món (size, topping, etc.)

### Why Session-Based?
**Vấn đề với single-order approach:**
- Khách order món chính → waiter accept
- Khách order thêm đồ uống 15 phút sau → waiter không thể accept được vì order đã accepted
- Không linh hoạt cho trường hợp khách order nhiều lần

**Giải pháp với Session-based:**
- Tạo một Session khi khách vào bàn
- Mỗi lần khách order tạo một Order mới trong Session
- Waiter có thể accept/reject từng Order độc lập
- Cuối cùng tính tiền chung toàn bộ Session

## Data Models

### Order Model
```javascript
{
  id: UUID,
  session_id: UUID,          // Thuộc về Session nào
  table_id: UUID,
  customer_id: UUID,
  order_number: String,      // "ORD-20251231-0001"
  status: Enum,              // pending, accepted, preparing, ready, served, completed, rejected
  rejection_reason: String,
  subtotal: Decimal,
  tax_amount: Decimal,
  discount_amount: Decimal,
  total_amount: Decimal,
  notes: Text,
  waiter_id: UUID,
  accepted_at: DateTime,
  completed_at: DateTime
}
```

### Order Status Flow
1. **pending** → Mới tạo, chờ waiter xử lý
2. **accepted** → Waiter đã accept, gửi vào bếp
3. **preparing** → Bếp đang làm
4. **ready** → Món đã sẵn sàng
5. **served** → Đã phục vụ cho khách
6. **completed** → Hoàn thành (khi Session complete)
7. **rejected** → Bị từ chối (hết món, không làm được, etc.)

### OrderItem Model
```javascript
{
  id: UUID,
  order_id: UUID,
  menu_item_id: UUID,
  item_name: String,
  item_price: Decimal,
  quantity: Integer,
  subtotal: Decimal,
  special_instructions: Text,
  status: Enum,              // pending, confirmed, preparing, ready, served
  created_at: DateTime,
  updated_at: DateTime
}
```

### TableSession Model
```javascript
{
  id: UUID,
  restaurant_id: UUID,
  table_id: UUID,
  customer_id: UUID,
  session_number: String,    // "SESS-20251231-0001"
  status: Enum,              // active, completed, cancelled
  subtotal: Decimal,         // Tổng của tất cả orders
  tax_amount: Decimal,
  total_amount: Decimal,
  payment_method: Enum,      // cash, card, zalopay
  payment_status: Enum,      // pending, completed, failed
  payment_transaction_id: String,
  created_at: DateTime,
  completed_at: DateTime
}
```

---

## API Endpoints

# SESSION API

### 1. Create Table Session
```http
POST /api/sessions
Content-Type: application/json

{
  "tableId": "e184f588-458d-4aa2-95ca-4c26aa1e5d65"
}
```

**Purpose:** Tạo session mới khi khách vào bàn

**Access:** Public (Customer can start session via QR code)

**Request Body:**
```javascript
{
  tableId: String (UUID, required)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "session_number": "SESS-20251231-0001",
    "table_id": "e184f588-458d-4aa2-95ca-4c26aa1e5d65",
    "status": "active",
    "subtotal": "0.00",
    "total_amount": "0.00",
    "created_at": "2025-12-31T08:00:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Table already has an active session"
}
```

**Frontend Flow:**
1. Khách scan QR code → lấy được `tableId`
2. Gọi `POST /api/sessions` với `tableId`
3. Lưu `sessionId` vào localStorage/state
4. Redirect đến menu page

---

### 2. Get Active Session by Table ID
```http
GET /api/sessions/table/:tableId
```

**Purpose:** Lấy session đang active của một bàn

**Access:** Public

**URL Parameters:**
- `tableId` (UUID, required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "session_number": "SESS-20251231-0001",
    "table_id": "e184f588-458d-4aa2-95ca-4c26aa1e5d65",
    "status": "active",
    "subtotal": "44.50",
    "total_amount": "44.50",
    "created_at": "2025-12-31T08:00:00Z",
    "table": {
      "id": "e184f588-458d-4aa2-95ca-4c26aa1e5d65",
      "table_number": "T1",
      "location": "Indoor"
    },
    "orders": [
      {
        "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
        "order_number": "ORD-20251231-0001",
        "status": "accepted",
        "total_amount": "25.00",
        "items": [...]
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "No active session found for this table"
}
```

**Frontend Flow:**
1. Khi khách vào trang, kiểm tra xem bàn đã có session chưa
2. Nếu có → hiển thị orders hiện tại
3. Nếu không → tạo session mới

---

### 3. Get Session by ID
```http
GET /api/sessions/:id
```

**Purpose:** Lấy chi tiết session với tất cả orders

**Access:** Public

**URL Parameters:**
- `id` (UUID, required) - Session ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "session_number": "SESS-20251231-0001",
    "status": "active",
    "subtotal": "44.50",
    "tax_amount": "0.00",
    "total_amount": "44.50",
    "table": {
      "table_number": "T1",
      "location": "Indoor"
    },
    "orders": [
      {
        "id": "order-uuid-1",
        "order_number": "ORD-20251231-0001",
        "status": "accepted",
        "subtotal": "25.00",
        "items": [
          {
            "id": "item-uuid",
            "item_name": "Grilled Chicken",
            "quantity": 2,
            "item_price": "12.50",
            "total_price": "25.00",
            "status": "confirmed"
          }
        ]
      }
    ]
  }
}
```

**Frontend Flow:**
1. Dùng để refresh toàn bộ thông tin session
2. Hiển thị tổng bill hiện tại
3. List tất cả orders đã tạo

---

### 4. Create Order in Session
```http
POST /api/sessions/:id/orders
Content-Type: application/json

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
    }
  ]
}
```

**Purpose:** Tạo order mới trong session (mỗi lần khách order)

**Access:** Public (Customer can order)

**URL Parameters:**
- `id` (UUID, required) - Session ID

**Request Body:**
```javascript
{
  items: [
    {
      menuItemId: String (UUID, required),
      quantity: Number (required, min: 1),
      specialInstructions: String (optional),
      modifiers: [
        {
          optionId: String (UUID, required)
        }
      ] (optional)
    }
  ] (required, min: 1 item)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "c35265d2-42b3-4d17-a45b-8afae8501171",
    "order_number": "ORD-20251231-0004",
    "session_id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "status": "pending",
    "subtotal": "25.00",
    "total_amount": "25.00",
    "items": [
      {
        "id": "1fc0fc80-e8cb-4f03-97bc-c5572e64c0d8",
        "item_name": "Grilled Chicken Special",
        "quantity": 2,
        "item_price": "12.50",
        "total_price": "25.00",
        "special_instructions": "Extra spicy",
        "status": "pending",
        "modifiers": [
          {
            "id": "mod-uuid",
            "option_name": "Large Size",
            "price_adjustment": "2.00"
          }
        ]
      }
    ]
  }
}
```

**Frontend Flow:**
1. Khách add món vào cart
2. Khách click "Place Order"
3. Gọi API này với danh sách items
4. Hiển thị notification "Order placed"
5. Update UI với order mới (status: pending)

---

### 5. Complete Session (Payment)
```http
POST /api/sessions/:id/complete
Content-Type: application/json

{
  "paymentMethod": "cash",
  "transactionId": "TXN-12345"
}
```

**Purpose:** Hoàn thành session và xử lý thanh toán

**Access:** Public (Customer pays) or Staff

**URL Parameters:**
- `id` (UUID, required) - Session ID

**Request Body:**
```javascript
{
  paymentMethod: String (required, enum: "cash" | "card" | "zalopay"),
  transactionId: String (optional, required for card/zalopay)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session completed and payment processed",
  "data": {
    "id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "session_number": "SESS-20251231-0001",
    "status": "completed",
    "subtotal": "44.50",
    "tax_amount": "0.00",
    "total_amount": "44.50",
    "payment_method": "cash",
    "payment_status": "completed",
    "completed_at": "2025-12-31T10:30:00Z",
    "orders": [...]
  }
}
```

**Frontend Flow:**
1. Khách click "Pay Bill"
2. Hiển thị payment modal với tổng tiền
3. Chọn payment method
4. Gọi API complete session
5. Redirect to "Thank You" page

---

### 6. Cancel Session
```http
POST /api/sessions/:id/cancel
```

**Purpose:** Hủy session (staff only)

**Access:** Staff (should add authenticate + authorize)

**URL Parameters:**
- `id` (UUID, required) - Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session cancelled successfully"
}
```

**Frontend Flow:**
1. Staff/Manager có thể hủy session
2. Tất cả orders trong session bị hủy
3. Bàn được free

---

# ORDER API

### 7. Get Active Order for Table
```http
GET /api/orders/table/:tableId
```

**Purpose:** Khách xem order hiện tại của bàn mình

**Access:** Public (Customer can view their order)

**URL Parameters:**
- `tableId` (UUID, required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
    "order_number": "ORD-20251231-0001",
    "status": "accepted",
    "total_amount": "25.00",
    "items": [
      {
        "id": "dd478f50-3122-4981-91a5-cf337eb551b7",
        "item_name": "Grilled Chicken Special",
        "quantity": 2,
        "total_price": "25.00",
        "status": "confirmed"
      }
    ]
  }
}
```

**Frontend Flow:**
1. Không dùng nhiều vì đã có session API
2. Có thể dùng để check status 1 order cụ thể

---

### 8. Get Order by ID
```http
GET /api/orders/:id
```

**Purpose:** Xem chi tiết một order cụ thể

**Access:** Public (Customer can view their order)

**URL Parameters:**
- `id` (UUID, required) - Order ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
    "order_number": "ORD-20251231-0001",
    "session_id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "status": "accepted",
    "subtotal": "25.00",
    "total_amount": "25.00",
    "created_at": "2025-12-31T08:42:00Z",
    "items": [...]
  }
}
```

**Frontend Flow:**
1. Xem chi tiết 1 order
2. Track order status realtime

---

### 9. Get All Orders with Filters (Admin/Waiter)
```http
GET /api/orders?status=pending&tableId=xxx&date=2025-12-31&limit=50
Authorization: Bearer <token>
```

**Purpose:** Admin/Waiter xem danh sách tất cả orders

**Access:** Private (Admin/Waiter only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**Query Parameters:**
- `status` (optional): Filter theo status (pending, accepted, preparing, ready, served, completed, rejected)
- `tableId` (optional): Filter theo bàn (UUID)
- `date` (optional): Filter theo ngày (YYYY-MM-DD)
- `limit` (optional): Giới hạn số kết quả (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "c35265d2-42b3-4d17-a45b-8afae8501171",
      "order_number": "ORD-20251231-0004",
      "status": "pending",
      "total_amount": "25.00",
      "table": {
        "table_number": "T1",
        "location": "Indoor"
      },
      "items": [
        {
          "id": "1fc0fc80-e8cb-4f03-97bc-c5572e64c0d8",
          "item_name": "Grilled Chicken Special",
          "quantity": 2,
          "total_price": "25.00",
          "status": "pending"
        }
      ]
    }
  ]
}
```

**Frontend Flow (Waiter App):**
1. Dashboard hiển thị pending orders
2. Filter orders by table, status, date
3. Click vào order → xem chi tiết → accept/reject

---

### 10. Accept Order (Waiter)
```http
POST /api/orders/:id/accept
Authorization: Bearer <token>
```

**Purpose:** Waiter xác nhận nhận order, gửi vào bếp

**Access:** Private (Waiter/Admin only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**URL Parameters:**
- `id` (UUID, required) - Order ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
    "status": "accepted",
    "waiter_id": "waiter-uuid",
    "accepted_at": "2025-12-31T10:00:00Z"
  }
}
```

**Business Logic:**
- Cập nhật `status` → `accepted`
- Lưu `waiter_id` và `accepted_at`
- Tất cả items trong order → status `confirmed`

**Frontend Flow (Waiter App):**
1. Waiter xem pending orders
2. Click "Accept" button
3. Gọi API này
4. Order chuyển sang accepted
5. Show trong kitchen display

---

### 11. Reject Order (Waiter)
```http
POST /api/orders/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Dish not available"
}
```

**Purpose:** Waiter từ chối order (hết món, không làm được, etc.)

**Access:** Private (Waiter/Admin only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**URL Parameters:**
- `id` (UUID, required) - Order ID

**Request Body:**
```javascript
{
  reason: String (required) // Lý do từ chối
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order rejected",
  "data": {
    "id": "c35265d2-42b3-4d17-a45b-8afae8501171",
    "status": "rejected",
    "rejection_reason": "Dish not available"
  }
}
```

**Business Logic:**
- Cập nhật `status` → `rejected`
- Lưu `rejection_reason`
- Refund lại total_amount

**Frontend Flow (Waiter App):**
1. Waiter click "Reject"
2. Hiển thị modal nhập lý do
3. Gọi API với reason
4. Notify customer về rejected order

---

### 12. Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

**Purpose:** Cập nhật trạng thái order (preparing → ready → served)

**Access:** Private (Waiter/Admin only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**URL Parameters:**
- `id` (UUID, required) - Order ID

**Request Body:**
```javascript
{
  status: String (required, enum: "preparing" | "ready" | "served" | "completed")
}
```

**Valid Status Transitions:**
- `accepted` → `preparing`
- `preparing` → `ready`
- `ready` → `served`
- `served` → `completed`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
    "status": "preparing"
  }
}
```

**Frontend Flow (Kitchen Display):**
1. Kitchen nhận order → click "Start Preparing"
2. Món làm xong → click "Mark Ready"
3. Waiter mang ra → click "Mark Served"

---

### 13. Update Order Item Status
```http
PATCH /api/orders/items/:itemId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

**Purpose:** Kitchen Display cập nhật status từng món

**Access:** Private (Waiter/Admin only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**URL Parameters:**
- `itemId` (UUID, required) - Order Item ID

**Request Body:**
```javascript
{
  status: String (required, enum: "preparing" | "ready" | "served")
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order item status updated",
  "data": {
    "id": "dd478f50-3122-4981-91a5-cf337eb551b7",
    "status": "preparing"
  }
}
```

**Frontend Flow (Kitchen Display):**
1. Hiển thị từng món trong order
2. Chef click vào món → "Start", "Ready", "Served"
3. Update từng món độc lập

---

### 14. Complete Order
```http
POST /api/orders/:id/complete
Authorization: Bearer <token>
```

**Purpose:** Đánh dấu order hoàn thành (không có payment ở đây)

**Access:** Private (Waiter/Admin only)

**Authorization:** `authenticate` + `authorize(['admin', 'waiter'])`

**URL Parameters:**
- `id` (UUID, required) - Order ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order completed",
  "data": {
    "id": "4bad156e-0a2e-41d5-95c3-4aab477bf99e",
    "status": "completed",
    "completed_at": "2025-12-31T11:00:00Z"
  }
}
```

**Note:** Payment được xử lý ở Session level (API #5), không phải Order level

**Frontend Flow:**
1. Không dùng nhiều vì payment ở Session
2. Có thể dùng để mark order done trước khi session complete

---

## Frontend Integration Guide

### For Customer App (QR Ordering)

#### Step 1: Scan QR & Create Session
```javascript
// Khách scan QR code → lấy được tableId
const tableId = "e184f588-458d-4aa2-95ca-4c26aa1e5d65";

// Check if table already has active session
const checkSession = await fetch(`/api/sessions/table/${tableId}`);

if (checkSession.ok) {
  // Session exists → use existing
  const { data } = await checkSession.json();
  sessionId = data.id;
} else {
  // Create new session
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId })
  });
  const { data } = await response.json();
  sessionId = data.id;
}

// Save sessionId to localStorage
localStorage.setItem('sessionId', sessionId);
```

#### Step 2: Browse Menu & Add to Cart
```javascript
// Customer adds items to cart (client-side only)
const cart = [
  {
    menuItemId: "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
    quantity: 2,
    specialInstructions: "Extra spicy",
    modifiers: [
      { optionId: "7494fcf4-ed49-475f-a035-8fba289862ad" }
    ]
  },
  {
    menuItemId: "ca078bca-2dd6-4679-a110-da6302df6006",
    quantity: 1
  }
];
```

#### Step 3: Place Order
```javascript
// Customer clicks "Place Order"
const sessionId = localStorage.getItem('sessionId');

const response = await fetch(`/api/sessions/${sessionId}/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: cart })
});

const { data: newOrder } = await response.json();

// Show success message
alert(`Order placed! Order number: ${newOrder.order_number}`);

// Clear cart
cart = [];

// Show order status: "Waiting for waiter to confirm..."
```

#### Step 4: View Order Status (Real-time)
```javascript
// Poll session every 5 seconds to check order status
setInterval(async () => {
  const response = await fetch(`/api/sessions/${sessionId}`);
  const { data: session } = await response.json();
  
  // Display all orders with status
  session.orders.forEach(order => {
    updateOrderUI(order);
    // Show: "Order #1: Accepted ✓"
    // Show: "Order #2: Preparing 🍳"
    // Show: "Order #3: Ready ✓"
  });
  
  // Calculate total bill
  totalBill = session.total_amount;
}, 5000);
```

#### Step 5: Request Bill & Pay
```javascript
// Customer clicks "Request Bill"
const sessionId = localStorage.getItem('sessionId');

// Show payment modal with total amount
showPaymentModal(totalBill);

// Customer selects payment method
const paymentMethod = "cash"; // or "card", "zalopay"

// Complete session with payment
const response = await fetch(`/api/sessions/${sessionId}/complete`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    paymentMethod,
    transactionId: transactionId // for card/zalopay
  })
});

const { data } = await response.json();

// Show thank you page
localStorage.removeItem('sessionId');
window.location.href = '/thank-you';
```

### For Waiter App

#### Dashboard: View Pending Orders
```javascript
// Waiter login → get token
const token = localStorage.getItem('waiterToken');

// Get all pending orders
const response = await fetch('/api/orders?status=pending', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: pendingOrders } = await response.json();

// Display in dashboard
pendingOrders.forEach(order => {
  renderOrderCard(order); // Show table, items, time
});
```

#### Accept/Reject Order
```javascript
// Waiter clicks "Accept" on order
const acceptOrder = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data } = await response.json();
  alert('Order accepted!');
  refreshDashboard();
};

// Waiter clicks "Reject"
const rejectOrder = async (orderId, reason) => {
  const response = await fetch(`/api/orders/${orderId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  
  alert('Order rejected');
  refreshDashboard();
};
```

### For Kitchen Display System

#### View Accepted Orders
```javascript
// Kitchen display shows all accepted orders
const response = await fetch('/api/orders?status=accepted', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: orders } = await response.json();

// Display orders by table
orders.forEach(order => {
  renderKitchenOrder(order);
});
```

#### Update Item Status
```javascript
// Chef clicks "Start Cooking" on an item
const startCooking = async (itemId) => {
  await fetch(`/api/orders/items/${itemId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'preparing' })
  });
  
  updateItemUI(itemId, 'preparing');
};

// Chef clicks "Ready" when done
const markReady = async (itemId) => {
  await fetch(`/api/orders/items/${itemId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'ready' })
  });
  
  updateItemUI(itemId, 'ready');
  playReadySound(); // Alert waiter
};
```

---

## Workflow Examples
      "id": "uuid",
      "order_number": "ORD-20251231-0001",
      "status": "pending",
      "table": {
        "table_number": "T1",
        "location": "Indoor"
      },
      "items": [...]
    }
  ]
}
```

#### 4. Accept Order (Waiter)
```http
POST /api/orders/:id/accept
Authorization: Bearer <token>
```
**Purpose:** Waiter xác nhận nhận order, gửi vào bếp

**Authorization:** Requires `authenticate` + `authorize(['admin', 'waiter'])`

**Business Logic:**
- Cập nhật `status` → `accepted`
- Lưu `waiter_id` và `accepted_at`
- Tất cả items trong order → status `confirmed`

**Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "id": "uuid",
    "status": "accepted",
    "waiter_id": "uuid",
    "accepted_at": "2025-12-31T10:00:00Z"
  }
}
```

#### 5. Reject Order (Waiter)
```http
POST /api/orders/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Dish not available"
}
```
**Purpose:** Waiter từ chối order (hết món, không làm được, etc.)

**Authorization:** Requires `authenticate` + `authorize(['admin', 'waiter'])`

**Request Body:**
- `reason` (required): Lý do từ chối

**Business Logic:**
- Cập nhật `status` → `rejected`
- Lưu `rejection_reason`
- Refund lại total_amount

#### 6. Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```
**Purpose:** Cập nhật trạng thái order (preparing → ready → served)

**Authorization:** Requires `authenticate` + `authorize(['admin', 'waiter'])`

**Valid Status Transitions:**
- `accepted` → `preparing`
- `preparing` → `ready`
- `ready` → `served`
- `served` → `completed`

#### 7. Update Order Item Status (Kitchen Display)
```http
PATCH /api/orders/items/:itemId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```
**Purpose:** Kitchen Display cập nhật status từng món

**Authorization:** Requires `authenticate` + `authorize(['admin', 'waiter'])`

**Use Case:**
- Bếp nhận order → status `preparing`
- Món làm xong → status `ready`
- Đã mang ra → status `served`

#### 8. Complete Order
```http
POST /api/orders/:id/complete
Authorization: Bearer <token>
```
**Purpose:** Đánh dấu order hoàn thành (không có payment ở đây)

**Authorization:** Requires `authenticate` + `authorize(['admin', 'waiter'])`

**Note:** Payment được xử lý ở Session level, không phải Order level

## Workflow Examples

### Complete Flow Diagram

```
CUSTOMER APP                    BACKEND API                    WAITER APP              KITCHEN DISPLAY
─────────────                   ───────────                    ──────────              ───────────────

1. Scan QR Code
   │
   ├─> GET /api/sessions/table/:tableId (check existing)
   │   └─> 404 Not Found
   │
   ├─> POST /api/sessions                                       
   │   Body: {tableId}
   │   └─> 201 Created {sessionId}
   │
2. Browse Menu
   │
3. Add to Cart (client-side)
   │
4. Click "Place Order"
   │
   ├─> POST /api/sessions/:sessionId/orders
   │   Body: {items: [...]}
   │   └─> 201 Created {orderId, order_number}                  ├─> Notify: New Order!
   │                                                             │
5. Show "Waiting for waiter..."                                 │
                                                                 │
                                                        ├─> GET /api/orders?status=pending
                                                        │   └─> List pending orders
                                                        │
                                                        ├─> Review order
                                                        │
                                                        ├─> POST /api/orders/:id/accept  ├─> Show in KDS
                                                        │   └─> Order accepted            │
                                                                                          │
6. Poll status                                                                            │
   │                                                                                      │
   ├─> GET /api/sessions/:sessionId                                             ├─> PATCH /api/orders/items/:id/status
   │   └─> {orders: [{status: "accepted"}]}                                     │   Body: {status: "preparing"}
   │                                                                             │
7. Show "Order Accepted ✓"                                                      │
                                                                                 │
8. Continue polling...                                                  ├─> PATCH /api/orders/items/:id/status
   │                                                                    │   Body: {status: "ready"}
   ├─> GET /api/sessions/:sessionId                                    │
   │   └─> {orders: [{status: "ready"}]}                               │
   │                                                            ├─> Notify: Order Ready
9. Show "Order Ready 🍽️"                                       │
                                                        ├─> Deliver to table
                                                        │
                                                        ├─> PATCH /api/orders/:id/status
                                                            Body: {status: "served"}

10. Customer orders more items (15 mins later)
    │
    ├─> POST /api/sessions/:sessionId/orders (NEW ORDER)
    │   Body: {items: [...]}
    │   └─> 201 Created {orderId2}                              ├─> Notify: New Order!
    │                                                            │
                                                        ├─> POST /api/orders/:orderId2/accept
                                                                                          │
                                                                                  ├─> Process in kitchen...

11. Request Bill
    │
    ├─> GET /api/sessions/:sessionId
    │   └─> {total_amount: "44.50", orders: [...]}
    │
12. Show payment modal: $44.50
    │
13. Select payment method: Cash
    │
    ├─> POST /api/sessions/:sessionId/complete
    │   Body: {paymentMethod: "cash"}
    │   └─> 200 OK {status: "completed"}                        ├─> Notify: Table paid
    │
14. Show "Thank You!" page
    │
15. localStorage.clear()
```

### Example 1: Simple Single Order Flow
```javascript
// 1. Customer scans QR → tableId = "xxx"
POST /api/sessions
Body: {"tableId": "xxx"}
Response: {sessionId: "abc"}

// 2. Customer orders 2 items
POST /api/sessions/abc/orders
Body: {
  items: [
    {menuItemId: "item1", quantity: 2},
    {menuItemId: "item2", quantity: 1}
  ]
}
Response: {orderId: "order1", status: "pending"}

// 3. Waiter accepts
POST /api/orders/order1/accept
Response: {status: "accepted"}

// 4. Kitchen prepares
PATCH /api/orders/order1/status
Body: {status: "preparing"}

PATCH /api/orders/order1/status
Body: {status: "ready"}

// 5. Waiter serves
PATCH /api/orders/order1/status
Body: {status: "served"}

// 6. Customer pays
POST /api/sessions/abc/complete
Body: {paymentMethod: "cash"}
Response: {status: "completed", total_amount: "25.00"}
```

### Example 2: Multiple Orders in One Session
```javascript
// Scenario: Khách order 3 lần riêng biệt

// 10:00 - Order 1: Main dishes
POST /api/sessions/abc/orders
Body: {items: [{menuItemId: "chicken", quantity: 2}]}
Response: {orderId: "order1"}

POST /api/orders/order1/accept  // Waiter accepts

// 10:15 - Order 2: Drinks (15 phút sau)
POST /api/sessions/abc/orders
Body: {items: [{menuItemId: "coke", quantity: 3}]}
Response: {orderId: "order2"}

POST /api/orders/order2/accept  // Waiter accepts again

// 10:35 - Order 3: Dessert (35 phút sau)
POST /api/sessions/abc/orders
Body: {items: [{menuItemId: "cake", quantity: 1}]}
Response: {orderId: "order3"}

POST /api/orders/order3/accept  // Waiter accepts third time

// 11:00 - View total bill
GET /api/sessions/abc
Response: {
  total_amount: "69.50",  // Tổng cả 3 orders
  orders: [
    {id: "order1", total: "25.00", status: "served"},
    {id: "order2", total: "19.50", status: "served"},
    {id: "order3", total: "25.00", status: "ready"}
  ]
}

// Pay everything together
POST /api/sessions/abc/complete
Body: {paymentMethod: "card", transactionId: "TXN123"}
```

### Example 3: Order Rejection Flow
```javascript
// 1. Customer orders
POST /api/sessions/abc/orders
Body: {items: [{menuItemId: "special-fish", quantity: 1}]}
Response: {orderId: "order1"}

// 2. Waiter checks kitchen → hết cá
POST /api/orders/order1/reject
Body: {reason: "Fish not available today"}
Response: {status: "rejected"}

// 3. Customer gets notification → order lại món khác
POST /api/sessions/abc/orders
Body: {items: [{menuItemId: "chicken", quantity: 1}]}
Response: {orderId: "order2"}

// 4. Waiter accepts new order
POST /api/orders/order2/accept
```

### Example 4: Kitchen Display Workflow
```javascript
// Kitchen Display shows accepted orders
GET /api/orders?status=accepted
Response: {
  data: [
    {
      id: "order1",
      table: {table_number: "T1"},
      items: [
        {id: "item1", item_name: "Grilled Chicken", quantity: 2, status: "pending"},
        {id: "item2", item_name: "Caesar Salad", quantity: 1, status: "pending"}
      ]
    }
  ]
}

// Chef starts cooking item 1
PATCH /api/orders/items/item1/status
Body: {status: "preparing"}

// Item 1 done
PATCH /api/orders/items/item1/status
Body: {status: "ready"}
// → Alert waiter

// Chef starts item 2
PATCH /api/orders/items/item2/status
Body: {status: "preparing"}

// Item 2 done
PATCH /api/orders/items/item2/status
Body: {status: "ready"}

// All items ready → update order status
PATCH /api/orders/order1/status
Body: {status: "ready"}
```

---

## Frontend Implementation Guide

### Customer App - Complete React Example

```jsx
import { useState, useEffect } from 'react';

function CustomerOrderApp() {
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalBill, setTotalBill] = useState(0);

  // Step 1: Initialize session on component mount
  useEffect(() => {
    const initSession = async () => {
      const tableId = getTableIdFromQR(); // From URL params
      
      // Check if session exists
      try {
        const response = await fetch(`/api/sessions/table/${tableId}`);
        if (response.ok) {
          const { data } = await response.json();
          setSessionId(data.id);
          setOrders(data.orders);
          setTotalBill(data.total_amount);
        } else {
          // Create new session
          const createRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId })
          });
          const { data } = await createRes.json();
          setSessionId(data.id);
          localStorage.setItem('sessionId', data.id);
        }
      } catch (error) {
        console.error('Session init failed:', error);
      }
    };
    
    initSession();
  }, []);

  // Step 2: Poll session status every 5 seconds
  useEffect(() => {
    if (!sessionId) return;
    
    const pollInterval = setInterval(async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const { data } = await response.json();
      setOrders(data.orders);
      setTotalBill(data.total_amount);
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [sessionId]);

  // Step 3: Place order
  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });
      
      const { data: newOrder } = await response.json();
      alert(`Order placed! Order #${newOrder.order_number}`);
      setCart([]); // Clear cart
      setOrders([...orders, newOrder]);
    } catch (error) {
      alert('Failed to place order');
    }
  };

  // Step 4: Request bill and pay
  const payBill = async (paymentMethod) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod })
      });
      
      const { data } = await response.json();
      localStorage.removeItem('sessionId');
      window.location.href = '/thank-you';
    } catch (error) {
      alert('Payment failed');
    }
  };

  return (
    <div>
      <h1>Table Order</h1>
      
      {/* Cart Section */}
      <div className="cart">
        {cart.map(item => (
          <div key={item.menuItemId}>
            {item.quantity}x {item.name}
          </div>
        ))}
        <button onClick={placeOrder}>Place Order</button>
      </div>

      {/* Orders Status */}
      <div className="orders">
        <h2>Your Orders</h2>
        {orders.map(order => (
          <div key={order.id}>
            <p>Order #{order.order_number}</p>
            <p>Status: {order.status}</p>
            {order.status === 'pending' && '⏳ Waiting for waiter'}
            {order.status === 'accepted' && '✓ Confirmed'}
            {order.status === 'preparing' && '🍳 Cooking'}
            {order.status === 'ready' && '✓ Ready'}
            {order.status === 'served' && '✓ Served'}
          </div>
        ))}
      </div>

      {/* Bill Section */}
      <div className="bill">
        <h2>Total: ${totalBill}</h2>
        <button onClick={() => payBill('cash')}>Pay Cash</button>
        <button onClick={() => payBill('card')}>Pay Card</button>
      </div>
    </div>
  );
}
```

### Waiter App - Complete React Example

```jsx
import { useState, useEffect } from 'react';

function WaiterDashboard() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('waiterToken'));

  useEffect(() => {
    fetchPendingOrders();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingOrders = async () => {
    const response = await fetch('/api/orders?status=pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await response.json();
    setPendingOrders(data);
  };

  const acceptOrder = async (orderId) => {
    await fetch(`/api/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPendingOrders(); // Refresh list
  };

  const rejectOrder = async (orderId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    await fetch(`/api/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    fetchPendingOrders();
  };

  return (
    <div>
      <h1>Pending Orders ({pendingOrders.length})</h1>
      {pendingOrders.map(order => (
        <div key={order.id} className="order-card">
          <h3>Table {order.table.table_number}</h3>
          <p>Order #{order.order_number}</p>
          <ul>
            {order.items.map(item => (
              <li key={item.id}>
                {item.quantity}x {item.item_name}
              </li>
            ))}
          </ul>
          <p>Total: ${order.total_amount}</p>
          <button onClick={() => acceptOrder(order.id)}>Accept</button>
          <button onClick={() => rejectOrder(order.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

### Kitchen Display - Complete React Example

```jsx
import { useState, useEffect } from 'react';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('kitchenToken'));

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const response = await fetch('/api/orders?status=accepted', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await response.json();
    setOrders(data);
  };

  const updateItemStatus = async (itemId, status) => {
    await fetch(`/api/orders/items/${itemId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  return (
    <div className="kitchen-display">
      <h1>Kitchen Orders</h1>
      <div className="orders-grid">
        {orders.map(order => (
          <div key={order.id} className="kitchen-order">
            <h2>Table {order.table.table_number}</h2>
            <p>Order #{order.order_number}</p>
            {order.items.map(item => (
              <div key={item.id} className={`item status-${item.status}`}>
                <p>{item.quantity}x {item.item_name}</p>
                <div className="item-actions">
                  {item.status === 'pending' && (
                    <button onClick={() => updateItemStatus(item.id, 'preparing')}>
                      Start Cooking
                    </button>
                  )}
                  {item.status === 'preparing' && (
                    <button onClick={() => updateItemStatus(item.id, 'ready')}>
                      Mark Ready
                    </button>
                  )}
                  {item.status === 'ready' && (
                    <span>✓ Ready to Serve</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Database Relationships

```
TableSession (1) ─────< Orders (Many)
    │
    └─> Table (1)
    └─> User (Customer)

Order (1) ─────< OrderItems (Many)
    │
    ├─> TableSession (1)
    ├─> Table (1)
    ├─> User (Customer)
    └─> User (Waiter)

OrderItem (1) ─────< OrderItemModifiers (Many)
    │
    ├─> Order (1)
    └─> MenuItem (1)

OrderItemModifier (1)
    │
    ├─> OrderItem (1)
    └─> ModifierOption (1)
```

## Key Changes from Original Design

### ❌ Removed from Order Model:
- `payment_method` → Moved to TableSession
- `payment_status` → Moved to TableSession
- `payment_transaction_id` → Moved to TableSession

### ✅ Added to Order Model:
- `session_id` → Links order to session

### 🔄 Updated Business Logic:
- **Old:** `getOrCreateActiveOrder()` → Tạo hoặc lấy order active
- **New:** Removed - Mỗi lần order là một Order mới
- **Old:** `completeOrder(payment_method, ...)` → Complete + payment
- **New:** `completeOrder()` → Chỉ mark completed, không có payment

## Testing

### Test Files
1. **sessions.rest** - Complete workflow (create session, orders, payment)
2. **orders.rest** - Query/filter orders only

### Quick Test Flow
```bash
# 1. Create session
POST http://localhost:3000/api/sessions
Body: {"tableId": "xxx"}

# 2. Create order
POST http://localhost:3000/api/sessions/:sessionId/orders
Body: {"items": [...]}

# 3. Accept order (need auth token)
POST http://localhost:3000/api/orders/:orderId/accept
Authorization: Bearer <token>

# 4. Update status
PATCH http://localhost:3000/api/orders/:orderId/status
Body: {"status": "preparing"}
Authorization: Bearer <token>

# 5. Complete session with payment
POST http://localhost:3000/api/sessions/:sessionId/complete
Body: {"paymentMethod": "cash"}
```

## Authorization Summary

| Endpoint | Access Level | Required Roles |
|----------|-------------|----------------|
| GET /api/orders/table/:tableId | Public | None (Customer) |
| GET /api/orders/:id | Public | None (Customer) |
| GET /api/orders | Private | admin, waiter |
| POST /api/orders/:id/accept | Private | admin, waiter |
| POST /api/orders/:id/reject | Private | admin, waiter |
| PATCH /api/orders/:id/status | Private | admin, waiter |
| PATCH /api/orders/items/:id/status | Private | admin, waiter |
| POST /api/orders/:id/complete | Private | admin, waiter |

## Notes
- Payment được xử lý hoàn toàn ở **Session level**, không có trong Order API
- Mỗi Order có thể được accept/reject độc lập bởi waiter
- Session tính tổng tiền từ tất cả Orders khi complete
- Order status và OrderItem status được quản lý riêng biệt
