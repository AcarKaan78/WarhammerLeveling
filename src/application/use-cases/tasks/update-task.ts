import { ITaskRepository } from '@/domain/interfaces';
import { Task, TaskCategory, TaskDifficulty, RecurringType } from '@/domain/models';

export interface UpdateTaskInput {
  taskId: number;
  name?: string;
  description?: string;
  category?: TaskCategory;
  difficulty?: TaskDifficulty;
  recurring?: RecurringType;
  customDays?: number[];
  timeEstimateMinutes?: number;
  isActive?: boolean;
}

export class UpdateTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    // 1. Verify the task exists
    const existing = await this.taskRepo.getById(input.taskId);
    if (!existing) {
      throw new Error('Task not found');
    }

    // 2. Build the partial update object from provided fields
    const changes: Partial<Task> = {};

    if (input.name !== undefined) changes.name = input.name;
    if (input.description !== undefined) changes.description = input.description;
    if (input.category !== undefined) changes.category = input.category;
    if (input.difficulty !== undefined) changes.difficulty = input.difficulty;
    if (input.recurring !== undefined) changes.recurring = input.recurring;
    if (input.customDays !== undefined) changes.customDays = input.customDays;
    if (input.timeEstimateMinutes !== undefined)
      changes.timeEstimateMinutes = input.timeEstimateMinutes;
    if (input.isActive !== undefined) changes.isActive = input.isActive;

    // 3. Apply update
    return this.taskRepo.update(input.taskId, changes);
  }
}
