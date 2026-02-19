import { IInventoryRepository, ICharacterRepository } from '@/domain/interfaces';
import { EquipmentSlot, InventoryItem } from '@/domain/models';
import { checkEquipRequirements } from '@/domain/engine/inventory-engine';

export interface EquipItemInput {
  characterId: number;
  instanceId: number;
  slot: EquipmentSlot;
}

export interface EquipItemOutput {
  equipped: InventoryItem;
  unequipped: InventoryItem | null;
}

export class EquipItemUseCase {
  constructor(
    private inventoryRepo: IInventoryRepository,
    private characterRepo: ICharacterRepository,
  ) {}

  async execute(input: EquipItemInput): Promise<EquipItemOutput> {
    const { characterId, instanceId, slot } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const item = await this.inventoryRepo.getById(instanceId);
    if (!item) throw new Error('Item not found');

    // Check requirements
    const stats: Record<string, number> = {};
    for (const [key, val] of Object.entries(character.primaryStats)) {
      stats[key] = val as number;
    }
    const reqCheck = checkEquipRequirements(item.item.requirements, stats);
    if (!reqCheck.canEquip) {
      throw new Error(reqCheck.reason ?? 'Cannot equip this item');
    }

    // Unequip any item currently in that slot
    let unequipped: InventoryItem | null = null;
    const allItems = await this.inventoryRepo.getAll(characterId);
    const currentlyEquipped = allItems.find(inv => inv.equipped && inv.slot === slot);
    if (currentlyEquipped) {
      await this.inventoryRepo.unequip(currentlyEquipped.instanceId);
      unequipped = { ...currentlyEquipped, equipped: false, slot: null };
    }

    // Equip the new item
    await this.inventoryRepo.equip(instanceId, slot);
    const equipped = { ...item, equipped: true, slot };

    return { equipped, unequipped };
  }
}
