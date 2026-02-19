import { ITaskRepository, ICharacterRepository } from '@/domain/interfaces';
import { DailySession } from '@/domain/models';
import { getDailyXPCap } from '@/domain/engine/task-engine';

export interface DailySummaryOutput {
  session: DailySession | null;
  characterLevel: number;
  characterXP: number;
  characterXPToNext: number;
  xpCap: number;
  xpRemaining: number;
  tasksCompleted: number;
  categoryCounts: Record<string, number>;
  streaksBroken: string[];
}

export class GetDailySummaryUseCase {
  constructor(
    private taskRepo: ITaskRepository,
    private characterRepo: ICharacterRepository,
  ) {}

  async execute(characterId: number): Promise<DailySummaryOutput> {
    // 1. Load the character for XP progress information
    const character = await this.characterRepo.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // 2. Get today's daily session
    const today = new Date().toISOString().split('T')[0];
    const session = await this.taskRepo.getDailySession(characterId, today);

    // 3. Calculate XP cap and remaining allowance
    const xpCap = getDailyXPCap(character.level);
    const totalXPEarned = session?.totalXPEarned ?? 0;
    const xpRemaining = Math.max(0, xpCap - totalXPEarned);

    return {
      session,
      characterLevel: character.level,
      characterXP: character.xp,
      characterXPToNext: character.xpToNext,
      xpCap,
      xpRemaining,
      tasksCompleted: session?.tasksCompleted ?? 0,
      categoryCounts: (session?.categoryCounts as Record<string, number>) ?? {},
      streaksBroken: (session?.streaksBroken as string[]) ?? [],
    };
  }
}
