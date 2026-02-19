import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gender: text('gender').notNull(),
  age: integer('age').notNull(),
  origin: text('origin').notNull(),
  background: text('background').notNull(),
  personality1: text('personality1').notNull(),
  personality2: text('personality2').notNull(),
  appearance: text('appearance').notNull().default('{}'),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  xpToNext: integer('xp_to_next').notNull().default(100),
  freeStatPoints: integer('free_stat_points').notNull().default(0),
  freeSkillPoints: integer('free_skill_points').notNull().default(0),
  freePerkPoints: integer('free_perk_points').notNull().default(0),
  primaryStats: text('primary_stats').notNull().default('{}'),
  hpCurrent: integer('hp_current').notNull().default(10),
  hpMax: integer('hp_max').notNull().default(10),
  sanity: integer('sanity').notNull().default(80),
  sanityMax: integer('sanity_max').notNull().default(100),
  corruption: integer('corruption').notNull().default(0),
  corruptionThreshold: integer('corruption_threshold').notNull().default(100),
  fatigue: integer('fatigue').notNull().default(0),
  fatigueMax: integer('fatigue_max').notNull().default(100),
  psyRating: integer('psy_rating').notNull().default(0),
  carryCapacity: real('carry_capacity').notNull().default(30),
  influence: integer('influence').notNull().default(0),
  thrones: integer('thrones').notNull().default(50),
  housingLevel: integer('housing_level').notNull().default(1),
  currentLocation: text('current_location').notNull().default('hab_block'),
  systemLevel: integer('system_level').notNull().default(1),
  difficulty: text('difficulty').notNull().default('standard'),
  ironman: integer('ironman', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(''),
  lastPlayed: text('last_played').notNull().default(''),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull(),
  difficulty: integer('difficulty').notNull().default(2),
  recurring: text('recurring').notNull().default('daily'),
  customDays: text('custom_days'),
  timeEstimateMinutes: integer('time_estimate_minutes').notNull().default(15),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  totalCompletions: integer('total_completions').notNull().default(0),
  lastCompleted: text('last_completed'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(''),
});

export const taskCompletions = sqliteTable('task_completions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  characterId: integer('character_id').notNull().references(() => characters.id),
  completedAt: text('completed_at').notNull().default(''),
  xpEarned: integer('xp_earned').notNull().default(0),
  statGains: text('stat_gains').notNull().default('{}'),
  streakAtCompletion: integer('streak_at_completion').notNull().default(0),
  bonusesApplied: text('bonuses_applied').notNull().default('[]'),
  gameDay: integer('game_day').notNull().default(1),
});

export const dailySessions = sqliteTable('daily_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  date: text('date').notNull(),
  totalXPEarned: integer('total_xp_earned').notNull().default(0),
  xpCap: integer('xp_cap').notNull().default(100),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  categoryCounts: text('category_counts').notNull().default('{}'),
  streaksBroken: text('streaks_broken').notNull().default('[]'),
  gameDay: integer('game_day').notNull().default(1),
});

export const npcs = sqliteTable('npcs', {
  id: text('id').primaryKey(),
  characterId: integer('character_id').notNull().references(() => characters.id),
  name: text('name').notNull(),
  title: text('title').notNull().default(''),
  role: text('role').notNull(),
  personality: text('personality').notNull(),
  description: text('description').notNull().default(''),
  location: text('location').notNull().default(''),
  factionId: text('faction_id'),
  relationship: text('relationship').notNull().default('{"affinity":0,"respect":0,"fear":0,"knowledge":0,"loyalty":0}'),
  romanceEligible: integer('romance_eligible', { mode: 'boolean' }).notNull().default(false),
  romanceStage: integer('romance_stage').notNull().default(0),
  secrets: text('secrets').notNull().default('[]'),
  breakingPoints: text('breaking_points').notNull().default('[]'),
  companionData: text('companion_data'),
  isAlive: integer('is_alive', { mode: 'boolean' }).notNull().default(true),
  lastInteraction: text('last_interaction'),
  dialogueTreeId: text('dialogue_tree_id'),
});

export const inventory = sqliteTable('inventory', {
  instanceId: integer('instance_id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  itemId: text('item_id').notNull(),
  itemData: text('item_data').notNull().default('{}'),
  quantity: integer('quantity').notNull().default(1),
  condition: integer('condition').notNull().default(100),
  conditionMax: integer('condition_max').notNull().default(100),
  equipped: integer('equipped', { mode: 'boolean' }).notNull().default(false),
  slot: text('slot'),
});

export const storyState = sqliteTable('story_state', {
  characterId: integer('character_id').primaryKey().references(() => characters.id),
  currentSceneId: text('current_scene_id'),
  flags: text('flags').notNull().default('{}'),
  visitedScenes: text('visited_scenes').notNull().default('[]'),
  choiceHistory: text('choice_history').notNull().default('[]'),
  variables: text('variables').notNull().default('{}'),
});

export const quests = sqliteTable('quests', {
  id: text('id').notNull(),
  characterId: integer('character_id').notNull().references(() => characters.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  giver: text('giver'),
  factionId: text('faction_id'),
  status: text('status').notNull().default('available'),
  objectives: text('objectives').notNull().default('[]'),
  rewards: text('rewards').notNull().default('{}'),
  failureConsequences: text('failure_consequences').notNull().default('{}'),
  deadline: integer('deadline'),
  startDay: integer('start_day').notNull().default(1),
  completedDay: integer('completed_day'),
  chainNext: text('chain_next'),
});

export const factions = sqliteTable('factions', {
  id: text('id').notNull(),
  characterId: integer('character_id').notNull().references(() => characters.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  reputation: integer('reputation').notNull().default(0),
  standing: text('standing').notNull().default('neutral'),
  lastChange: text('last_change'),
});

export const traits = sqliteTable('traits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  traitId: text('trait_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('innate'),
  effects: text('effects').notNull().default('{}'),
  source: text('source').notNull().default(''),
});

export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  skillId: text('skill_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  governingStat1: text('governing_stat1').notNull(),
  governingStat2: text('governing_stat2'),
  level: integer('level').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  xpToNext: integer('xp_to_next').notNull().default(100),
});

export const psychicPowers = sqliteTable('psychic_powers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  powerId: text('power_id').notNull(),
  discipline: text('discipline').notNull(),
  name: text('name').notNull(),
  tier: integer('tier').notNull().default(1),
  unlocked: integer('unlocked', { mode: 'boolean' }).notNull().default(false),
  timesUsed: integer('times_used').notNull().default(0),
});

export const mutations = sqliteTable('mutations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  mutationId: text('mutation_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  effects: text('effects').notNull().default('{}'),
  acquiredDay: integer('acquired_day').notNull().default(1),
});

export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  achievementId: text('achievement_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  unlocked: integer('unlocked', { mode: 'boolean' }).notNull().default(false),
  progress: integer('progress').notNull().default(0),
  maxProgress: integer('max_progress').notNull().default(1),
  unlockedAt: text('unlocked_at'),
});

export const decorations = sqliteTable('decorations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  decorationId: text('decoration_id').notNull(),
  slotId: text('slot_id').notNull(),
  name: text('name').notNull(),
  effects: text('effects').notNull().default('{}'),
});

export const eventLog = sqliteTable('event_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  data: text('data').notNull().default('{}'),
  gameDay: integer('game_day').notNull(),
  createdAt: text('created_at').notNull().default(''),
});

export const pendingConsequences = sqliteTable('pending_consequences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  source: text('source').notNull(),
  triggerType: text('trigger_type').notNull(),
  triggerValue: text('trigger_value').notNull(),
  consequenceType: text('consequence_type').notNull(),
  data: text('data').notNull().default('{}'),
  createdDay: integer('created_day').notNull(),
  expiresDay: integer('expires_day'),
  triggered: integer('triggered', { mode: 'boolean' }).notNull().default(false),
  triggeredDay: integer('triggered_day'),
});

export const calendar = sqliteTable('calendar', {
  characterId: integer('character_id').primaryKey().references(() => characters.id),
  gameDay: integer('game_day').notNull().default(1),
  realStartDate: text('real_start_date').notNull().default(''),
  lastDailyProcess: text('last_daily_process').notNull().default(''),
  lastWeeklyProcess: text('last_weekly_process'),
  lastUpkeepDay: integer('last_upkeep_day').notNull().default(1),
});

export const combatLog = sqliteTable('combat_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  characterId: integer('character_id').notNull().references(() => characters.id),
  combatState: text('combat_state').notNull().default('{}'),
  result: text('result'),
  startedAt: text('started_at').notNull().default(''),
  endedAt: text('ended_at'),
  gameDay: integer('game_day').notNull().default(1),
});
