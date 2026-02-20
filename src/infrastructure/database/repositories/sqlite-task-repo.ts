import { eq, and, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { ITaskRepository } from '@/domain/interfaces';
import type {
  Task,
  TaskCompletion,
  DailySession,
  TaskCategory,
  TaskDifficulty,
  RecurringType,
} from '@/domain/models';
import { tasks, taskCompletions, dailySessions } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteTaskRepository implements ITaskRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async create(
    data: Omit<Task, 'id' | 'currentStreak' | 'bestStreak' | 'totalCompletions' | 'lastCompleted' | 'createdAt'>,
  ): Promise<Task> {
    const now = new Date().toISOString();

    const rows = this.db
      .insert(tasks)
      .values({
        characterId: data.characterId,
        name: data.name,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        recurring: data.recurring,
        customDays: data.customDays ? JSON.stringify(data.customDays) : null,
        timeEstimateMinutes: data.timeEstimateMinutes,
        isActive: data.isActive,
        createdAt: now,
      })
      .returning()
      .all();

    return this.mapTaskRow(rows[0]);
  }

  async getAll(characterId: number, activeOnly?: boolean): Promise<Task[]> {
    let rows;
    if (activeOnly !== undefined) {
      rows = this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.characterId, characterId), eq(tasks.isActive, activeOnly)))
        .all();
    } else {
      rows = this.db
        .select()
        .from(tasks)
        .where(eq(tasks.characterId, characterId))
        .all();
    }

    return rows.map((row) => this.mapTaskRow(row));
  }

  async getById(id: number): Promise<Task | null> {
    const rows = this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .all();

    if (rows.length === 0) return null;
    return this.mapTaskRow(rows[0]);
  }

  async update(id: number, changes: Partial<Task>): Promise<Task> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'id') continue;
      if (key === 'customDays' && value !== undefined) {
        updateData.customDays = value ? JSON.stringify(value) : null;
      } else if (key === 'lastCompleted') {
        updateData.lastCompleted = value instanceof Date ? value.toISOString() : value;
      } else if (key === 'createdAt') {
        updateData.createdAt = value instanceof Date ? value.toISOString() : value;
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .run();

    const result = await this.getById(id);
    if (!result) throw new Error(`Task with id ${id} not found after update`);
    return result;
  }

  async softDelete(id: number): Promise<void> {
    this.db
      .update(tasks)
      .set({ isActive: false })
      .where(eq(tasks.id, id))
      .run();
  }

  async logCompletion(data: Omit<TaskCompletion, 'id'>): Promise<TaskCompletion> {
    const rows = this.db
      .insert(taskCompletions)
      .values({
        taskId: data.taskId,
        characterId: data.characterId,
        completedAt: data.completedAt instanceof Date ? data.completedAt.toISOString() : data.completedAt as string,
        xpEarned: data.xpEarned,
        statGains: JSON.stringify(data.statGains),
        streakAtCompletion: data.streakAtCompletion,
        bonusesApplied: JSON.stringify(data.bonusesApplied),
        gameDay: data.gameDay,
      })
      .returning()
      .all();

    return this.mapCompletionRow(rows[0]);
  }

  async getCompletionsForDate(characterId: number, date: string): Promise<TaskCompletion[]> {
    // Compare the date portion of completedAt (first 10 chars of ISO string)
    const rows = this.db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.characterId, characterId),
          sql`substr(${taskCompletions.completedAt}, 1, 10) = ${date}`,
        ),
      )
      .all();

    return rows.map((row) => this.mapCompletionRow(row));
  }

  async getDailySession(characterId: number, date: string): Promise<DailySession | null> {
    const rows = this.db
      .select()
      .from(dailySessions)
      .where(
        and(
          eq(dailySessions.characterId, characterId),
          eq(dailySessions.date, date),
        ),
      )
      .all();

    if (rows.length === 0) return null;
    return this.mapDailySessionRow(rows[0]);
  }

  async getDailySessionsForRange(characterId: number, startDate: string, endDate: string): Promise<DailySession[]> {
    const rows = this.db
      .select()
      .from(dailySessions)
      .where(
        and(
          eq(dailySessions.characterId, characterId),
          sql`${dailySessions.date} >= ${startDate}`,
          sql`${dailySessions.date} <= ${endDate}`,
        ),
      )
      .all();

    return rows.map((row) => this.mapDailySessionRow(row));
  }

  async upsertDailySession(data: DailySession): Promise<DailySession> {
    // Check if session exists
    const existing = await this.getDailySession(data.characterId, data.date);

    if (existing) {
      this.db
        .update(dailySessions)
        .set({
          totalXPEarned: data.totalXPEarned,
          xpCap: data.xpCap,
          tasksCompleted: data.tasksCompleted,
          categoryCounts: JSON.stringify(data.categoryCounts),
          streaksBroken: JSON.stringify(data.streaksBroken),
          gameDay: data.gameDay,
        })
        .where(
          and(
            eq(dailySessions.characterId, data.characterId),
            eq(dailySessions.date, data.date),
          ),
        )
        .run();

      const updated = await this.getDailySession(data.characterId, data.date);
      return updated!;
    } else {
      const rows = this.db
        .insert(dailySessions)
        .values({
          characterId: data.characterId,
          date: data.date,
          totalXPEarned: data.totalXPEarned,
          xpCap: data.xpCap,
          tasksCompleted: data.tasksCompleted,
          categoryCounts: JSON.stringify(data.categoryCounts),
          streaksBroken: JSON.stringify(data.streaksBroken),
          gameDay: data.gameDay,
        })
        .returning()
        .all();

      return this.mapDailySessionRow(rows[0]);
    }
  }

  private mapTaskRow(row: typeof tasks.$inferSelect): Task {
    return {
      id: row.id,
      characterId: row.characterId,
      name: row.name,
      description: row.description,
      category: row.category as TaskCategory,
      difficulty: row.difficulty as TaskDifficulty,
      recurring: row.recurring as RecurringType,
      customDays: row.customDays ? JSON.parse(row.customDays) : undefined,
      timeEstimateMinutes: row.timeEstimateMinutes,
      currentStreak: row.currentStreak,
      bestStreak: row.bestStreak,
      totalCompletions: row.totalCompletions,
      lastCompleted: row.lastCompleted ? new Date(row.lastCompleted) : null,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    };
  }

  private mapCompletionRow(row: typeof taskCompletions.$inferSelect): TaskCompletion {
    return {
      id: row.id,
      taskId: row.taskId,
      characterId: row.characterId,
      completedAt: new Date(row.completedAt),
      xpEarned: row.xpEarned,
      statGains: JSON.parse(row.statGains) as Record<string, number>,
      streakAtCompletion: row.streakAtCompletion,
      bonusesApplied: JSON.parse(row.bonusesApplied) as string[],
      gameDay: row.gameDay,
    };
  }

  private mapDailySessionRow(row: typeof dailySessions.$inferSelect): DailySession {
    return {
      id: row.id,
      characterId: row.characterId,
      date: row.date,
      totalXPEarned: row.totalXPEarned,
      xpCap: row.xpCap,
      tasksCompleted: row.tasksCompleted,
      categoryCounts: JSON.parse(row.categoryCounts) as Record<string, number>,
      streaksBroken: JSON.parse(row.streaksBroken) as string[],
      gameDay: row.gameDay,
    };
  }
}
