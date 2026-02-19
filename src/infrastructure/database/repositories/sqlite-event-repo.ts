import { eq, and, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IEventRepository, EventLogEntry } from '@/domain/interfaces';
import type { PendingConsequence, TriggerType, ConsequenceType } from '@/domain/models';
import { eventLog, pendingConsequences } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteEventRepository implements IEventRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async logEvent(
    characterId: number,
    event: {
      eventType: string;
      title: string;
      description: string;
      data: Record<string, unknown>;
      gameDay: number;
    },
  ): Promise<EventLogEntry> {
    const now = new Date().toISOString();

    const rows = this.db
      .insert(eventLog)
      .values({
        characterId,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        data: JSON.stringify(event.data),
        gameDay: event.gameDay,
        createdAt: now,
      })
      .returning()
      .all();

    return this.mapEventRow(rows[0]);
  }

  async getEventLog(characterId: number, limit?: number): Promise<EventLogEntry[]> {
    let query = this.db
      .select()
      .from(eventLog)
      .where(eq(eventLog.characterId, characterId))
      .orderBy(desc(eventLog.id));

    let rows;
    if (limit !== undefined) {
      rows = query.limit(limit).all();
    } else {
      rows = query.all();
    }

    return rows.map((row) => this.mapEventRow(row));
  }

  async createConsequence(
    data: Omit<PendingConsequence, 'id' | 'triggered' | 'triggeredDay'>,
  ): Promise<PendingConsequence> {
    const rows = this.db
      .insert(pendingConsequences)
      .values({
        characterId: data.characterId,
        source: data.source,
        triggerType: data.triggerType,
        triggerValue: String(data.triggerValue),
        consequenceType: data.consequenceType,
        data: JSON.stringify(data.data),
        createdDay: data.createdDay,
        expiresDay: data.expiresDay,
        triggered: false,
        triggeredDay: null,
      })
      .returning()
      .all();

    return this.mapConsequenceRow(rows[0]);
  }

  async getPendingConsequences(characterId: number): Promise<PendingConsequence[]> {
    const rows = this.db
      .select()
      .from(pendingConsequences)
      .where(
        and(
          eq(pendingConsequences.characterId, characterId),
          eq(pendingConsequences.triggered, false),
        ),
      )
      .all();

    return rows.map((row) => this.mapConsequenceRow(row));
  }

  async triggerConsequence(id: number, gameDay: number): Promise<void> {
    this.db
      .update(pendingConsequences)
      .set({ triggered: true, triggeredDay: gameDay })
      .where(eq(pendingConsequences.id, id))
      .run();
  }

  private mapEventRow(row: typeof eventLog.$inferSelect): EventLogEntry {
    return {
      id: row.id,
      characterId: row.characterId,
      eventType: row.eventType,
      title: row.title,
      description: row.description,
      data: JSON.parse(row.data) as Record<string, unknown>,
      gameDay: row.gameDay,
      createdAt: row.createdAt,
    };
  }

  private mapConsequenceRow(row: typeof pendingConsequences.$inferSelect): PendingConsequence {
    return {
      id: row.id,
      characterId: row.characterId,
      source: row.source,
      triggerType: row.triggerType as TriggerType,
      triggerValue: row.triggerValue,
      consequenceType: row.consequenceType as ConsequenceType,
      data: JSON.parse(row.data) as Record<string, unknown>,
      createdDay: row.createdDay,
      expiresDay: row.expiresDay,
      triggered: row.triggered,
      triggeredDay: row.triggeredDay,
    };
  }
}
