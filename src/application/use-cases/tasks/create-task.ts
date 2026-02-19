import { ITaskRepository } from '@/domain/interfaces';
import { Task, TaskCategory, TaskDifficulty, RecurringType } from '@/domain/models';

export interface CreateTaskInput {
  characterId: number;
  name: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  recurring: RecurringType;
  customDays?: number[];
  timeEstimateMinutes?: number;
}

export class CreateTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    return this.taskRepo.create({
      characterId: input.characterId,
      name: input.name,
      description: input.description ?? '',
      category: input.category,
      difficulty: input.difficulty,
      recurring: input.recurring,
      customDays: input.customDays,
      timeEstimateMinutes: input.timeEstimateMinutes ?? 15,
      isActive: true,
    });
  }
}
