import { ITaskRepository } from '@/domain/interfaces';
import { Task } from '@/domain/models';
import { isTaskDueToday } from '@/domain/engine/task-engine';

export interface GetTodayTasksOutput {
  dueTasks: Task[];
  completedToday: number[];
  totalDue: number;
  totalCompleted: number;
}

export class GetTodayTasksUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  async execute(characterId: number): Promise<GetTodayTasksOutput> {
    // 1. Get all active tasks for the character
    const allTasks = await this.taskRepo.getAll(characterId, true);

    // 2. Filter by which tasks are due today
    const today = new Date();
    const dueTasks = allTasks.filter((task) =>
      isTaskDueToday(
        {
          recurring: task.recurring,
          customDays: task.customDays,
          createdAt: task.createdAt,
        },
        today,
      ),
    );

    // 3. Get today's completions to determine which are already done
    const todayStr = today.toISOString().split('T')[0];
    const completions = await this.taskRepo.getCompletionsForDate(characterId, todayStr);
    const completedTaskIds = completions.map((c) => c.taskId);

    return {
      dueTasks,
      completedToday: completedTaskIds,
      totalDue: dueTasks.length,
      totalCompleted: completedTaskIds.length,
    };
  }
}
