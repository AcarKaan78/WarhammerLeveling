import { ITaskRepository } from '@/domain/interfaces';

export class DeleteTaskUseCase {
  constructor(private taskRepo: ITaskRepository) {}

  /**
   * Soft-deletes a task by marking it inactive via the repository.
   * The task record is preserved for historical streak/completion data
   * but will no longer appear in active task lists.
   */
  async execute(taskId: number): Promise<void> {
    // 1. Verify the task exists
    const existing = await this.taskRepo.getById(taskId);
    if (!existing) {
      throw new Error('Task not found');
    }

    // 2. Perform soft delete
    await this.taskRepo.softDelete(taskId);
  }
}
