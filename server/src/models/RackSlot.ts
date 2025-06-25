import db from '../database';
import { RackSlot } from '../types/wine';

export class RackSlotModel {
  private static TABLE = 'rack_slots';

  static async findBySlotId(slotId: string): Promise<RackSlot | null> {
    const slot = await db(this.TABLE).where({ slot_id: slotId }).first();
    if (!slot) return null;
    
    return this.transformFromDb(slot);
  }

  static async findByWineId(wineId: string): Promise<RackSlot | null> {
    const slot = await db(this.TABLE).where({ wine_id: wineId }).first();
    if (!slot) return null;
    
    return this.transformFromDb(slot);
  }

  static async assignWineToSlot(slotId: string, wineId: string): Promise<RackSlot | null> {
    await db(this.TABLE).where({ slot_id: slotId }).update({
      wine_id: wineId,
      is_occupied: true,
      last_updated: new Date(),
      updated_at: new Date()
    });

    return this.findBySlotId(slotId);
  }

  static async clearSlot(slotId: string): Promise<RackSlot | null> {
    await db(this.TABLE).where({ slot_id: slotId }).update({
      wine_id: null,
      is_occupied: false,
      last_updated: new Date(),
      updated_at: new Date()
    });

    return this.findBySlotId(slotId);
  }

  static async clearSlotByWineId(wineId: string): Promise<boolean> {
    const updatedRows = await db(this.TABLE).where({ wine_id: wineId }).update({
      wine_id: null,
      is_occupied: false,
      last_updated: new Date(),
      updated_at: new Date()
    });

    return updatedRows > 0;
  }

  static async findAll(): Promise<RackSlot[]> {
    const slots = await db(this.TABLE).orderBy(['rack_number', 'row', 'position']);
    return slots.map(slot => this.transformFromDb(slot));
  }

  private static transformFromDb(dbSlot: any): RackSlot {
    return {
      ...dbSlot,
      last_updated: new Date(dbSlot.last_updated),
      created_at: new Date(dbSlot.created_at),
      updated_at: new Date(dbSlot.updated_at)
    };
  }
}