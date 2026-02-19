import { InventoryItem, EquipmentSlot } from '@/domain/models';

export interface IInventoryRepository {
  add(characterId: number, item: Omit<InventoryItem, 'instanceId' | 'characterId'>): Promise<InventoryItem>;
  getById(instanceId: number): Promise<InventoryItem | null>;
  getAll(characterId: number): Promise<InventoryItem[]>;
  update(instanceId: number, changes: Partial<InventoryItem>): Promise<InventoryItem>;
  remove(instanceId: number): Promise<void>;
  equip(instanceId: number, slot: EquipmentSlot): Promise<void>;
  unequip(instanceId: number): Promise<void>;
}
