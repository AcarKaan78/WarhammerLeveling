import { IInventoryRepository, IEventRepository } from '@/domain/interfaces';
import { InventoryItem, Item } from '@/domain/models';

export interface AddItemInput {
  characterId: number;
  item: Item;
  quantity?: number;
  gameDay: number;
}

export class AddItemUseCase {
  constructor(
    private inventoryRepo: IInventoryRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: AddItemInput): Promise<InventoryItem> {
    const { characterId, item, quantity = 1, gameDay } = input;

    // If stackable, check if we already have this item
    if (item.stackable) {
      const allItems = await this.inventoryRepo.getAll(characterId);
      const existing = allItems.find(inv => inv.item.id === item.id);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, item.maxStack);
        const updated = await this.inventoryRepo.update(existing.instanceId, {
          quantity: newQuantity,
        });
        await this.eventRepo.logEvent(characterId, {
          eventType: 'item_added',
          title: 'Item Added',
          description: `Added ${quantity}x ${item.name} to inventory.`,
          data: { itemId: item.id, quantity },
          gameDay,
        });
        return updated;
      }
    }

    const inventoryItem = await this.inventoryRepo.add(characterId, {
      item,
      quantity,
      condition: 100,
      conditionMax: 100,
      equipped: false,
      slot: null,
    });

    await this.eventRepo.logEvent(characterId, {
      eventType: 'item_added',
      title: 'Item Added',
      description: `Added ${quantity}x ${item.name} to inventory.`,
      data: { itemId: item.id, quantity },
      gameDay,
    });

    return inventoryItem;
  }
}
