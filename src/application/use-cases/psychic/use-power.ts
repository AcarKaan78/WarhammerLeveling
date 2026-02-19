import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { PsychicPower } from '@/domain/models';
import { resolvePowerUse } from '@/domain/engine/psychic-engine';
import { getSanityState } from '@/domain/engine/sanity-engine';
import { checkMutationThreshold } from '@/domain/engine/corruption-engine';
import { CONFIG } from '@/domain/config';

export interface UsePowerInput {
  characterId: number;
  power: PsychicPower;
  difficulty: number;
  modifiers?: number[];
  gameDay: number;
}

export interface UsePowerOutput {
  success: boolean;
  effectDescription: string;
  sanityLost: number;
  corruptionGained: number;
  damage: number;
  mutationTriggered: boolean;
  perilsOccurred: boolean;
  perilsSeverity: string | null;
}

export class UsePowerUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: UsePowerInput): Promise<UsePowerOutput> {
    const { characterId, power, difficulty, modifiers = [], gameDay } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    if (character.psyRating < 1) {
      throw new Error('Character has no psychic ability');
    }

    // Resolve power use via psychic engine
    const result = resolvePowerUse(power, character.primaryStats.willpower, difficulty, modifiers);

    // Calculate total sanity loss from perils
    const sanityLost = result.perilsResult.effect?.sanityLoss ?? 0;
    const damage = result.perilsResult.effect?.damage ?? 0;

    // Apply changes to character
    const oldCorruption = character.corruption;
    const newCorruption = Math.min(100, character.corruption + result.corruptionGained);
    const newSanity = Math.max(0, character.sanity - sanityLost);
    const newHP = Math.max(0, character.hpCurrent - damage);

    const mutationTriggered = checkMutationThreshold(oldCorruption, newCorruption);

    await this.characterRepo.update(characterId, {
      corruption: newCorruption,
      sanity: newSanity,
      hpCurrent: newHP,
    });

    await this.eventRepo.logEvent(characterId, {
      eventType: 'psychic_power_used',
      title: result.success ? 'Power Manifested' : 'Power Failed',
      description: result.effectDescription,
      data: {
        powerId: power.id,
        success: result.success,
        corruptionGained: result.corruptionGained,
        sanityLost,
        perilsOccurred: result.perilsResult.occurred,
        perilsSeverity: result.perilsResult.severity,
      },
      gameDay,
    });

    return {
      success: result.success,
      effectDescription: result.effectDescription,
      sanityLost,
      corruptionGained: result.corruptionGained,
      damage,
      mutationTriggered,
      perilsOccurred: result.perilsResult.occurred,
      perilsSeverity: result.perilsResult.severity,
    };
  }
}
