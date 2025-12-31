-- Migration Script for Order Management System
-- Run this after your existing database setup

-- ==================== CREATE ORDERS TABLE ====================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    table_id UUID NOT NULL,
    customer_id UUID,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'served', 'completed')),
    rejection_reason TEXT,
    subtotal DECIMAL(12, 2) DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (total_amount >= 0),
    payment_method VARCHAR(20) 
        CHECK (payment_method IN ('cash', 'card', 'zalopay', 'momo', 'vnpay', 'stripe')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' 
        CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    payment_transaction_id VARCHAR(255),
    notes TEXT,
    waiter_id UUID,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_orders_table FOREIGN KEY (table_id) 
        REFERENCES tables(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_waiter FOREIGN KEY (waiter_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ==================== CREATE ORDER ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    special_instructions TEXT,
    item_name VARCHAR(80) NOT NULL,
    item_description TEXT,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) 
        REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- ==================== CREATE ORDER ITEM MODIFIERS TABLE ====================
CREATE TABLE IF NOT EXISTS order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL,
    modifier_group_id UUID NOT NULL,
    modifier_option_id UUID NOT NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0.00,
    group_name VARCHAR(50) NOT NULL,
    option_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_order_item_modifiers_order_item FOREIGN KEY (order_item_id) 
        REFERENCES order_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_modifiers_group FOREIGN KEY (modifier_group_id) 
        REFERENCES modifier_groups(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_item_modifiers_option FOREIGN KEY (modifier_option_id) 
        REFERENCES modifier_options(id) ON DELETE RESTRICT
);

-- Indexes for order_item_modifiers table
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_order_item_id ON order_item_modifiers(order_item_id);

-- ==================== TRIGGER FOR UPDATED_AT ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_item_modifiers_updated_at ON order_item_modifiers;
CREATE TRIGGER update_order_item_modifiers_updated_at
    BEFORE UPDATE ON order_item_modifiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== VERIFICATION QUERIES ====================
-- Uncomment to verify tables were created

/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'order_item_modifiers');

SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_name IN ('orders', 'order_items', 'order_item_modifiers')
ORDER BY c.table_name, c.ordinal_position;
*/
