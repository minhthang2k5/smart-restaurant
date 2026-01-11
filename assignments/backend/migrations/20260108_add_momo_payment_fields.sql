-- Migration: Add MoMo payment fields to table_sessions and create payment_transactions table
-- Date: 2026-01-08
-- Purpose: Enable MoMo e-wallet payment integration

BEGIN;

-- Add MoMo payment fields to table_sessions
ALTER TABLE table_sessions
    ADD COLUMN IF NOT EXISTS momo_request_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS momo_order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS momo_transaction_id VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS momo_payment_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS momo_payment_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS momo_payment_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS momo_response_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS momo_signature VARCHAR(255),
    ADD COLUMN IF NOT EXISTS momo_extra_data TEXT,
    ADD COLUMN IF NOT EXISTS momo_error_message TEXT,
    ADD COLUMN IF NOT EXISTS momo_raw_response JSONB;

-- Update payment_status enum to include 'pending' and 'failed' states
-- Note: In PostgreSQL, you need to add enum values separately
DO $$ 
BEGIN
    -- Add 'pending' value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_table_sessions_payment_status'
        )
    ) THEN
        ALTER TYPE enum_table_sessions_payment_status ADD VALUE 'pending';
    END IF;

    -- Add 'failed' value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'failed' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_table_sessions_payment_status'
        )
    ) THEN
        ALTER TYPE enum_table_sessions_payment_status ADD VALUE 'failed';
    END IF;
END $$;

-- Update status enum to include 'pending_payment' state
DO $$ 
BEGIN
    -- Add 'pending_payment' value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_payment' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_table_sessions_status'
        )
    ) THEN
        ALTER TYPE enum_table_sessions_status ADD VALUE 'pending_payment';
    END IF;
END $$;

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    request_id VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(50) NOT NULL,
    response_code VARCHAR(50),
    message TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_sessions_momo_request ON table_sessions(momo_request_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_momo_transaction ON table_sessions(momo_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payment_transactions(table_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_request ON payment_transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);

-- Add comments for documentation
COMMENT ON COLUMN table_sessions.momo_request_id IS 'MoMo request ID for tracking';
COMMENT ON COLUMN table_sessions.momo_order_id IS 'MoMo order ID for tracking';
COMMENT ON COLUMN table_sessions.momo_transaction_id IS 'MoMo transaction ID (unique, for idempotency)';
COMMENT ON COLUMN table_sessions.momo_payment_status IS 'MoMo payment status message';
COMMENT ON COLUMN table_sessions.momo_payment_amount IS 'Amount sent to MoMo for payment';
COMMENT ON COLUMN table_sessions.momo_payment_time IS 'When MoMo payment was completed';
COMMENT ON COLUMN table_sessions.momo_response_code IS 'MoMo result code';
COMMENT ON COLUMN table_sessions.momo_signature IS 'MoMo callback signature for verification';
COMMENT ON COLUMN table_sessions.momo_extra_data IS 'Extra data sent with MoMo request';
COMMENT ON COLUMN table_sessions.momo_error_message IS 'Error message from MoMo if payment failed';
COMMENT ON COLUMN table_sessions.momo_raw_response IS 'Full raw response from MoMo API';

COMMENT ON TABLE payment_transactions IS 'Audit log for all payment attempts and completions';
COMMENT ON COLUMN payment_transactions.table_session_id IS 'Reference to the table session';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Payment gateway used (momo, vnpay, etc.)';
COMMENT ON COLUMN payment_transactions.transaction_id IS 'External transaction ID from payment gateway';
COMMENT ON COLUMN payment_transactions.request_id IS 'Request ID sent to payment gateway';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount';
COMMENT ON COLUMN payment_transactions.status IS 'Transaction status (pending, completed, failed, cancelled)';
COMMENT ON COLUMN payment_transactions.response_code IS 'Response code from payment gateway';
COMMENT ON COLUMN payment_transactions.message IS 'Message from payment gateway';
COMMENT ON COLUMN payment_transactions.raw_response IS 'Full raw response from payment gateway';

COMMIT;

-- Rollback script (run this to undo the migration):
-- BEGIN;
-- DROP TABLE IF EXISTS payment_transactions;
-- ALTER TABLE table_sessions
--     DROP COLUMN IF EXISTS momo_request_id,
--     DROP COLUMN IF EXISTS momo_order_id,
--     DROP COLUMN IF EXISTS momo_transaction_id,
--     DROP COLUMN IF EXISTS momo_payment_status,
--     DROP COLUMN IF EXISTS momo_payment_amount,
--     DROP COLUMN IF EXISTS momo_payment_time,
--     DROP COLUMN IF EXISTS momo_response_code,
--     DROP COLUMN IF EXISTS momo_signature,
--     DROP COLUMN IF EXISTS momo_extra_data,
--     DROP COLUMN IF EXISTS momo_error_message,
--     DROP COLUMN IF EXISTS momo_raw_response;
-- COMMIT;
