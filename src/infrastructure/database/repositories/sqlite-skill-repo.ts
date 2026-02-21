import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { ISkillRepository } from '@/domain/interfaces';
import type { Skill, SkillCategory } from '@/domain/models';
import { skills } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteSkillRepository implements ISkillRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async getSkill(characterId: number, skillId: string): Promise<Skill | null> {
    const rows = this.db
      .select()
      .from(skills)
      .where(and(eq(skills.characterId, characterId), eq(skills.skillId, skillId)))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getAllSkills(characterId: number): Promise<Skill[]> {
    const rows = this.db
      .select()
      .from(skills)
      .where(eq(skills.characterId, characterId))
      .all();

    return rows.map(row => this.mapRow(row));
  }

  async updateSkill(characterId: number, skillId: string, changes: Partial<Skill>): Promise<Skill> {
    const updateData: Record<string, unknown> = {};
    if (changes.level !== undefined) updateData.level = changes.level;
    if (changes.xp !== undefined) updateData.xp = changes.xp;
    if (changes.xpToNext !== undefined) updateData.xpToNext = changes.xpToNext;

    this.db
      .update(skills)
      .set(updateData)
      .where(and(eq(skills.characterId, characterId), eq(skills.skillId, skillId)))
      .run();

    const result = await this.getSkill(characterId, skillId);
    if (!result) throw new Error(`Skill ${skillId} not found after update`);
    return result;
  }

  async initializeSkill(
    characterId: number,
    skillId: string,
    name: string,
    category: string,
    governingStat1: string,
    governingStat2: string | null,
  ): Promise<Skill> {
    const rows = this.db
      .insert(skills)
      .values({
        characterId,
        skillId,
        name,
        category,
        governingStat1,
        governingStat2,
        level: 0,
        xp: 0,
        xpToNext: 100,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async initializeAll(
    characterId: number,
    skillDefs: Array<{ id: string; name: string; category: string; governingStat1: string; governingStat2: string | null }>,
  ): Promise<void> {
    for (const def of skillDefs) {
      const existing = await this.getSkill(characterId, def.id);
      if (!existing) {
        await this.initializeSkill(characterId, def.id, def.name, def.category, def.governingStat1, def.governingStat2);
      }
    }
  }

  private mapRow(row: typeof skills.$inferSelect): Skill {
    return {
      id: row.skillId,
      name: row.name,
      category: row.category as SkillCategory,
      governingStat1: row.governingStat1,
      governingStat2: row.governingStat2,
      description: '',
      level: row.level,
      xp: row.xp,
      xpToNext: row.xpToNext,
    };
  }
}
