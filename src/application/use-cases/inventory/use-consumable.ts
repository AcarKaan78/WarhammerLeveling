import { IInventoryRepository, ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { ConsumableProperties } from '@/domain/models';

export interface UseConsumableInput {
  characterId: number;
  instanceId: number;
  gameDay: number;
}

export interface UseConsumableOutput {
  effectDescription: string;
  statChanges: Record<string, number>;
  removed: boolean;
}

export class UseConsumableUseCase {
  constructor(
    private inventoryRepo: IInventoryRepository,
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: UseConsumableInput): Promise<UseConsumableOutput> {
    const { characterId, instanceId, gameDay } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const invItem = await this.inventoryRepo.getById(instanceId);
    if (!invItem) throw new Error('Item not found');

    if (invItem.item.category !== 'consumable') {
      throw new Error('Item is not a consumable');
    }

    const props = invItem.item.properties as unknown as ConsumableProperties;
    const statChanges: Record<string, number> = {};
    const updates: Record<string, unknown> = {};
    let effectDescription = `Used ${invItem.item.name}.`;

    switch (props.effectType) {
      case 'heal': {
        const healAmount = props.amount ?? 0;
        const newHP = Math.min(character.hpMax, character.hpCurrent + healAmount);
        updates.hpCurrent = newHP;
        statChanges['hpCurrent'] = newHP - character.hpCurrent;
        effectDescription = `Healed ${newHP - character.hpCurrent} HP.`;
        break;
      }
      case 'restore': {
        if (props.stat === 'sanity') {
          const amount = props.amount ?? 0;
          const newSanity = Math.min(character.sanityMax, character.sanity + amount);
          updates.sanity = newSanity;
          statChanges['sanity'] = newSanity - character.sanity;
          effectDescription = `Restored ${newSanity - character.sanity} sanity.`;
        } else if (props.stat === 'fatigue') {
          const amount = props.amount ?? 0;
          const newFatigue = Math.max(0, character.fatigue - amount);
          updates.fatigue = newFatigue;
          statChanges['fatigue'] = newFatigue - character.fatigue;
          effectDescription = `Reduced fatigue by ${character.fatigue - newFatigue}.`;
        }
        break;
      }
      case 'buff': {
        if (props.stat && props.amount) {
          statChanges[props.stat] = props.amount;
          effectDescription = `Gained +${props.amount} ${props.stat} temporarily.`;
        }
        break;
      }
      case 'special': {
        effectDescription = `Used ${invItem.item.name}. Special effect applied.`;
        break;
      }
    }

    // Apply character updates
    if (Object.keys(updates).length > 0) {
      await this.characterRepo.update(characterId, updates as never);
    }

    // Remove or reduce quantity
    let removed = false;
    if (invItem.quantity <= 1) {
      await this.inventoryRepo.remove(instanceId);
      removed = true;
    } else {
      await this.inventoryRepo.update(instanceId, { quantity: invItem.quantity - 1 });
    }

    await this.eventRepo.logEvent(characterId, {
      eventType: 'item_used',
      title: 'Item Used',
      description: effectDescription,
      data: { itemId: invItem.item.id, effects: statChanges },
      gameDay,
    });

    return { effectDescription, statChanges, removed };
  }
}
