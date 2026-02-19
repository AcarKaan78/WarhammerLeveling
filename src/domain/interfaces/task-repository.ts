import { Task, TaskCompletion, DailySession } from '@/domain/models';

export interface ITaskRepository {
  create(data: Omit<Task, 'id' | 'currentStreak' | 'bestStreak' | 'totalCompletions' | 'lastCompleted' | 'createdAt'>): Promise<Task>;
  getAll(characterId: number, activeOnly?: boolean): Promise<Task[]>;
  getById(id: number): Promise<Task | null>;
  update(id: number, changes: Partial<Task>): Promise<Task>;
  softDelete(id: number): Promise<void>;
  logCompletion(data: Omit<TaskCompletion, 'id'>): Promise<TaskCompletion>;
  getCompletionsForDate(characterId: number, date: string): Promise<TaskCompletion[]>;
  getDailySession(characterId: number, date: string): Promise<DailySession | null>;
  upsertDailySession(data: DailySession): Promise<DailySession>;
}
