-- Migration: Create reviews table
-- Run after table_sessions and menu_items tables exist

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    status VARCHAR(20) DEFAULT 'approved' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: one review per item per session per customer
    CONSTRAINT reviews_unique_per_session UNIQUE (menu_item_id, customer_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Add average_rating and review_count columns to menu_items (optional but recommended)
ALTER TABLE menu_items 
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5);

ALTER TABLE menu_items 
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- Function to update menu item rating statistics
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_menu_item_id UUID;
BEGIN
    -- Get menu_item_id from NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        v_menu_item_id := OLD.menu_item_id;
    ELSE
        v_menu_item_id := NEW.menu_item_id;
    END IF;
    
    -- Update menu item statistics
    UPDATE menu_items
    SET 
        average_rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews
            WHERE menu_item_id = v_menu_item_id 
            AND status = 'approved'
        ), 0.00),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE menu_item_id = v_menu_item_id 
            AND status = 'approved'
        )
    WHERE id = v_menu_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update menu item ratings
CREATE TRIGGER trigger_update_rating_after_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_rating();

CREATE TRIGGER trigger_update_rating_after_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating)
    EXECUTE FUNCTION update_menu_item_rating();

CREATE TRIGGER trigger_update_rating_after_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_rating();

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Customer reviews for menu items, linked to specific sessions';
COMMENT ON COLUMN reviews.menu_item_id IS 'Menu item being reviewed';
COMMENT ON COLUMN reviews.customer_id IS 'Customer who wrote the review';
COMMENT ON COLUMN reviews.session_id IS 'Dining session where the item was ordered';
COMMENT ON COLUMN reviews.order_id IS 'Specific order (optional link for traceability)';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.comment IS 'Optional text review';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN reviews.status IS 'Review moderation status: pending, approved, rejected';

COMMENT ON COLUMN menu_items.average_rating IS 'Average rating from approved reviews (0.00-5.00)';
COMMENT ON COLUMN menu_items.review_count IS 'Total number of approved reviews';

-- Sample query to verify
-- SELECT 
--     mi.name,
--     mi.average_rating,
--     mi.review_count,
--     COUNT(r.id) as actual_reviews
-- FROM menu_items mi
-- LEFT JOIN reviews r ON r.menu_item_id = mi.id AND r.status = 'approved'
-- GROUP BY mi.id, mi.name, mi.average_rating, mi.review_count
-- ORDER BY mi.average_rating DESC;
