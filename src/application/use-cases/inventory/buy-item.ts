import { IInventoryRepository, ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { Item, InventoryItem } from '@/domain/models';
import { calculateBuyPrice } from '@/domain/engine/economy-engine';

export interface BuyItemInput {
  characterId: number;
  item: Item;
  quantity?: number;
  merchantRelationship: number;
  factionRep: number;
  gameDay: number;
}

export interface BuyItemOutput {
  inventoryItem: InventoryItem;
  pricePaid: number;
  remainingThrones: number;
}

export class BuyItemUseCase {
  constructor(
    private inventoryRepo: IInventoryRepository,
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: BuyItemInput): Promise<BuyItemOutput> {
    const { characterId, item, quantity = 1, merchantRelationship, factionRep, gameDay } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const unitPrice = calculateBuyPrice(
      item.basePrice,
      character.primaryStats.fellowship,
      merchantRelationship,
      factionRep,
    );
    const totalPrice = unitPrice * quantity;

    if (character.thrones < totalPrice) {
      throw new Error(`Not enough Thrones. Need ${totalPrice}, have ${character.thrones}`);
    }

    // Deduct thrones
    const remainingThrones = character.thrones - totalPrice;
    await this.characterRepo.update(characterId, { thrones: remainingThrones });

    // Add item to inventory (handle stacking)
    let inventoryItem: InventoryItem;
    if (item.stackable) {
      const allItems = await this.inventoryRepo.getAll(characterId);
      const existing = allItems.find(inv => inv.item.id === item.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, item.maxStack);
        inventoryItem = await this.inventoryRepo.update(existing.instanceId, { quantity: newQty });
      } else {
        inventoryItem = await this.inventoryRepo.add(characterId, {
          item,
          quantity,
          condition: 100,
          conditionMax: 100,
          equipped: false,
          slot: null,
        });
      }
    } else {
      inventoryItem = await this.inventoryRepo.add(characterId, {
        item,
        quantity: 1,
        condition: 100,
        conditionMax: 100,
        equipped: false,
        slot: null,
      });
    }

    await this.eventRepo.logEvent(characterId, {
      eventType: 'item_purchased',
      title: 'Item Purchased',
      description: `Bought ${quantity}x ${item.name} for ${totalPrice} Thrones.`,
      data: { itemId: item.id, quantity, price: totalPrice },
      gameDay,
    });

    return { inventoryItem, pricePaid: totalPrice, remainingThrones };
  }
}
