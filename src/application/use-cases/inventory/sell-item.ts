import { IInventoryRepository, ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { calculateSellPrice } from '@/domain/engine/economy-engine';

export interface SellItemInput {
  characterId: number;
  instanceId: number;
  quantity?: number;
  merchantMod: number;
  gameDay: number;
}

export interface SellItemOutput {
  throneGained: number;
  remainingThrones: number;
  itemRemoved: boolean;
}

export class SellItemUseCase {
  constructor(
    private inventoryRepo: IInventoryRepository,
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: SellItemInput): Promise<SellItemOutput> {
    const { characterId, instanceId, quantity = 1, merchantMod, gameDay } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const invItem = await this.inventoryRepo.getById(instanceId);
    if (!invItem) throw new Error('Item not found');

    if (quantity > invItem.quantity) {
      throw new Error(`Cannot sell ${quantity}, only have ${invItem.quantity}`);
    }

    const unitPrice = calculateSellPrice(invItem.item.basePrice, invItem.condition, merchantMod);
    const totalPrice = unitPrice * quantity;

    // Add thrones
    const remainingThrones = character.thrones + totalPrice;
    await this.characterRepo.update(characterId, { thrones: remainingThrones });

    // Remove or reduce quantity
    let itemRemoved = false;
    if (invItem.quantity <= quantity) {
      await this.inventoryRepo.remove(instanceId);
      itemRemoved = true;
    } else {
      await this.inventoryRepo.update(instanceId, { quantity: invItem.quantity - quantity });
    }

    await this.eventRepo.logEvent(characterId, {
      eventType: 'item_sold',
      title: 'Item Sold',
      description: `Sold ${quantity}x ${invItem.item.name} for ${totalPrice} Thrones.`,
      data: { itemId: invItem.item.id, quantity, price: totalPrice },
      gameDay,
    });

    return { throneGained: totalPrice, remainingThrones, itemRemoved };
  }
}
