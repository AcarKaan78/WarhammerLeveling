import { ICharacterRepository, ITaskRepository, IEventRepository } from '@/domain/interfaces';
import { getSanityState } from '@/domain/engine/sanity-engine';
import { getCorruptionState } from '@/domain/engine/corruption-engine';
import { getDailyXPCap } from '@/domain/engine/task-engine';
import { getGameDay } from '@/domain/engine/calendar-engine';

export interface BriefingData {
  gameDay: number;
  characterSummary: {
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    hpMax: number;
    sanity: number;
    sanityState: string;
    corruption: number;
    corruptionState: string;
    thrones: number;
  };
  taskSummary: {
    totalTasks: number;
    completedToday: number;
    xpEarned: number;
    xpCap: number;
    activeStreaks: number;
  };
  recentEvents: Array<{ title: string; description: string }>;
  warnings: string[];
}

export class GetDailyBriefingUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private taskRepo: ITaskRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number): Promise<BriefingData> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const gameDay = getGameDay(character.createdAt, new Date());
    const today = new Date().toISOString().split('T')[0];
    const session = await this.taskRepo.getDailySession(characterId, today);
    const tasks = await this.taskRepo.getAll(characterId, true);
    const recentLog = await this.eventRepo.getEventLog(characterId, 5);

    const activeStreaks = tasks.filter(t => t.currentStreak > 0).length;
    const xpCap = getDailyXPCap(character.level);

    const warnings: string[] = [];
    if (character.sanity < 40) warnings.push('Sanity is critically low!');
    if (character.corruption > 60) warnings.push('Corruption is dangerously high!');
    if (character.hpCurrent < character.hpMax * 0.25) warnings.push('Health is critical!');
    if (character.thrones < 10) warnings.push('Running low on Thrones.');

    return {
      gameDay,
      characterSummary: {
        name: character.name,
        level: character.level,
        xp: character.xp,
        xpToNext: character.xpToNext,
        hp: character.hpCurrent,
        hpMax: character.hpMax,
        sanity: character.sanity,
        sanityState: getSanityState(character.sanity),
        corruption: character.corruption,
        corruptionState: getCorruptionState(character.corruption),
        thrones: character.thrones,
      },
      taskSummary: {
        totalTasks: tasks.length,
        completedToday: session?.tasksCompleted ?? 0,
        xpEarned: session?.totalXPEarned ?? 0,
        xpCap,
        activeStreaks,
      },
      recentEvents: recentLog.map(e => ({ title: e.title, description: e.description })),
      warnings,
    };
  }
}
