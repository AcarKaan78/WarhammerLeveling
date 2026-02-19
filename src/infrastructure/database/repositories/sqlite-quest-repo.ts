import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IQuestRepository } from '@/domain/interfaces';
import type {
  Quest,
  QuestStatus,
  QuestObjective,
  QuestReward,
} from '@/domain/models';
import { quests } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteQuestRepository implements IQuestRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async create(characterId: number, data: Quest): Promise<Quest> {
    const rows = this.db
      .insert(quests)
      .values({
        id: data.id,
        characterId,
        title: data.title,
        description: data.description,
        giver: data.giver,
        factionId: data.factionId,
        status: data.status,
        objectives: JSON.stringify(data.objectives),
        rewards: JSON.stringify(data.rewards),
        failureConsequences: JSON.stringify(data.failureConsequences),
        deadline: data.deadline,
        startDay: data.startDay,
        completedDay: data.completedDay,
        chainNext: data.chainNext,
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async getById(characterId: number, questId: string): Promise<Quest | null> {
    const rows = this.db
      .select()
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.id, questId)))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getAll(characterId: number, status?: QuestStatus): Promise<Quest[]> {
    let rows;
    if (status !== undefined) {
      rows = this.db
        .select()
        .from(quests)
        .where(and(eq(quests.characterId, characterId), eq(quests.status, status)))
        .all();
    } else {
      rows = this.db
        .select()
        .from(quests)
        .where(eq(quests.characterId, characterId))
        .all();
    }

    return rows.map((row) => this.mapRow(row));
  }

  async update(characterId: number, questId: string, changes: Partial<Quest>): Promise<Quest> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'id') continue;
      if (key === 'objectives' && value !== undefined) {
        updateData.objectives = JSON.stringify(value);
      } else if (key === 'rewards' && value !== undefined) {
        updateData.rewards = JSON.stringify(value);
      } else if (key === 'failureConsequences' && value !== undefined) {
        updateData.failureConsequences = JSON.stringify(value);
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(quests)
      .set(updateData)
      .where(and(eq(quests.characterId, characterId), eq(quests.id, questId)))
      .run();

    const result = await this.getById(characterId, questId);
    if (!result) throw new Error(`Quest ${questId} for character ${characterId} not found after update`);
    return result;
  }

  async delete(characterId: number, questId: string): Promise<void> {
    this.db
      .delete(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.id, questId)))
      .run();
  }

  private mapRow(row: typeof quests.$inferSelect): Quest {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      giver: row.giver,
      factionId: row.factionId,
      status: row.status as QuestStatus,
      objectives: JSON.parse(row.objectives) as QuestObjective[],
      rewards: JSON.parse(row.rewards) as QuestReward,
      failureConsequences: JSON.parse(row.failureConsequences) as Record<string, unknown>,
      deadline: row.deadline,
      startDay: row.startDay,
      completedDay: row.completedDay,
      chainNext: row.chainNext,
    };
  }
}
