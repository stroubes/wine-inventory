import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { Wine, CreateWineRequest, UpdateWineRequest, WineSearchFilters } from '../types/wine';
import { RackSlotModel } from './RackSlot';

export class WineModel {
  private static TABLE = 'wines';

  static async create(wineData: CreateWineRequest): Promise<Wine> {
    const id = uuidv4();
    const wine = {
      id,
      ...wineData,
      grape_varieties: JSON.stringify(wineData.grape_varieties),
      food_pairings: wineData.food_pairings ? JSON.stringify(wineData.food_pairings) : null,
      currency: wineData.currency || 'USD',
    };

    await db(this.TABLE).insert(wine);
    const result = await this.findById(id);
    if (!result) {
      throw new Error('Failed to create wine');
    }
    return result;
  }

  static async findById(id: string): Promise<Wine | null> {
    const wine = await db(this.TABLE).where({ id }).first();
    if (!wine) return null;
    
    return this.transformFromDb(wine);
  }

  static async findAll(filters: WineSearchFilters = {}, page = 1, limit = 20): Promise<{ wines: Wine[], total: number }> {
    let query = db(this.TABLE);

    // Apply filters
    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'like', `%${filters.search}%`)
          .orWhere('vineyard', 'like', `%${filters.search}%`)
          .orWhere('region', 'like', `%${filters.search}%`)
          .orWhere('grape_varieties', 'like', `%${filters.search}%`)
          .orWhere('description', 'like', `%${filters.search}%`)
          .orWhere('personal_notes', 'like', `%${filters.search}%`);
      });
    }

    if (filters.color) {
      query = query.where('color', filters.color);
    }

    if (filters.region) {
      query = query.where('region', 'like', `%${filters.region}%`);
    }

    if (filters.vintage_year_min) {
      query = query.where('vintage_year', '>=', filters.vintage_year_min);
    }

    if (filters.vintage_year_max) {
      query = query.where('vintage_year', '<=', filters.vintage_year_max);
    }

    if (filters.price_min) {
      query = query.where('price', '>=', filters.price_min);
    }

    if (filters.price_max) {
      query = query.where('price', '<=', filters.price_max);
    }

    if (filters.rating_min) {
      query = query.where('rating', '>=', filters.rating_min);
    }

    if (filters.rating_max) {
      query = query.where('rating', '<=', filters.rating_max);
    }

    if (filters.consumption_status) {
      query = query.where('consumption_status', filters.consumption_status);
    }

    if (filters.rack_slot) {
      query = query.where('rack_slot', 'like', `%${filters.rack_slot}%`);
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = Number(count);

    // Apply pagination
    const offset = (page - 1) * limit;
    const wines = await query
      .orderBy('date_added', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      wines: wines.map(wine => this.transformFromDb(wine)),
      total
    };
  }

  static async update(id: string, updates: UpdateWineRequest): Promise<Wine | null> {
    const updateData = { ...updates };
    
    if (updates.grape_varieties) {
      updateData.grape_varieties = JSON.stringify(updates.grape_varieties) as any;
    }
    
    if (updates.food_pairings) {
      updateData.food_pairings = JSON.stringify(updates.food_pairings) as any;
    }

    // If marking as consumed, clear rack slot
    if (updates.consumption_status === 'Consumed') {
      await RackSlotModel.clearSlotByWineId(id);
      updateData.rack_slot = null as any; // Clear the rack slot reference
    }

    await db(this.TABLE).where({ id }).update({
      ...updateData,
      updated_at: new Date()
    });

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const deletedRows = await db(this.TABLE).where({ id }).del();
    return deletedRows > 0;
  }

  static async markConsumed(id: string, consumedDate?: Date): Promise<Wine | null> {
    // First, clear any rack slot assignment for this wine
    await RackSlotModel.clearSlotByWineId(id);

    // Then update the wine's consumption status and clear its rack_slot field
    await db(this.TABLE).where({ id }).update({
      consumption_status: 'Consumed',
      date_consumed: consumedDate || new Date(),
      rack_slot: null, // Clear the rack slot reference
      updated_at: new Date()
    });

    return this.findById(id);
  }

  static async getStatistics(): Promise<{
    total: number;
    available: number;
    consumed: number;
    reserved: number;
    colors: Record<string, number>;
    regions: Record<string, number>;
  }> {
    const [totalResult] = await db(this.TABLE).count('* as count');
    const total = Number(totalResult.count);

    const statusCounts = await db(this.TABLE)
      .select('consumption_status')
      .count('* as count')
      .groupBy('consumption_status');

    const colorCounts = await db(this.TABLE)
      .select('color')
      .count('* as count')
      .groupBy('color');

    const regionCounts = await db(this.TABLE)
      .select('region')
      .count('* as count')
      .groupBy('region')
      .orderBy('count', 'desc')
      .limit(10);

    const stats = {
      total,
      available: 0,
      consumed: 0,
      reserved: 0,
      colors: {} as Record<string, number>,
      regions: {} as Record<string, number>
    };

    statusCounts.forEach(({ consumption_status, count }) => {
      const statusKey = (consumption_status as string).toLowerCase() as keyof typeof stats;
      if (statusKey in stats && typeof stats[statusKey] === 'number') {
        (stats as any)[statusKey] = Number(count);
      }
    });

    colorCounts.forEach(({ color, count }) => {
      stats.colors[color] = Number(count);
    });

    regionCounts.forEach(({ region, count }) => {
      stats.regions[region] = Number(count);
    });

    return stats;
  }

  private static transformFromDb(dbWine: any): Wine {
    return {
      ...dbWine,
      grape_varieties: JSON.parse(dbWine.grape_varieties || '[]'),
      food_pairings: dbWine.food_pairings ? JSON.parse(dbWine.food_pairings) : [],
      date_added: new Date(dbWine.date_added),
      date_consumed: dbWine.date_consumed ? new Date(dbWine.date_consumed) : null,
      created_at: new Date(dbWine.created_at),
      updated_at: new Date(dbWine.updated_at)
    };
  }
}