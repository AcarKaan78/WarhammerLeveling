import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { INPCRepository } from '@/domain/interfaces';
import type {
  NPC,
  NPCRole,
  NPCPersonality,
  RomanceStage,
  RelationshipDimensions,
  NPCSecret,
  BreakingPoint,
  CompanionData,
} from '@/domain/models';
import { npcs } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteNPCRepository implements INPCRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async create(characterId: number, data: Omit<NPC, 'lastInteraction'>): Promise<NPC> {
    const rows = this.db
      .insert(npcs)
      .values({
        id: data.id,
        characterId,
        name: data.name,
        title: data.title,
        role: data.role,
        personality: data.personality,
        description: data.description,
        location: data.location,
        factionId: data.factionId,
        relationship: JSON.stringify(data.relationship),
        romanceEligible: data.romanceEligible,
        romanceStage: data.romanceStage,
        secrets: JSON.stringify(data.secrets),
        breakingPoints: JSON.stringify(data.breakingPoints),
        companionData: data.companion ? JSON.stringify(data.companion) : null,
        isAlive: data.isAlive,
        lastInteraction: null,
        dialogueTreeId: data.dialogueTreeId,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async getById(id: string): Promise<NPC | null> {
    const rows = this.db
      .select()
      .from(npcs)
      .where(eq(npcs.id, id))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getAll(characterId: number): Promise<NPC[]> {
    const rows = this.db
      .select()
      .from(npcs)
      .where(eq(npcs.characterId, characterId))
      .all();

    return rows.map((row) => this.mapRow(row));
  }

  async update(id: string, changes: Partial<NPC>): Promise<NPC> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'id') continue;
      if (key === 'relationship' && value !== undefined) {
        updateData.relationship = JSON.stringify(value);
      } else if (key === 'secrets' && value !== undefined) {
        updateData.secrets = JSON.stringify(value);
      } else if (key === 'breakingPoints' && value !== undefined) {
        updateData.breakingPoints = JSON.stringify(value);
      } else if (key === 'companion' && value !== undefined) {
        updateData.companionData = value ? JSON.stringify(value) : null;
      } else if (key === 'lastInteraction') {
        updateData.lastInteraction = value instanceof Date ? value.toISOString() : value;
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(npcs)
      .set(updateData)
      .where(eq(npcs.id, id))
      .run();

    const result = await this.getById(id);
    if (!result) throw new Error(`NPC with id ${id} not found after update`);
    return result;
  }

  async delete(id: string): Promise<void> {
    this.db.delete(npcs).where(eq(npcs.id, id)).run();
  }

  async updateRelationship(id: string, changes: Partial<RelationshipDimensions>): Promise<void> {
    const rows = this.db
      .select({ relationship: npcs.relationship })
      .from(npcs)
      .where(eq(npcs.id, id))
      .all();

    if (rows.length === 0) return; // NPC not found, skip silently

    const current: RelationshipDimensions = JSON.parse(rows[0].relationship);
    // ADD to existing values instead of overwriting
    const updated: RelationshipDimensions = { ...current };
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        (updated as unknown as Record<string, number>)[key] =
          ((current as unknown as Record<string, number>)[key] ?? 0) + value;
      }
    }

    this.db
      .update(npcs)
      .set({ relationship: JSON.stringify(updated) })
      .where(eq(npcs.id, id))
      .run();
  }

  private mapRow(row: typeof npcs.$inferSelect): NPC {
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      role: row.role as NPCRole,
      personality: row.personality as NPCPersonality,
      description: row.description,
      location: row.location,
      factionId: row.factionId,
      relationship: JSON.parse(row.relationship) as RelationshipDimensions,
      romanceEligible: row.romanceEligible,
      romanceStage: row.romanceStage as RomanceStage,
      secrets: JSON.parse(row.secrets) as NPCSecret[],
      breakingPoints: JSON.parse(row.breakingPoints) as BreakingPoint[],
      companion: row.companionData ? (JSON.parse(row.companionData) as CompanionData) : null,
      isAlive: row.isAlive,
      lastInteraction: row.lastInteraction ? new Date(row.lastInteraction) : null,
      dialogueTreeId: row.dialogueTreeId,
    };
  }
}
