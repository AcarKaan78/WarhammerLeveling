import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { ICharacterRepository } from '@/domain/interfaces';
import type {
  Character,
  CharacterCreationData,
  PrimaryStats,
  Appearance,
  Difficulty,
  Gender,
  Origin,
  Background,
  Personality,
} from '@/domain/models';
import { characters } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteCharacterRepository implements ICharacterRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async create(
    data: CharacterCreationData & {
      primaryStats: PrimaryStats;
      hpMax: number;
      sanity: number;
      thrones: number;
      psyRating: number;
    },
  ): Promise<Character> {
    const now = new Date().toISOString();

    const rows = this.db
      .insert(characters)
      .values({
        name: data.name,
        gender: data.gender,
        age: data.age,
        origin: data.origin,
        background: data.background,
        personality1: data.personality1,
        personality2: data.personality2,
        appearance: JSON.stringify(data.appearance),
        primaryStats: JSON.stringify(data.primaryStats),
        hpCurrent: data.hpMax,
        hpMax: data.hpMax,
        sanity: data.sanity,
        thrones: data.thrones,
        psyRating: data.psyRating,
        difficulty: data.difficulty,
        ironman: data.ironman,
        createdAt: now,
        lastPlayed: now,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async get(characterId?: number): Promise<Character | null> {
    let rows;
    if (characterId !== undefined) {
      rows = this.db
        .select()
        .from(characters)
        .where(eq(characters.id, characterId))
        .all();
    } else {
      rows = this.db
        .select()
        .from(characters)
        .limit(1)
        .all();
    }

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async update(id: number, changes: Partial<Character>): Promise<Character> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'id') continue;
      if (key === 'primaryStats' && value !== undefined) {
        updateData.primaryStats = JSON.stringify(value);
      } else if (key === 'appearance' && value !== undefined) {
        updateData.appearance = JSON.stringify(value);
      } else if (key === 'createdAt' && value instanceof Date) {
        updateData.createdAt = value.toISOString();
      } else if (key === 'lastPlayed' && value instanceof Date) {
        updateData.lastPlayed = value.toISOString();
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(characters)
      .set(updateData)
      .where(eq(characters.id, id))
      .run();

    const result = await this.get(id);
    if (!result) throw new Error(`Character with id ${id} not found after update`);
    return result;
  }

  async updateStats(id: number, statChanges: Partial<PrimaryStats>): Promise<void> {
    const rows = this.db
      .select({ primaryStats: characters.primaryStats })
      .from(characters)
      .where(eq(characters.id, id))
      .all();

    if (rows.length === 0) throw new Error(`Character with id ${id} not found`);

    const currentStats: PrimaryStats = JSON.parse(rows[0].primaryStats);
    const updatedStats: PrimaryStats = { ...currentStats, ...statChanges };

    this.db
      .update(characters)
      .set({ primaryStats: JSON.stringify(updatedStats) })
      .where(eq(characters.id, id))
      .run();
  }

  async delete(id: number): Promise<void> {
    this.db.delete(characters).where(eq(characters.id, id)).run();
  }

  async exists(): Promise<boolean> {
    const rows = this.db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .all();

    return rows[0].count > 0;
  }

  private mapRow(row: typeof characters.$inferSelect): Character {
    return {
      id: row.id,
      name: row.name,
      gender: row.gender as Gender,
      age: row.age,
      origin: row.origin as Origin,
      background: row.background as Background,
      personality1: row.personality1 as Personality,
      personality2: row.personality2 as Personality,
      appearance: JSON.parse(row.appearance) as Appearance,
      level: row.level,
      xp: row.xp,
      xpToNext: row.xpToNext,
      freeStatPoints: row.freeStatPoints,
      freeSkillPoints: row.freeSkillPoints,
      freePerkPoints: row.freePerkPoints,
      primaryStats: JSON.parse(row.primaryStats) as PrimaryStats,
      hpCurrent: row.hpCurrent,
      hpMax: row.hpMax,
      sanity: row.sanity,
      sanityMax: row.sanityMax,
      corruption: row.corruption,
      corruptionThreshold: row.corruptionThreshold,
      fatigue: row.fatigue,
      fatigueMax: row.fatigueMax,
      psyRating: row.psyRating,
      carryCapacity: row.carryCapacity,
      influence: row.influence,
      thrones: row.thrones,
      housingLevel: row.housingLevel,
      currentLocation: row.currentLocation,
      systemLevel: row.systemLevel,
      difficulty: row.difficulty as Difficulty,
      ironman: row.ironman,
      createdAt: new Date(row.createdAt),
      lastPlayed: new Date(row.lastPlayed),
    };
  }
}
