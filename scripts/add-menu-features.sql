-- Add new columns to menu_items table to support enhanced menu features
-- This migration adds support for recommendations, stock tracking, and customization options

-- Add is_recommended column to mark featured/popular items
ALTER TABLE menu_items ADD COLUMN is_recommended INTEGER DEFAULT 0;

-- Add stock column to track inventory per menu item
ALTER TABLE menu_items ADD COLUMN stock REAL DEFAULT 999999;

-- Add customization_options as JSON for sizes, toppings, etc
ALTER TABLE menu_items ADD COLUMN customization_options TEXT DEFAULT '{}';

-- Add dietary_tags for filtering (vegetarian, vegan, gluten-free, etc)
ALTER TABLE menu_items ADD COLUMN dietary_tags TEXT DEFAULT '[]';

-- Create index for faster filtering by availability and recommendations
CREATE INDEX IF NOT EXISTS idx_menu_items_available_recommended 
ON menu_items(is_available, is_recommended);

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_menu_items_name_category 
ON menu_items(name, category);
