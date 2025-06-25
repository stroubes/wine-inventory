-- Wine Inventory Database Schema

-- Wines table
CREATE TABLE IF NOT EXISTS wines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vineyard TEXT NOT NULL,
  region TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified')),
  grape_varieties TEXT NOT NULL, -- JSON array
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  vintage_year INTEGER CHECK (vintage_year >= 1800 AND vintage_year <= 2024),
  date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
  rack_slot TEXT,
  consumption_status TEXT DEFAULT 'Available' CHECK (consumption_status IN ('Available', 'Consumed', 'Reserved')),
  date_consumed DATETIME,
  description TEXT,
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 100),
  food_pairings TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  wine_id TEXT REFERENCES wines(id) ON DELETE CASCADE,
  memory_id TEXT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  image_type TEXT NOT NULL CHECK (image_type IN ('front_label', 'back_label', 'memory')),
  alt_text TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  wine_id TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  experience_date DATETIME NOT NULL,
  location TEXT,
  tags TEXT, -- JSON array
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rack slots table
CREATE TABLE IF NOT EXISTS rack_slots (
  slot_id TEXT PRIMARY KEY,
  wine_id TEXT REFERENCES wines(id) ON DELETE SET NULL,
  rack_number INTEGER NOT NULL,
  row TEXT NOT NULL,
  position INTEGER NOT NULL,
  x_coordinate INTEGER NOT NULL,
  y_coordinate INTEGER NOT NULL,
  width INTEGER DEFAULT 20,
  height INTEGER DEFAULT 80,
  is_occupied BOOLEAN DEFAULT FALSE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rack_number, row, position)
);

-- Food pairings table
CREATE TABLE IF NOT EXISTS food_pairings (
  id TEXT PRIMARY KEY,
  wine_id TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  food_item TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Appetizer', 'Main Course', 'Dessert', 'Cheese', 'Other')),
  description TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  is_suggested BOOLEAN DEFAULT FALSE,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wine_id, food_item)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wines_name ON wines(name);
CREATE INDEX IF NOT EXISTS idx_wines_vineyard ON wines(vineyard);
CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region);
CREATE INDEX IF NOT EXISTS idx_wines_color ON wines(color);
CREATE INDEX IF NOT EXISTS idx_wines_vintage_year ON wines(vintage_year);
CREATE INDEX IF NOT EXISTS idx_wines_consumption_status ON wines(consumption_status);
CREATE INDEX IF NOT EXISTS idx_wines_rack_slot ON wines(rack_slot);
CREATE INDEX IF NOT EXISTS idx_wines_date_added ON wines(date_added);

CREATE INDEX IF NOT EXISTS idx_images_wine_id ON images(wine_id);
CREATE INDEX IF NOT EXISTS idx_images_memory_id ON images(memory_id);
CREATE INDEX IF NOT EXISTS idx_images_image_type ON images(image_type);

CREATE INDEX IF NOT EXISTS idx_memories_wine_id ON memories(wine_id);
CREATE INDEX IF NOT EXISTS idx_memories_experience_date ON memories(experience_date);
CREATE INDEX IF NOT EXISTS idx_memories_title ON memories(title);

CREATE INDEX IF NOT EXISTS idx_rack_slots_wine_id ON rack_slots(wine_id);
CREATE INDEX IF NOT EXISTS idx_rack_slots_rack_number ON rack_slots(rack_number);
CREATE INDEX IF NOT EXISTS idx_rack_slots_is_occupied ON rack_slots(is_occupied);

CREATE INDEX IF NOT EXISTS idx_food_pairings_wine_id ON food_pairings(wine_id);
CREATE INDEX IF NOT EXISTS idx_food_pairings_category ON food_pairings(category);
CREATE INDEX IF NOT EXISTS idx_food_pairings_is_suggested ON food_pairings(is_suggested);

-- Add foreign key constraint for images.memory_id after memories table exists
-- This will be handled by the application