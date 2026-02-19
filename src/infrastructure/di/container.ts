import { getDatabase, initializeDatabase } from '../database/connection';
import { SQLiteCharacterRepository } from '../database/repositories/sqlite-character-repo';
import { SQLiteTaskRepository } from '../database/repositories/sqlite-task-repo';
import { SQLiteNPCRepository } from '../database/repositories/sqlite-npc-repo';
import { SQLiteInventoryRepository } from '../database/repositories/sqlite-inventory-repo';
import { SQLiteStoryRepository } from '../database/repositories/sqlite-story-repo';
import { SQLiteQuestRepository } from '../database/repositories/sqlite-quest-repo';
import { SQLiteFactionRepository } from '../database/repositories/sqlite-faction-repo';
import { SQLiteEventRepository } from '../database/repositories/sqlite-event-repo';
import { SQLiteAchievementRepository } from '../database/repositories/sqlite-achievement-repo';
import { SQLitePsychicRepository } from '../database/repositories/sqlite-psychic-repo';
import type {
  ICharacterRepository,
  ITaskRepository,
  INPCRepository,
  IInventoryRepository,
  IStoryRepository,
  IQuestRepository,
  IFactionRepository,
  IEventRepository,
  IAchievementRepository,
  IPsychicRepository,
} from '@/domain/interfaces';

export interface Container {
  repos: {
    character: ICharacterRepository;
    task: ITaskRepository;
    npc: INPCRepository;
    inventory: IInventoryRepository;
    story: IStoryRepository;
    quest: IQuestRepository;
    faction: IFactionRepository;
    event: IEventRepository;
    achievement: IAchievementRepository;
    psychic: IPsychicRepository;
  };
}

// Singleton container cache
let containerInstance: Container | null = null;
let currentSaveName: string | null = null;

export function createContainer(saveName: string = 'current'): Container {
  // Return cached if same save
  if (containerInstance && currentSaveName === saveName) {
    return containerInstance;
  }

  // Initialize DB (creates tables if needed)
  const db = initializeDatabase(saveName);

  // Create all repositories
  const repos = {
    character: new SQLiteCharacterRepository(db as never),
    task: new SQLiteTaskRepository(db as never),
    npc: new SQLiteNPCRepository(db as never),
    inventory: new SQLiteInventoryRepository(db as never),
    story: new SQLiteStoryRepository(db as never),
    quest: new SQLiteQuestRepository(db as never),
    faction: new SQLiteFactionRepository(db as never),
    event: new SQLiteEventRepository(db as never),
    achievement: new SQLiteAchievementRepository(db as never),
    psychic: new SQLitePsychicRepository(db as never),
  };

  containerInstance = { repos };
  currentSaveName = saveName;

  return containerInstance;
}

export function resetContainer(): void {
  containerInstance = null;
  currentSaveName = null;
}
