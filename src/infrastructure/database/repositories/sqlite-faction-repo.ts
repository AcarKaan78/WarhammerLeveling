import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IFactionRepository } from '@/domain/interfaces';
import type { FactionReputation } from '@/domain/models';
import { factions } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteFactionRepository implements IFactionRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async initialize(data: FactionReputation): Promise<FactionReputation> {
    const rows = this.db
      .insert(factions)
      .values({
        id: data.factionId,
        characterId: data.characterId,
        name: data.standing, // Use standing as initial name; can be overridden
        reputation: data.reputation,
        standing: data.standing,
        lastChange: data.lastChange.toISOString(),
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async get(characterId: number, factionId: string): Promise<FactionReputation | null> {
    const rows = this.db
      .select()
      .from(factions)
      .where(and(eq(factions.characterId, characterId), eq(factions.id, factionId)))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getAll(characterId: number): Promise<FactionReputation[]> {
    const rows = this.db
      .select()
      .from(factions)
      .where(eq(factions.characterId, characterId))
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async updateReputation(characterId: number, factionId: string, reputation: number): Promise<void> {
    const now = new Date().toISOString();

    this.db
      .update(factions)
      .set({ reputation, lastChange: now })
      .where(and(eq(factions.characterId, characterId), eq(factions.id, factionId)))
      .run();
  }

  async setStanding(characterId: number, factionId: string, standing: string): Promise<void> {
    this.db
      .update(factions)
      .set({ standing })
      .where(and(eq(factions.characterId, characterId), eq(factions.id, factionId)))
      .run();
  }

  private mapRow(row: typeof factions.$inferSelect): FactionReputation {
    return {
      characterId: row.characterId,
      factionId: row.id,
      reputation: row.reputation,
      standing: row.standing,
      lastChange: row.lastChange ? new Date(row.lastChange) : new Date(),
    };
  }
}
