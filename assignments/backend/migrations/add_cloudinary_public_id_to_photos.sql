-- Migration: Add cloudinary_public_id column to menu_item_photos table
-- This allows storing Cloudinary public IDs for photo deletion

ALTER TABLE menu_item_photos 
ADD COLUMN cloudinary_public_id VARCHAR(255) 
COMMENT 'Cloudinary public ID for photo deletion';

-- Create index for faster lookups
CREATE INDEX idx_menu_item_photos_cloudinary_id 
ON menu_item_photos(cloudinary_public_id);
