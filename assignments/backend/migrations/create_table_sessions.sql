-- Migration: Create table_sessions and update orders table
-- Run this migration after creating the orders table

-- Create table_sessions table
CREATE TABLE IF NOT EXISTS table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    subtotal DECIMAL(12,2) DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (total_amount >= 0),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'zalopay', 'momo', 'vnpay', 'stripe')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    payment_transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_session_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Add session_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL;

-- Create indexes for table_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_table_id ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_sessions_table_status ON table_sessions(table_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON table_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON table_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON table_sessions(session_number);

-- Create index for orders.session_id
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);

-- Create trigger to update updated_at on table_sessions
CREATE OR REPLACE FUNCTION update_table_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_table_sessions_updated_at
    BEFORE UPDATE ON table_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_table_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE table_sessions IS 'Dining sessions at tables - groups multiple orders for combined payment';
COMMENT ON COLUMN table_sessions.session_number IS 'Format: SESS-YYYYMMDD-XXXX';
COMMENT ON COLUMN table_sessions.status IS 'active: Currently serving, completed: Payment completed, cancelled: Customer did not show';
COMMENT ON COLUMN table_sessions.subtotal IS 'Sum of all orders subtotal in this session';
COMMENT ON COLUMN table_sessions.total_amount IS 'Final amount to pay (includes all orders)';

COMMENT ON COLUMN orders.session_id IS 'Links to TableSession for grouped payment - NULL for backward compatibility';

-- Sample query to verify
-- SELECT * FROM table_sessions WHERE status = 'active';
-- SELECT s.session_number, s.status, COUNT(o.id) as order_count, s.total_amount
-- FROM table_sessions s
-- LEFT JOIN orders o ON o.session_id = s.id
-- GROUP BY s.id
-- ORDER BY s.created_at DESC;
