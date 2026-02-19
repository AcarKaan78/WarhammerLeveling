import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IPsychicRepository, PsychicPowerRecord } from '@/domain/interfaces';
import { psychicPowers } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLitePsychicRepository implements IPsychicRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async getAll(characterId: number): Promise<PsychicPowerRecord[]> {
    const rows = this.db
      .select()
      .from(psychicPowers)
      .where(eq(psychicPowers.characterId, characterId))
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async getUnlocked(characterId: number): Promise<PsychicPowerRecord[]> {
    const rows = this.db
      .select()
      .from(psychicPowers)
      .where(
        and(
          eq(psychicPowers.characterId, characterId),
          eq(psychicPowers.unlocked, true),
        ),
      )
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async unlock(characterId: number, powerId: string, discipline: string, name: string, tier: number): Promise<void> {
    const existing = this.db
      .select()
      .from(psychicPowers)
      .where(
        and(
          eq(psychicPowers.characterId, characterId),
          eq(psychicPowers.powerId, powerId),
        ),
      )
      .all();

    if (existing.length > 0) {
      this.db
        .update(psychicPowers)
        .set({ unlocked: true })
        .where(
          and(
            eq(psychicPowers.characterId, characterId),
            eq(psychicPowers.powerId, powerId),
          ),
        )
        .run();
    } else {
      this.db
        .insert(psychicPowers)
        .values({
          characterId,
          powerId,
          discipline,
          name,
          tier,
          unlocked: true,
          timesUsed: 0,
        })
        .run();
    }
  }

  async incrementUsage(characterId: number, powerId: string): Promise<void> {
    const rows = this.db
      .select()
      .from(psychicPowers)
      .where(
        and(
          eq(psychicPowers.characterId, characterId),
          eq(psychicPowers.powerId, powerId),
        ),
      )
      .all();

    if (rows.length > 0) {
      this.db
        .update(psychicPowers)
        .set({ timesUsed: rows[0].timesUsed + 1 })
        .where(
          and(
            eq(psychicPowers.characterId, characterId),
            eq(psychicPowers.powerId, powerId),
          ),
        )
        .run();
    }
  }

  async isUnlocked(characterId: number, powerId: string): Promise<boolean> {
    const rows = this.db
      .select()
      .from(psychicPowers)
      .where(
        and(
          eq(psychicPowers.characterId, characterId),
          eq(psychicPowers.powerId, powerId),
          eq(psychicPowers.unlocked, true),
        ),
      )
      .all();

    return rows.length > 0;
  }

  private mapRow(row: typeof psychicPowers.$inferSelect): PsychicPowerRecord {
    return {
      id: row.id,
      characterId: row.characterId,
      powerId: row.powerId,
      discipline: row.discipline,
      name: row.name,
      tier: row.tier,
      unlocked: row.unlocked,
      timesUsed: row.timesUsed,
    };
  }
}
