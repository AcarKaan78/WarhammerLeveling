import { ICharacterRepository, ITaskRepository, IEventRepository } from '@/domain/interfaces';

export interface EndDayOutput {
  gameDay: number;
  tasksCompleted: number;
  totalXPEarned: number;
  xpCap: number;
}

export class EndDayUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private taskRepo: ITaskRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number): Promise<EndDayOutput> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const today = new Date().toISOString().split('T')[0];
    const session = await this.taskRepo.getDailySession(characterId, today);

    const result: EndDayOutput = {
      gameDay: session?.gameDay ?? 1,
      tasksCompleted: session?.tasksCompleted ?? 0,
      totalXPEarned: session?.totalXPEarned ?? 0,
      xpCap: session?.xpCap ?? 0,
    };

    // Update last played timestamp
    await this.characterRepo.update(characterId, { lastPlayed: new Date() });

    await this.eventRepo.logEvent(characterId, {
      eventType: 'day_ended',
      title: 'Day Ended',
      description: `Day complete. Tasks: ${result.tasksCompleted}, XP: ${result.totalXPEarned}/${result.xpCap}.`,
      data: { ...result },
      gameDay: result.gameDay,
    });

    return result;
  }
}
