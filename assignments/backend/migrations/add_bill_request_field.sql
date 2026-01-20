-- Migration: Add bill request tracking to table_sessions
-- This allows customers to request a bill preview without triggering payment

-- Add bill_requested_at column
ALTER TABLE table_sessions 
ADD COLUMN IF NOT EXISTS bill_requested_at TIMESTAMP NULL;

-- Create index for efficient querying of pending bill requests
CREATE INDEX IF NOT EXISTS idx_sessions_bill_requested 
ON table_sessions(bill_requested_at) 
WHERE bill_requested_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN table_sessions.bill_requested_at IS 'Timestamp when customer requested bill preview - NULL when cleared by waiter';

-- Sample queries to verify
-- List all pending bill requests:
-- SELECT s.id, s.session_number, t.table_number, s.total_amount, s.bill_requested_at
-- FROM table_sessions s
-- JOIN tables t ON s.table_id = t.id
-- WHERE s.bill_requested_at IS NOT NULL
-- ORDER BY s.bill_requested_at DESC;
