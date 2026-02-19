import { ICharacterRepository } from '@/domain/interfaces';
import { PrimaryStatKey, Character } from '@/domain/models';
import { clamp } from '@/domain/engine/dice';
import { CONFIG } from '@/domain/config';

export class AllocateStatPointUseCase {
  constructor(private characterRepo: ICharacterRepository) {}

  async execute(characterId: number, stat: PrimaryStatKey, points: number = 1): Promise<{ success: boolean; character?: Character; reason?: string }> {
    const character = await this.characterRepo.get(characterId);
    if (!character) return { success: false, reason: 'Character not found' };
    if (character.freeStatPoints < points) return { success: false, reason: 'Not enough stat points' };
    
    const currentValue = character.primaryStats[stat];
    const newValue = clamp(currentValue + points, CONFIG.stats.minStat, CONFIG.stats.maxStat);
    const actualGain = newValue - currentValue;
    
    if (actualGain === 0) return { success: false, reason: 'Stat already at maximum' };
    
    await this.characterRepo.updateStats(character.id, { [stat]: newValue } as Partial<typeof character.primaryStats>);
    const updated = await this.characterRepo.update(character.id, { freeStatPoints: character.freeStatPoints - actualGain });
    
    return { success: true, character: updated };
  }
}
