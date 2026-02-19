import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const SAVES_DIR = path.join(process.cwd(), 'database', 'saves');

// Singleton cache to avoid multiple connections in dev (hot reload)
const connectionCache = new Map<string, BetterSQLite3Database<typeof schema>>();
const rawDbCache = new Map<string, Database.Database>();

function ensureSavesDir(): void {
  if (!fs.existsSync(SAVES_DIR)) {
    fs.mkdirSync(SAVES_DIR, { recursive: true });
  }
}

export function getDatabase(saveName: string = 'current'): BetterSQLite3Database<typeof schema> {
  if (connectionCache.has(saveName)) {
    return connectionCache.get(saveName)!;
  }

  ensureSavesDir();
  const dbPath = path.join(SAVES_DIR, `${saveName}.db`);
  const sqlite = new Database(dbPath);

  // Performance and safety settings
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite, { schema });

  rawDbCache.set(saveName, sqlite);
  connectionCache.set(saveName, db);

  return db;
}

export function getRawDatabase(saveName: string = 'current'): Database.Database {
  if (!rawDbCache.has(saveName)) {
    getDatabase(saveName); // This will populate both caches
  }
  return rawDbCache.get(saveName)!;
}

export function initializeDatabase(saveName: string = 'current'): BetterSQLite3Database<typeof schema> {
  const db = getDatabase(saveName);
  const raw = getRawDatabase(saveName);

  // Create all tables using raw SQL from the schema
  // Drizzle push is used in development; for runtime, we create tables directly
  raw.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      origin TEXT NOT NULL,
      background TEXT NOT NULL,
      personality1 TEXT NOT NULL,
      personality2 TEXT NOT NULL,
      appearance TEXT NOT NULL DEFAULT '{}',
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      xp_to_next INTEGER NOT NULL DEFAULT 100,
      free_stat_points INTEGER NOT NULL DEFAULT 0,
      free_skill_points INTEGER NOT NULL DEFAULT 0,
      free_perk_points INTEGER NOT NULL DEFAULT 0,
      primary_stats TEXT NOT NULL DEFAULT '{}',
      hp_current INTEGER NOT NULL DEFAULT 10,
      hp_max INTEGER NOT NULL DEFAULT 10,
      sanity INTEGER NOT NULL DEFAULT 80,
      sanity_max INTEGER NOT NULL DEFAULT 100,
      corruption INTEGER NOT NULL DEFAULT 0,
      corruption_threshold INTEGER NOT NULL DEFAULT 100,
      fatigue INTEGER NOT NULL DEFAULT 0,
      fatigue_max INTEGER NOT NULL DEFAULT 100,
      psy_rating INTEGER NOT NULL DEFAULT 0,
      carry_capacity REAL NOT NULL DEFAULT 30,
      influence INTEGER NOT NULL DEFAULT 0,
      thrones INTEGER NOT NULL DEFAULT 50,
      housing_level INTEGER NOT NULL DEFAULT 1,
      current_location TEXT NOT NULL DEFAULT 'hab_block',
      system_level INTEGER NOT NULL DEFAULT 1,
      difficulty TEXT NOT NULL DEFAULT 'standard',
      ironman INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_played TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 2,
      recurring TEXT NOT NULL DEFAULT 'daily',
      custom_days TEXT DEFAULT NULL,
      time_estimate_minutes INTEGER NOT NULL DEFAULT 15,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      total_completions INTEGER NOT NULL DEFAULT 0,
      last_completed TEXT DEFAULT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      character_id INTEGER NOT NULL REFERENCES characters(id),
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      xp_earned INTEGER NOT NULL DEFAULT 0,
      stat_gains TEXT NOT NULL DEFAULT '{}',
      streak_at_completion INTEGER NOT NULL DEFAULT 0,
      bonuses_applied TEXT NOT NULL DEFAULT '[]',
      game_day INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS daily_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      date TEXT NOT NULL,
      total_xp_earned INTEGER NOT NULL DEFAULT 0,
      xp_cap INTEGER NOT NULL DEFAULT 100,
      tasks_completed INTEGER NOT NULL DEFAULT 0,
      category_counts TEXT NOT NULL DEFAULT '{}',
      streaks_broken TEXT NOT NULL DEFAULT '[]',
      game_day INTEGER NOT NULL DEFAULT 1,
      UNIQUE(character_id, date)
    );

    CREATE TABLE IF NOT EXISTS npcs (
      id TEXT PRIMARY KEY,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      personality TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      faction_id TEXT DEFAULT NULL,
      relationship TEXT NOT NULL DEFAULT '{"affinity":0,"respect":0,"fear":0,"knowledge":0,"loyalty":0}',
      romance_eligible INTEGER NOT NULL DEFAULT 0,
      romance_stage INTEGER NOT NULL DEFAULT 0,
      secrets TEXT NOT NULL DEFAULT '[]',
      breaking_points TEXT NOT NULL DEFAULT '[]',
      companion_data TEXT DEFAULT NULL,
      is_alive INTEGER NOT NULL DEFAULT 1,
      last_interaction TEXT DEFAULT NULL,
      dialogue_tree_id TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      instance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      item_id TEXT NOT NULL,
      item_data TEXT NOT NULL DEFAULT '{}',
      quantity INTEGER NOT NULL DEFAULT 1,
      condition INTEGER NOT NULL DEFAULT 100,
      condition_max INTEGER NOT NULL DEFAULT 100,
      equipped INTEGER NOT NULL DEFAULT 0,
      slot TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS story_state (
      character_id INTEGER PRIMARY KEY REFERENCES characters(id),
      current_scene_id TEXT DEFAULT NULL,
      flags TEXT NOT NULL DEFAULT '{}',
      visited_scenes TEXT NOT NULL DEFAULT '[]',
      choice_history TEXT NOT NULL DEFAULT '[]',
      variables TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT NOT NULL,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      giver TEXT DEFAULT NULL,
      faction_id TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      objectives TEXT NOT NULL DEFAULT '[]',
      rewards TEXT NOT NULL DEFAULT '{}',
      failure_consequences TEXT NOT NULL DEFAULT '{}',
      deadline INTEGER DEFAULT NULL,
      start_day INTEGER NOT NULL DEFAULT 1,
      completed_day INTEGER DEFAULT NULL,
      chain_next TEXT DEFAULT NULL,
      PRIMARY KEY (id, character_id)
    );

    CREATE TABLE IF NOT EXISTS factions (
      id TEXT NOT NULL,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      reputation INTEGER NOT NULL DEFAULT 0,
      standing TEXT NOT NULL DEFAULT 'neutral',
      last_change TEXT DEFAULT NULL,
      PRIMARY KEY (id, character_id)
    );

    CREATE TABLE IF NOT EXISTS traits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      trait_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'innate',
      effects TEXT NOT NULL DEFAULT '{}',
      source TEXT NOT NULL DEFAULT '',
      UNIQUE(character_id, trait_id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      skill_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      governing_stat1 TEXT NOT NULL,
      governing_stat2 TEXT DEFAULT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      xp_to_next INTEGER NOT NULL DEFAULT 100,
      UNIQUE(character_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS psychic_powers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      power_id TEXT NOT NULL,
      discipline TEXT NOT NULL,
      name TEXT NOT NULL,
      tier INTEGER NOT NULL DEFAULT 1,
      unlocked INTEGER NOT NULL DEFAULT 0,
      times_used INTEGER NOT NULL DEFAULT 0,
      UNIQUE(character_id, power_id)
    );

    CREATE TABLE IF NOT EXISTS mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      mutation_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      effects TEXT NOT NULL DEFAULT '{}',
      acquired_day INTEGER NOT NULL DEFAULT 1,
      UNIQUE(character_id, mutation_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      achievement_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unlocked INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      max_progress INTEGER NOT NULL DEFAULT 1,
      unlocked_at TEXT DEFAULT NULL,
      UNIQUE(character_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS decorations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      decoration_id TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      name TEXT NOT NULL,
      effects TEXT NOT NULL DEFAULT '{}',
      UNIQUE(character_id, slot_id)
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      game_day INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_consequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      source TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_value TEXT NOT NULL,
      consequence_type TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_day INTEGER NOT NULL,
      expires_day INTEGER DEFAULT NULL,
      triggered INTEGER NOT NULL DEFAULT 0,
      triggered_day INTEGER DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar (
      character_id INTEGER PRIMARY KEY REFERENCES characters(id),
      game_day INTEGER NOT NULL DEFAULT 1,
      real_start_date TEXT NOT NULL DEFAULT (datetime('now')),
      last_daily_process TEXT NOT NULL DEFAULT (datetime('now')),
      last_weekly_process TEXT DEFAULT NULL,
      last_upkeep_day INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS combat_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      combat_state TEXT NOT NULL DEFAULT '{}',
      result TEXT DEFAULT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT DEFAULT NULL,
      game_day INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Seed meta table
  raw.exec(`
    INSERT OR IGNORE INTO meta (key, value) VALUES ('version', '1.0.0');
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
  `);

  return db;
}

export function listSaves(): string[] {
  ensureSavesDir();
  return fs.readdirSync(SAVES_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => f.replace('.db', ''));
}

export function deleteSave(saveName: string): void {
  const dbPath = path.join(SAVES_DIR, `${saveName}.db`);
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;

  // Close connection if cached
  if (rawDbCache.has(saveName)) {
    rawDbCache.get(saveName)!.close();
    rawDbCache.delete(saveName);
    connectionCache.delete(saveName);
  }

  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

export function closeAll(): void {
  for (const [name, db] of rawDbCache) {
    db.close();
  }
  rawDbCache.clear();
  connectionCache.clear();
}
