import { listSaves, deleteSave, initializeDatabase, getRawDatabase } from '@/infrastructure/database/connection';
import { resetContainer } from '@/infrastructure/di/container';

export interface SaveInfo {
  name: string;
  character?: {
    id: number;
    name: string;
    level: number;
    origin: string;
    background: string;
    difficulty: string;
    lastPlayed: string;
  };
}

export class SaveService {
  async listSaves(): Promise<SaveInfo[]> {
    const saves = listSaves();
    return saves.map(name => {
      const info: SaveInfo = { name };
      try {
        const raw = getRawDatabase(name);
        const row = raw.prepare(
          'SELECT id, name, level, origin, background, difficulty, last_played FROM characters LIMIT 1'
        ).get() as { id: number; name: string; level: number; origin: string; background: string; difficulty: string; last_played: string } | undefined;
        if (row) {
          info.character = {
            id: row.id,
            name: row.name,
            level: row.level,
            origin: row.origin,
            background: row.background,
            difficulty: row.difficulty,
            lastPlayed: row.last_played,
          };
        }
      } catch {
        // DB might be corrupt or empty — skip character info
      }
      return info;
    });
  }

  async createSave(saveName: string): Promise<void> {
    initializeDatabase(saveName);
  }

  async deleteSave(saveName: string): Promise<void> {
    deleteSave(saveName);
    resetContainer();
  }

  async switchSave(saveName: string): Promise<void> {
    resetContainer();
    initializeDatabase(saveName);
  }
}
