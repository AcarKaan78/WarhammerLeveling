import { ITaskRepository, ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { TaskCompletionReport } from '@/domain/models';
import {
  calculateTaskXP,
  calculateStreakMultiplier,
  calculateDiminishingFactor,
  calculateStatGains,
  getDailyXPCap,
  generateCompletionReport,
} from '@/domain/engine/task-engine';
import { applyStatGain } from '@/domain/engine/stats-engine';
import { checkLevelUp, calculateXPToNext } from '@/domain/engine/progression-engine';
import { CONFIG } from '@/domain/config';

export class CompleteTaskUseCase {
  constructor(
    private taskRepo: ITaskRepository,
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(taskId: number, characterId: number): Promise<TaskCompletionReport> {
    // 1. Load task and character
    const task = await this.taskRepo.getById(taskId);
    if (!task) throw new Error('Task not found');
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    // 2. Get/create today's daily session
    const today = new Date().toISOString().split('T')[0];
    let session = await this.taskRepo.getDailySession(characterId, today);
    if (!session) {
      session = await this.taskRepo.upsertDailySession({
        id: 0,
        characterId,
        date: today,
        totalXPEarned: 0,
        xpCap: getDailyXPCap(character.level),
        tasksCompleted: 0,
        categoryCounts: {},
        streaksBroken: [],
        gameDay: 1, // will be updated by start-day
      });
    }

    // 3. Calculate XP cap check
    const xpCap = getDailyXPCap(character.level);
    const xpCapped = session.totalXPEarned >= xpCap;

    // 4. Update streak
    const newStreak = task.currentStreak + 1;
    const bestStreak = Math.max(task.bestStreak, newStreak);

    // 5. Calculate multipliers
    const streakMultiplier = calculateStreakMultiplier(newStreak);
    const categoryCounts = session.categoryCounts as Record<string, number>;
    const sameCategoryCount = (categoryCounts[task.category] ?? 0) + 1;
    const diminishingFactor = calculateDiminishingFactor(sameCategoryCount);

    // 6. Difficulty modifier from config
    const difficultyConfig = (CONFIG.difficulty as Record<string, { xpGain: number }>)[
      character.difficulty
    ];
    const difficultyMod = difficultyConfig?.xpGain ?? 1.0;

    // 7. Calculate XP
    let xpEarned = calculateTaskXP(
      task.difficulty,
      streakMultiplier,
      diminishingFactor,
      difficultyMod,
    );
    const xpBeforeCap = xpEarned;
    if (session.totalXPEarned + xpEarned > xpCap) {
      xpEarned = Math.max(0, xpCap - session.totalXPEarned);
    }

    // 8. Calculate stat gains
    const currentStatValues: Record<string, number> = {};
    for (const [key, val] of Object.entries(character.primaryStats)) {
      currentStatValues[key] = val as number;
    }
    const statGains = calculateStatGains(task.category, task.difficulty, currentStatValues);

    // 9. Apply stat gains to character
    const newStats = { ...character.primaryStats };
    for (const [stat, gain] of Object.entries(statGains)) {
      if (stat in newStats) {
        const result = applyStatGain(
          (newStats as Record<string, number>)[stat],
          gain,
        );
        (newStats as Record<string, number>)[stat] = result.newValue;
      }
    }

    // 10. Calculate new XP total and check level up
    const newXP = character.xp + xpEarned;
    const levelUpResult = checkLevelUp(newXP, character.xpToNext, character.level);
    const newLevel = character.level + levelUpResult.levelsGained;
    const newXPToNext = calculateXPToNext(newLevel);

    // Calculate remaining XP after level ups
    let remainingXP = newXP;
    let tempXPToNext = character.xpToNext;
    for (let i = 0; i < levelUpResult.levelsGained; i++) {
      remainingXP -= tempXPToNext;
      tempXPToNext = calculateXPToNext(character.level + i + 1);
    }

    // 11. Build bonuses/penalties arrays
    const bonuses: string[] = [];
    const penalties: string[] = [];
    if (streakMultiplier > 1) bonuses.push(`Streak x${streakMultiplier}`);
    if (diminishingFactor < 1)
      penalties.push(
        `Diminishing returns (${Math.round(diminishingFactor * 100)}%)`,
      );
    if (xpCapped) penalties.push('Daily XP cap reached');

    // 12. Professional work -> earn thrones
    let throneGain = 0;
    if (task.category === 'professional_work') {
      throneGain =
        (CONFIG.tasks.professionalThroneGain as Record<number, number>)[
          task.difficulty
        ] ?? 0;
    }

    // 13. Meditation/self-care -> sanity recovery
    let sanityRecovery = 0;
    const categoryConfig = (
      CONFIG.tasks.categoryStats as Record<
        string,
        { specialEffect?: string }
      >
    )[task.category];
    if (categoryConfig?.specialEffect === 'sanityRecovery') {
      if (task.category === 'meditation_discipline') {
        sanityRecovery = CONFIG.sanity.meditationRecovery;
      } else if (task.category === 'self_care') {
        sanityRecovery = CONFIG.sanity.selfCareRecovery;
      }
    }

    // 14. Update task
    await this.taskRepo.update(task.id, {
      currentStreak: newStreak,
      bestStreak,
      totalCompletions: task.totalCompletions + 1,
      lastCompleted: new Date(),
    });

    // 15. Log completion
    await this.taskRepo.logCompletion({
      taskId: task.id,
      characterId,
      completedAt: new Date(),
      xpEarned,
      statGains,
      streakAtCompletion: newStreak,
      bonusesApplied: bonuses,
      gameDay: session.gameDay,
    });

    // 16. Update daily session
    const newCategoryCounts = {
      ...categoryCounts,
      [task.category]: sameCategoryCount,
    };
    await this.taskRepo.upsertDailySession({
      id: session.id,
      characterId,
      date: today,
      totalXPEarned: session.totalXPEarned + xpEarned,
      xpCap,
      tasksCompleted: session.tasksCompleted + 1,
      categoryCounts: newCategoryCounts,
      streaksBroken: session.streaksBroken as string[],
      gameDay: session.gameDay,
    });

    // 17. Update character
    let totalFreeStatPoints = character.freeStatPoints;
    let totalFreeSkillPoints = character.freeSkillPoints;
    let totalFreePerkPoints = character.freePerkPoints;
    for (const reward of levelUpResult.rewards) {
      totalFreeStatPoints += reward.statPoints;
      totalFreeSkillPoints += reward.skillPoints;
      totalFreePerkPoints += reward.perkPoint ? 1 : 0;
    }

    await this.characterRepo.update(characterId, {
      xp: remainingXP,
      xpToNext: newXPToNext,
      level: newLevel,
      primaryStats: newStats,
      freeStatPoints: totalFreeStatPoints,
      freeSkillPoints: totalFreeSkillPoints,
      freePerkPoints: totalFreePerkPoints,
      thrones: character.thrones + throneGain,
      sanity: Math.min(
        character.sanityMax,
        character.sanity + sanityRecovery,
      ),
    });

    // 18. Log event
    await this.eventRepo.logEvent(characterId, {
      eventType: 'task_completed',
      title: 'Task Completed',
      description: `Completed: ${task.name}. Earned ${xpEarned} XP.`,
      data: { taskId: task.id, xpEarned, statGains },
      gameDay: session.gameDay,
    });

    // 19. Return report
    return generateCompletionReport(
      xpEarned,
      statGains,
      newStreak,
      bonuses,
      penalties,
      levelUpResult.levelsGained > 0,
      levelUpResult.levelsGained > 0 ? newLevel : null,
      xpBeforeCap,
      session.totalXPEarned + xpEarned > xpCap,
      streakMultiplier,
      diminishingFactor,
      bestStreak,
    );
  }
}
