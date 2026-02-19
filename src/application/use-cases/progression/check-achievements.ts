import { ICharacterRepository, IAchievementRepository, IEventRepository } from '@/domain/interfaces';
import { Achievement } from '@/domain/models';
import { checkAchievementCondition } from '@/domain/engine/achievement-engine';

export interface CheckAchievementsOutput {
  newlyUnlocked: Array<{ id: string; name: string; description: string }>;
}

export class CheckAchievementsUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private achievementRepo: IAchievementRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number, achievements: Achievement[], gameDay: number): Promise<CheckAchievementsOutput> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const records = await this.achievementRepo.getAll(characterId);
    const unlockedIds = new Set(records.filter(r => r.unlocked).map(r => r.achievementId));
    const newlyUnlocked: CheckAchievementsOutput['newlyUnlocked'] = [];

    const gameState = {
      level: character.level,
      stats: character.primaryStats as unknown as Record<string, number>,
      flags: {} as Record<string, boolean>,
      killCount: 0,
      questsComplete: [] as string[],
      taskCount: 0,
      streaks: {} as Record<string, number>,
      factionReps: {} as Record<string, number>,
      corruption: character.corruption,
      sanity: character.sanity,
    };

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      if (checkAchievementCondition(achievement.conditions, gameState)) {
        await this.achievementRepo.unlock(characterId, achievement.id);
        newlyUnlocked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
        });

        await this.eventRepo.logEvent(characterId, {
          eventType: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          description: `Unlocked: ${achievement.name}`,
          data: { achievementId: achievement.id },
          gameDay,
        });
      }
    }

    return { newlyUnlocked };
  }
}
