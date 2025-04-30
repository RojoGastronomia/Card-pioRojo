-- Add venue_id and room_id columns to orders table
ALTER TABLE orders
ADD COLUMN venue_id INTEGER REFERENCES venues(id),
ADD COLUMN room_id INTEGER REFERENCES rooms(id);

-- Create indexes for better performance
CREATE INDEX idx_orders_venue_id ON orders(venue_id);
CREATE INDEX idx_orders_room_id ON orders(room_id); 