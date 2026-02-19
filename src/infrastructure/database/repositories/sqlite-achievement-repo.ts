import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IAchievementRepository, AchievementRecord } from '@/domain/interfaces';
import { achievements } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteAchievementRepository implements IAchievementRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async initialize(
    data: Omit<AchievementRecord, 'id' | 'unlocked' | 'unlockedAt'>,
  ): Promise<AchievementRecord> {
    const rows = this.db
      .insert(achievements)
      .values({
        characterId: data.characterId,
        achievementId: data.achievementId,
        name: data.name,
        category: data.category,
        progress: data.progress,
        maxProgress: data.maxProgress,
        unlocked: false,
        unlockedAt: null,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async getAll(characterId: number): Promise<AchievementRecord[]> {
    const rows = this.db
      .select()
      .from(achievements)
      .where(eq(achievements.characterId, characterId))
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async unlock(characterId: number, achievementId: string): Promise<void> {
    const now = new Date().toISOString();

    this.db
      .update(achievements)
      .set({ unlocked: true, unlockedAt: now })
      .where(
        and(
          eq(achievements.characterId, characterId),
          eq(achievements.achievementId, achievementId),
        ),
      )
      .run();
  }

  async updateProgress(characterId: number, achievementId: string, progress: number): Promise<void> {
    this.db
      .update(achievements)
      .set({ progress })
      .where(
        and(
          eq(achievements.characterId, characterId),
          eq(achievements.achievementId, achievementId),
        ),
      )
      .run();
  }

  private mapRow(row: typeof achievements.$inferSelect): AchievementRecord {
    return {
      id: row.id,
      characterId: row.characterId,
      achievementId: row.achievementId,
      name: row.name,
      category: row.category,
      unlocked: row.unlocked,
      progress: row.progress,
      maxProgress: row.maxProgress,
      unlockedAt: row.unlockedAt,
    };
  }
}
