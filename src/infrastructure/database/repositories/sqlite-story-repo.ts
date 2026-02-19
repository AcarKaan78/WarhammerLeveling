import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { IStoryRepository } from '@/domain/interfaces';
import type { StoryState } from '@/domain/models';
import { storyState } from '../schema';

type DbSchema = typeof import('../schema');

export class SQLiteStoryRepository implements IStoryRepository {
  constructor(private db: BetterSQLite3Database<DbSchema>) {}

  async initialize(characterId: number): Promise<StoryState> {
    const rows = this.db
      .insert(storyState)
      .values({
        characterId,
        currentSceneId: null,
        flags: JSON.stringify({}),
        visitedScenes: JSON.stringify([]),
        choiceHistory: JSON.stringify([]),
        variables: JSON.stringify({}),
      })
      .returning()
      .all();

    return this.mapRow(rows[0]);
  }

  async get(characterId: number): Promise<StoryState | null> {
    const rows = this.db
      .select()
      .from(storyState)
      .where(eq(storyState.characterId, characterId))
      .all();

    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async update(characterId: number, changes: Partial<StoryState>): Promise<StoryState> {
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (key === 'characterId') continue;
      if (key === 'flags' && value !== undefined) {
        updateData.flags = JSON.stringify(value);
      } else if (key === 'visitedScenes' && value !== undefined) {
        updateData.visitedScenes = JSON.stringify(value);
      } else if (key === 'choiceHistory' && value !== undefined) {
        updateData.choiceHistory = JSON.stringify(value);
      } else if (key === 'variables' && value !== undefined) {
        updateData.variables = JSON.stringify(value);
      } else {
        updateData[key] = value;
      }
    }

    this.db
      .update(storyState)
      .set(updateData)
      .where(eq(storyState.characterId, characterId))
      .run();

    const result = await this.get(characterId);
    if (!result) throw new Error(`StoryState for character ${characterId} not found after update`);
    return result;
  }

  async setFlag(characterId: number, flag: string, value: boolean): Promise<void> {
    const rows = this.db
      .select({ flags: storyState.flags })
      .from(storyState)
      .where(eq(storyState.characterId, characterId))
      .all();

    if (rows.length === 0) throw new Error(`StoryState for character ${characterId} not found`);

    const flags: Record<string, boolean> = JSON.parse(rows[0].flags);
    flags[flag] = value;

    this.db
      .update(storyState)
      .set({ flags: JSON.stringify(flags) })
      .where(eq(storyState.characterId, characterId))
      .run();
  }

  async addVisitedScene(characterId: number, sceneId: string): Promise<void> {
    const rows = this.db
      .select({ visitedScenes: storyState.visitedScenes })
      .from(storyState)
      .where(eq(storyState.characterId, characterId))
      .all();

    if (rows.length === 0) throw new Error(`StoryState for character ${characterId} not found`);

    const visited: string[] = JSON.parse(rows[0].visitedScenes);
    if (!visited.includes(sceneId)) {
      visited.push(sceneId);
    }

    this.db
      .update(storyState)
      .set({ visitedScenes: JSON.stringify(visited) })
      .where(eq(storyState.characterId, characterId))
      .run();
  }

  async addChoiceHistory(
    characterId: number,
    entry: { sceneId: string; choiceId: string; timestamp: Date },
  ): Promise<void> {
    const rows = this.db
      .select({ choiceHistory: storyState.choiceHistory })
      .from(storyState)
      .where(eq(storyState.characterId, characterId))
      .all();

    if (rows.length === 0) throw new Error(`StoryState for character ${characterId} not found`);

    const history: Array<{ sceneId: string; choiceId: string; timestamp: string }> = JSON.parse(
      rows[0].choiceHistory,
    );
    history.push({
      sceneId: entry.sceneId,
      choiceId: entry.choiceId,
      timestamp: entry.timestamp.toISOString(),
    });

    this.db
      .update(storyState)
      .set({ choiceHistory: JSON.stringify(history) })
      .where(eq(storyState.characterId, characterId))
      .run();
  }

  async setVariable(characterId: number, key: string, value: string | number): Promise<void> {
    const rows = this.db
      .select({ variables: storyState.variables })
      .from(storyState)
      .where(eq(storyState.characterId, characterId))
      .all();

    if (rows.length === 0) throw new Error(`StoryState for character ${characterId} not found`);

    const variables: Record<string, string | number> = JSON.parse(rows[0].variables);
    variables[key] = value;

    this.db
      .update(storyState)
      .set({ variables: JSON.stringify(variables) })
      .where(eq(storyState.characterId, characterId))
      .run();
  }

  private mapRow(row: typeof storyState.$inferSelect): StoryState {
    const rawHistory: Array<{ sceneId: string; choiceId: string; timestamp: string }> = JSON.parse(
      row.choiceHistory,
    );

    return {
      characterId: row.characterId,
      currentSceneId: row.currentSceneId,
      flags: JSON.parse(row.flags) as Record<string, boolean>,
      visitedScenes: JSON.parse(row.visitedScenes) as string[],
      choiceHistory: rawHistory.map((entry) => ({
        sceneId: entry.sceneId,
        choiceId: entry.choiceId,
        timestamp: new Date(entry.timestamp),
      })),
      variables: JSON.parse(row.variables) as Record<string, string | number>,
    };
  }
}
