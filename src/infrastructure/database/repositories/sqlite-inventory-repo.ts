import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IInventoryRepository } from '@/domain/interfaces';
import type {
  InventoryItem,
  Item,
  EquipmentSlot,
} from '@/domain/models';
import { inventory } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteInventoryRepository implements IInventoryRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async add(
    characterId: number,
    item: Omit<InventoryItem, 'instanceId' | 'characterId'>,
  ): Promise<InventoryItem> {
    const rows = this.db
      .insert(inventory)
      .values({
        characterId,
        itemId: item.item.id,
        itemData: JSON.stringify(item.item),
        quantity: item.quantity,
        condition: item.condition,
        conditionMax: item.conditionMax,
        equipped: item.equipped,
        slot: item.slot,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async getById(instanceId: number): Promise<InventoryItem | null> {
    const rows = this.db
      .select()
      .from(inventory)
      .where(eq(inventory.instanceId, instanceId))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getAll(characterId: number): Promise<InventoryItem[]> {
    const rows = this.db
      .select()
      .from(inventory)
      .where(eq(inventory.characterId, characterId))
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async update(instanceId: number, changes: Partial<InventoryItem>): Promise<InventoryItem> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'instanceId') continue;
      if (key === 'item' && value !== undefined) {
        updateData.itemData = JSON.stringify(value);
        updateData.itemId = (value as Item).id;
      } else if (key === 'characterId') {
        updateData.characterId = value;
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.instanceId, instanceId))
      .run();

    const result = await this.getById(instanceId);
    if (!result) throw new Error(`Inventory item with instanceId ${instanceId} not found after update`);
    return result;
  }

  async remove(instanceId: number): Promise<void> {
    this.db.delete(inventory).where(eq(inventory.instanceId, instanceId)).run();
  }

  async equip(instanceId: number, slot: EquipmentSlot): Promise<void> {
    this.db
      .update(inventory)
      .set({ equipped: true, slot })
      .where(eq(inventory.instanceId, instanceId))
      .run();
  }

  async unequip(instanceId: number): Promise<void> {
    this.db
      .update(inventory)
      .set({ equipped: false, slot: null })
      .where(eq(inventory.instanceId, instanceId))
      .run();
  }

  private mapRow(row: typeof inventory.$inferSelect): InventoryItem {
    return {
      instanceId: row.instanceId,
      characterId: row.characterId,
      item: JSON.parse(row.itemData) as Item,
      quantity: row.quantity,
      condition: row.condition,
      conditionMax: row.conditionMax,
      equipped: row.equipped,
      slot: row.slot as EquipmentSlot | null,
    };
  }
}
