-- Add venue_id and room_id columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS venue_id INTEGER REFERENCES venues(id),
ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_venue_id ON orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id); 