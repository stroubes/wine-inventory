export interface Wine {
  id: string;
  name: string;
  vineyard: string;
  region: string;
  color: 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Dessert' | 'Fortified';
  grape_varieties: string[];
  price?: number;
  currency: string;
  vintage_year?: number;
  date_added: Date;
  rack_slot?: string;
  consumption_status: 'Available' | 'Consumed' | 'Reserved';
  date_consumed?: Date;
  description?: string;
  personal_notes?: string;
  rating?: number; // 1-100
  food_pairings?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface WineImage {
  id: string;
  wine_id?: string;
  memory_id?: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  image_type: 'front_label' | 'back_label' | 'memory';
  alt_text?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WineMemory {
  id: string;
  wine_id: string;
  title: string;
  description: string;
  experience_date: Date;
  location?: string;
  tags: string[];
  rating?: number; // 1-5 stars
  created_at: Date;
  updated_at: Date;
}

export interface RackSlot {
  slot_id: string;
  wine_id?: string;
  rack_number: number;
  row: string;
  position: number;
  x_coordinate: number;
  y_coordinate: number;
  width: number;
  height: number;
  is_occupied: boolean;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

export interface FoodPairing {
  id: string;
  wine_id: string;
  food_item: string;
  category: 'Appetizer' | 'Main Course' | 'Dessert' | 'Cheese' | 'Other';
  description?: string;
  user_rating?: number; // 1-5 stars
  is_suggested: boolean;
  source?: string;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface CreateWineRequest {
  name: string;
  vineyard: string;
  region: string;
  color: Wine['color'];
  grape_varieties: string[];
  price?: number;
  currency?: string;
  vintage_year?: number;
  rack_slot?: string;
  description?: string;
  personal_notes?: string;
  rating?: number;
  food_pairings?: string[];
}

export interface UpdateWineRequest extends Partial<CreateWineRequest> {
  consumption_status?: Wine['consumption_status'];
  date_consumed?: Date;
}

export interface WineSearchFilters {
  search?: string;
  color?: Wine['color'];
  region?: string;
  vintage_year_min?: number;
  vintage_year_max?: number;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  rating_max?: number;
  consumption_status?: Wine['consumption_status'];
  rack_slot?: string;
}

export interface WineListResponse {
  wines: Wine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}