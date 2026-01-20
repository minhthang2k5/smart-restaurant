# Tài Liệu Cơ Sở Dữ Liệu

Tài liệu này mô tả lược đồ PostgreSQL của hệ thống **Smart Restaurant**, chi tiết hóa bảng, cột, kiểu dữ liệu, ràng buộc, chỉ mục và mối quan hệ. Mục tiêu là hỗ trợ phát triển, kiểm thử, vận hành và migration.

---

## 0. Đặc Tả Chung
- Khóa chính: `UUID` cho tất cả bảng (PK).
- Thời gian: `TIMESTAMPTZ` cho `created_at`, `updated_at`; có thể thêm `deleted_at` cho soft delete.
- Trạng thái: dùng `ENUM` (hoặc lookup table nếu cần mở rộng động).
- Tiền tệ: `DECIMAL(12,2)` (hoặc `DECIMAL(15,2)` với payment); thời gian chuẩn bị: `INTEGER` phút.
- `VARCHAR(n)` dùng tối ưu phổ biến: 50/100/191/255 tùy ngữ cảnh (email 255, tên 100, mã 50-64, phone 20).
- Chuẩn hóa: tránh trùng lặp dữ liệu, tách modifier và ảnh ra bảng riêng.

---

## 1. Tổng Quan Bảng

| Bảng | Mục đích | Khóa chính | Ghi chú chính |
|------|----------|------------|---------------|
| users | Tài khoản & hồ sơ | id (UUID) | Email unique, role ENUM |
| tables | Bàn & QR | id (UUID) | QR token per bàn |
| table_sessions | Phiên dùng bàn | id (UUID) | Gom nhiều order, thanh toán nhóm |
| menu_categories | Danh mục món | id (UUID) | Thứ tự hiển thị |
| menu_items | Món ăn | id (UUID) | FK danh mục, trạng thái món |
| menu_item_photos | Ảnh món | id (UUID) | URL, ảnh chính |
| modifier_groups | Nhóm modifier | id (UUID) | single/multiple, min/max |
| modifier_options | Tùy chọn | id (UUID) | Giá cộng thêm |
| menu_item_modifier_groups | Nối món - nhóm modifier | (menu_item_id, group_id) | Junction many-to-many |
| orders | Đơn hàng | id (UUID) | FK bàn, khách, phục vụ |
| order_items | Món trong đơn | id (UUID) | Giá chốt tại thời điểm đặt |
| order_item_modifiers | Modifier đã chọn | id (UUID) | Liên kết món - option |
| payment_transactions | Thanh toán | id (UUID) | Lưu phản hồi gateway |
| reviews | Đánh giá | id (UUID) | Duyệt/ẩn đánh giá |

---

## 2. Chi Tiết Bảng (Bảng Dạng Lưới)

### 2.1 users
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh người dùng |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email đăng nhập |
| password | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| first_name | VARCHAR(50) | NOT NULL | Tên |
| last_name | VARCHAR(50) | NOT NULL | Họ |
| role | ENUM(admin, waiter, kitchen_staff, customer) | DEFAULT customer | Vai trò hệ thống |
| restaurant_id | UUID | NULL | Thuộc nhà hàng (tùy chọn) |
| email_verified | BOOLEAN | DEFAULT false | Đã xác minh email |
| email_verification_token | TEXT | NULL | Token xác minh email |
| password_reset_token | TEXT | NULL | Token reset mật khẩu |
| password_reset_expires | TIMESTAMPTZ | NULL | Hết hạn reset |
| password_changed_at | TIMESTAMPTZ | NULL | Khi đổi mật khẩu |
| avatar | VARCHAR(500) | NULL | Ảnh đại diện |
| status | ENUM(active, inactive) | DEFAULT active | Trạng thái tài khoản |
| last_login | TIMESTAMPTZ | NULL | Lần đăng nhập cuối |
| google_id | VARCHAR(255) | NULL, UNIQUE | ID Google OAuth |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.2 tables
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh bàn |
| table_number | VARCHAR(50) | NOT NULL, UNIQUE | Mã/số bàn (T-01...) |
| location | VARCHAR(50) | NOT NULL | Khu vực/zone |
| capacity | INTEGER | NOT NULL | Sức chứa (1-20) |
| description | TEXT | NULL | Mô tả bàn |
| status | ENUM(active, inactive) | DEFAULT active | Trạng thái bàn |
| qr_token | TEXT | NOT NULL | JWT token cho QR |
| qr_token_created_at | TIMESTAMPTZ | NOT NULL | Thời điểm tạo QR |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.3 table_sessions
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh phiên bàn |
| table_id | UUID | FK → tables.id | Bàn đang phục vụ |
| customer_id | UUID | FK → users.id | Khách chính (tùy chọn) |
| session_number | VARCHAR(50) | NOT NULL, UNIQUE | SESS-YYYYMMDD-HHMMSS-XXXXXX |
| status | ENUM(active, completed, cancelled) | DEFAULT active | Trạng thái phiên |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT now | Bắt đầu phục vụ |
| completed_at | TIMESTAMPTZ | NULL | Kết thúc/checkout |
| subtotal | DECIMAL(12,2) | DEFAULT 0 | Tổng các order |
| tax_amount | DECIMAL(12,2) | DEFAULT 0 | Thuế |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 | Giảm |
| total_amount | DECIMAL(12,2) | DEFAULT 0 | Tổng thanh toán |
| payment_method | ENUM(cash, card, zalopay, momo, vnpay, stripe) | NULL | Phương thức |
| payment_status | ENUM(unpaid, pending, paid, failed, refunded) | DEFAULT unpaid | Trạng thái thanh toán |
| payment_transaction_id | VARCHAR(100) | NULL | Mã giao dịch ngoài |
| momo_request_id | VARCHAR(255) | NULL | MoMo request ID |
| momo_order_id | VARCHAR(255) | NULL | MoMo order ID |
| momo_transaction_id | VARCHAR(255) | NULL, UNIQUE | MoMo transaction ID |
| momo_payment_status | VARCHAR(50) | NULL | MoMo status text |
| momo_payment_amount | DECIMAL(15,2) | NULL | Số tiền MoMo |
| momo_payment_time | TIMESTAMPTZ | NULL | Thời điểm thanh toán MoMo |
| momo_response_code | VARCHAR(50) | NULL | MoMo result code |
| momo_signature | VARCHAR(255) | NULL | Chữ ký callback |
| momo_extra_data | TEXT | NULL | Extra data gửi MoMo |
| momo_error_message | TEXT | NULL | Lỗi MoMo |
| momo_raw_response | JSONB | NULL | Phản hồi đầy đủ |
| notes | TEXT | NULL | Ghi chú phiên |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.4 menu_categories
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh danh mục |
| restaurant_id | UUID | NOT NULL | Thuộc nhà hàng |
| name | VARCHAR(50) | NOT NULL | Tên danh mục |
| description | TEXT | NULL | Mô tả |
| display_order | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| status | ENUM(active, inactive) | DEFAULT active | Kích hoạt/ẩn |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.5 menu_items
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh món |
| restaurant_id | UUID | NULL | Thuộc nhà hàng (tùy chọn) |
| category_id | UUID | FK → menu_categories.id | Danh mục chứa món |
| name | VARCHAR(80) | NOT NULL, UNIQUE | Tên món |
| description | TEXT | NULL | Mô tả |
| price | DECIMAL(12,2) | NOT NULL | Giá cơ bản |
| prep_time_minutes | INTEGER | DEFAULT 0 | Thời gian chuẩn bị (0-240) |
| status | ENUM(available, unavailable, sold_out) | DEFAULT available | Tình trạng |
| is_chef_recommended | BOOLEAN | DEFAULT false | Đề xuất bởi bếp |
| is_deleted | BOOLEAN | DEFAULT false | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.6 menu_item_photos
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh ảnh |
| menu_item_id | UUID | FK → menu_items.id | Thuộc món |
| url | TEXT | NOT NULL | URL Cloudinary |
| cloudinary_public_id | VARCHAR(255) | NULL | ID public để xóa ảnh |
| is_primary | BOOLEAN | DEFAULT false | Ảnh chính |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.7 modifier_groups
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh nhóm |
| restaurant_id | UUID | NOT NULL | Thuộc nhà hàng |
| name | VARCHAR(80) | NOT NULL | Tên nhóm (Size, Topping...) |
| selection_type | ENUM(single, multiple) | DEFAULT single | Chọn 1 hay nhiều |
| is_required | BOOLEAN | DEFAULT false | Bắt buộc chọn |
| min_selections | INTEGER | DEFAULT 0 | Tối thiểu chọn |
| max_selections | INTEGER | DEFAULT 0 | Tối đa chọn (0 = không giới hạn) |
| display_order | INTEGER | DEFAULT 0 | Thứ tự |
| status | ENUM(active, inactive) | DEFAULT active | Kích hoạt |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.8 modifier_options
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh option |
| group_id | UUID | FK → modifier_groups.id | Thuộc nhóm |
| name | VARCHAR(80) | NOT NULL | Tên tùy chọn |
| price_adjustment | DECIMAL(12,2) | DEFAULT 0 | Giá cộng thêm |
| status | ENUM(active, inactive) | DEFAULT active | Kích hoạt |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | (none) |  | Không dùng updated_at theo model |

### 2.9 menu_item_modifier_groups
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| menu_item_id | UUID | PK, FK → menu_items.id | Món |
| group_id | UUID | PK, FK → modifier_groups.id | Nhóm modifier |

### 2.10 orders
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh đơn |
| restaurant_id | UUID | NULL | Thuộc nhà hàng |
| table_id | UUID | FK → tables.id | Bàn hiện tại |
| customer_id | UUID | FK → users.id | Khách đặt |
| waiter_id | UUID | FK → users.id | Nhân viên phục vụ |
| session_id | UUID | FK → table_sessions.id | Phiên bàn (group thanh toán) |
| order_number | VARCHAR(50) | UNIQUE | Mã đơn (ORD-YYYYMMDD-XXXX) |
| status | ENUM(pending, accepted, rejected, preparing, ready, served, completed) | NOT NULL | Trạng thái |
| subtotal | DECIMAL(12,2) | NOT NULL | Tổng trước thuế/giảm |
| tax_amount | DECIMAL(12,2) | DEFAULT 0 | Thuế |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 | Giảm giá |
| total_amount | DECIMAL(12,2) | NOT NULL | Tổng thanh toán |
| notes | TEXT | NULL | Ghi chú khách |
| rejection_reason | TEXT | NULL | Lý do từ chối |
| accepted_at | TIMESTAMPTZ | NULL | Khi chấp nhận |
| completed_at | TIMESTAMPTZ | NULL | Khi hoàn tất |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.11 order_items
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh dòng món |
| order_id | UUID | FK → orders.id | Thuộc đơn |
| menu_item_id | UUID | FK → menu_items.id | Món tham chiếu |
| quantity | INTEGER | NOT NULL, DEFAULT 1 | Số lượng |
| unit_price | DECIMAL(12,2) | NOT NULL | Giá tại thời điểm đặt |
| subtotal | DECIMAL(12,2) | NOT NULL | unit_price * quantity (chưa modifier) |
| total_price | DECIMAL(12,2) | NOT NULL | Tổng gồm modifier |
| status | ENUM(pending, confirmed, preparing, ready, served, cancelled) | DEFAULT pending | Trạng thái món |
| special_instructions | TEXT | NULL | Ghi chú món |
| item_name | VARCHAR(80) | NOT NULL | Snapshot tên món |
| item_description | TEXT | NULL | Snapshot mô tả |
| added_at | TIMESTAMPTZ | NOT NULL, DEFAULT now | Thời điểm thêm |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.12 order_item_modifiers
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh dòng modifier |
| order_item_id | UUID | FK → order_items.id | Thuộc dòng món |
| modifier_group_id | UUID | FK → modifier_groups.id | Nhóm chọn |
| modifier_option_id | UUID | FK → modifier_options.id | Tùy chọn đã chọn |
| price_adjustment | DECIMAL(12,2) | DEFAULT 0 | Giá cộng thêm tại thời điểm đặt |
| group_name | VARCHAR(50) | NOT NULL | Snapshot tên nhóm |
| option_name | VARCHAR(50) | NOT NULL | Snapshot tên tùy chọn |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |

### 2.13 payment_transactions
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh giao dịch |
| table_session_id | UUID | FK → table_sessions.id | Thuộc phiên bàn |
| payment_method | VARCHAR(50) | NOT NULL | Gateway (momo, vnpay...) |
| transaction_id | VARCHAR(255) | NULL | ID ngoài |
| request_id | VARCHAR(255) | NULL | Request ID gửi gateway |
| amount | DECIMAL(15,2) | NOT NULL | Số tiền |
| status | VARCHAR(50) | NOT NULL | pending/completed/failed/cancelled... |
| response_code | VARCHAR(50) | NULL | Mã phản hồi |
| message | TEXT | NULL | Thông điệp gateway |
| raw_response | JSONB | NULL | Payload đầy đủ |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

### 2.14 reviews
| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | UUID | PK | Định danh đánh giá |
| menu_item_id | UUID | FK → menu_items.id | Món được đánh giá |
| user_id | UUID | FK → users.id | Người đánh giá |
| session_id | UUID | FK → table_sessions.id | Phiên bàn của đánh giá |
| order_id | UUID | FK → orders.id | Đơn liên quan (tùy chọn) |
| rating | INTEGER | CHECK 1-5 | Điểm 1-5 |
| comment | TEXT | NULL | Nội dung |
| helpful_count | INTEGER | DEFAULT 0 | Vote hữu ích |
| status | ENUM(pending, approved, rejected) | DEFAULT approved | Trạng thái duyệt |
| created_at | TIMESTAMPTZ | NOT NULL | Khi tạo |
| updated_at | TIMESTAMPTZ | NOT NULL | Khi cập nhật |

---

## 3. Quan Hệ Giữa Các Bảng

```
Users (1) ────────────────── (M) Orders
             ├─ customer_id
             └─ waiter_id

Users (1) ────────────────── (M) TableSessions
             └─ customer_id

Tables (1) ───────────────── (M) TableSessions
        ├─ table_id

TableSessions (1) ────────── (M) Orders
        ├─ session_id

TableSessions (1) ────────── (M) PaymentTransactions
        ├─ table_session_id

TableSessions (1) ────────── (M) Reviews
        ├─ session_id

MenuCategories (1) ────────── (M) MenuItems
        ├─ category_id

MenuItems (1) ─────────┬───── (M) MenuItemPhotos
            │
            ├────────── (M) OrderItems
            │
            ├────────── (M) Reviews
            │
            └────────── (M) ModifierGroups (Junction via menu_item_modifier_groups)

ModifierGroups (1) ──────── (M) ModifierOptions
        ├─ group_id

OrderItems (M) ──────────── (M) ModifierOptions
        (via OrderItemModifiers)

Orders (1) ──────────────── (M) OrderItems
        ├─ order_id
        │
        └─────────────── (1) PaymentTransactions
```

---

## 4. Chỉ Mục Gợi Ý (Hiệu Năng)

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Tables
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_location ON tables(location);

-- TableSessions
CREATE INDEX idx_sessions_table_id ON table_sessions(table_id);
CREATE INDEX idx_sessions_table_status ON table_sessions(table_id, status);
CREATE INDEX idx_sessions_customer_id ON table_sessions(customer_id);
CREATE INDEX idx_sessions_status ON table_sessions(status);

-- MenuCategories
CREATE INDEX idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_categories_status ON menu_categories(status);
CREATE UNIQUE INDEX unique_restaurant_category_name ON menu_categories(restaurant_id, name);

-- MenuItems
CREATE INDEX idx_items_category_id ON menu_items(category_id);
CREATE INDEX idx_items_status ON menu_items(status);
CREATE UNIQUE INDEX idx_items_name_unique ON menu_items(name);

-- Orders
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- OrderItems
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- OrderItemModifiers
CREATE INDEX idx_order_item_modifiers_order_item_id ON order_item_modifiers(order_item_id);

-- Reviews
CREATE INDEX idx_reviews_menu_item_id ON reviews(menu_item_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- PaymentTransactions
CREATE INDEX idx_payments_session ON payment_transactions(table_session_id);
CREATE INDEX idx_payments_transaction ON payment_transactions(transaction_id);
CREATE INDEX idx_payments_request ON payment_transactions(request_id);
CREATE INDEX idx_payments_status ON payment_transactions(status);
CREATE INDEX idx_payments_created ON payment_transactions(created_at);
```

---

## 5. Ghi Chú Thiết Kế & Ràng Buộc
- Dùng `ON DELETE CASCADE` cho `order_items` → `order_item_modifiers`; cân nhắc `RESTRICT` cho `orders` để tránh mất dữ liệu thanh toán.
- Soft delete: thêm `deleted_at` (hoặc `is_active`) nếu cần lưu lịch sử; cập nhật truy vấn mặc định để lọc.
- Tiền tệ: tránh `FLOAT`; dùng `DECIMAL(12,2)` để bảo toàn chính xác.
- Toàn bộ timestamp lưu UTC, chuyển đổi ở tầng ứng dụng.
- Kiểm tra `rating` bằng CHECK (rating BETWEEN 1 AND 5).
- Với `order_number` nên unique và tạo theo pattern ngày + sequence để dễ truy vết.
