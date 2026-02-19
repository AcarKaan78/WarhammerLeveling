import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { checkLevelUp, calculateXPToNext } from '@/domain/engine/progression-engine';
import { CONFIG } from '@/domain/config';

export interface LevelUpOutput {
  levelsGained: number;
  newLevel: number;
  statPointsAwarded: number;
  skillPointsAwarded: number;
  perkPointsAwarded: number;
}

export class CheckLevelUpUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number, gameDay: number): Promise<LevelUpOutput> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const result = checkLevelUp(character.xp, character.xpToNext, character.level);

    if (result.levelsGained === 0) {
      return { levelsGained: 0, newLevel: character.level, statPointsAwarded: 0, skillPointsAwarded: 0, perkPointsAwarded: 0 };
    }

    const newLevel = character.level + result.levelsGained;
    let statPoints = 0;
    let skillPoints = 0;
    let perkPoints = 0;
    for (const reward of result.rewards) {
      statPoints += reward.statPoints;
      skillPoints += reward.skillPoints;
      perkPoints += reward.perkPoint ? 1 : 0;
    }

    await this.characterRepo.update(characterId, {
      level: newLevel,
      xp: result.remainingXP,
      xpToNext: calculateXPToNext(newLevel),
      freeStatPoints: character.freeStatPoints + statPoints,
      freeSkillPoints: character.freeSkillPoints + skillPoints,
      freePerkPoints: character.freePerkPoints + perkPoints,
    });

    await this.eventRepo.logEvent(characterId, {
      eventType: 'level_up',
      title: 'Level Up!',
      description: `Advanced to level ${newLevel}! Gained ${statPoints} stat points, ${skillPoints} skill points${perkPoints > 0 ? `, ${perkPoints} perk points` : ''}.`,
      data: { newLevel, statPoints, skillPoints, perkPoints },
      gameDay,
    });

    return { levelsGained: result.levelsGained, newLevel, statPointsAwarded: statPoints, skillPointsAwarded: skillPoints, perkPointsAwarded: perkPoints };
  }
}
