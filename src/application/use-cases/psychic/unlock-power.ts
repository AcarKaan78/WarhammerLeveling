import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { PsychicPower } from '@/domain/models';

export interface UnlockPowerInput {
  characterId: number;
  power: PsychicPower;
  unlockedPowerIds: string[];
  gameDay: number;
}

export interface UnlockPowerOutput {
  unlocked: boolean;
  reason?: string;
}

export class UnlockPowerUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: UnlockPowerInput): Promise<UnlockPowerOutput> {
    const { characterId, power, unlockedPowerIds, gameDay } = input;

    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    // Check psy rating requirement
    if (character.psyRating < power.tier) {
      return { unlocked: false, reason: `Requires Psy Rating ${power.tier}, you have ${character.psyRating}` };
    }

    // Check prerequisites
    for (const prereqId of power.prerequisites) {
      if (!unlockedPowerIds.includes(prereqId)) {
        return { unlocked: false, reason: `Requires prerequisite power: ${prereqId}` };
      }
    }

    // Already unlocked?
    if (unlockedPowerIds.includes(power.id)) {
      return { unlocked: false, reason: 'Power already unlocked' };
    }

    await this.eventRepo.logEvent(characterId, {
      eventType: 'psychic_power_unlocked',
      title: 'Power Unlocked',
      description: `Unlocked psychic power: ${power.name} (${power.discipline}, Tier ${power.tier}).`,
      data: { powerId: power.id, discipline: power.discipline, tier: power.tier },
      gameDay,
    });

    return { unlocked: true };
  }
}
