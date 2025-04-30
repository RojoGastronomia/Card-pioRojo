-- Create menu_dishes junction table
CREATE TABLE IF NOT EXISTS menu_dishes (
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_id, dish_id)
);

-- Migrate existing dish-menu relationships to junction table
INSERT INTO menu_dishes (menu_id, dish_id)
SELECT menu_id, id FROM dishes 
WHERE menu_id IS NOT NULL 
ON CONFLICT DO NOTHING;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_dishes_menu_id ON menu_dishes(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_dishes_dish_id ON menu_dishes(dish_id); 