export { loadItems, loadAllItems, getItemById, clearItemCache } from './item-loader';
export { loadScene, loadAllScenes, clearSceneCache } from './scene-loader';
export { loadNPCData, loadAllNPCs, clearNPCCache } from './npc-loader';
export { loadEvents, loadAllEvents, clearEventCache } from './event-loader';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// === Generic JSON loaders for flat data files ===

const skillCache: unknown[] | null = null;
const perkCache: unknown[] | null = null;
const mutationCache: unknown[] | null = null;
const psychicPowerCache: unknown[] | null = null;
const achievementCache: unknown[] | null = null;

function loadJsonFile<T>(filename: string, schema: z.ZodType<T>): T[] {
  const filePath = join(process.cwd(), 'data', filename);
  if (!existsSync(filePath)) {
    console.warn(`[data-loader] File not found: ${filePath}`);
    return [];
  }
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    return z.array(schema).parse(raw);
  } catch (err) {
    console.error(`[data-loader] Failed to load ${filename}:`, err);
    return [];
  }
}

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  governingStat1: z.string(),
  governingStat2: z.string().optional(),
  description: z.string(),
});

const PerkSchema = z.object({
  id: z.string(),
  name: z.string(),
  tree: z.string(),
  tier: z.number(),
  description: z.string(),
  prerequisites: z.object({
    perks: z.array(z.string()).default([]),
    stats: z.record(z.number()).default({}),
    level: z.number().default(1),
  }).default({}),
  effects: z.object({
    statModifiers: z.record(z.number()).optional(),
    abilities: z.array(z.string()).optional(),
    special: z.string().optional(),
  }).default({}),
});

const MutationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  corruptionThreshold: z.number(),
  effects: z.object({
    statModifiers: z.record(z.number()).default({}),
    abilities: z.array(z.string()).default([]),
    penalties: z.array(z.string()).default([]),
    visible: z.boolean().default(true),
    npcReactions: z.record(z.number()).default({}),
  }),
});

const PsychicPowerSchema = z.object({
  id: z.string(),
  discipline: z.string(),
  name: z.string(),
  tier: z.number(),
  description: z.string(),
  contexts: z.array(z.string()).default([]),
  difficulty: z.number(),
  effects: z.record(z.unknown()).default({}),
  prerequisites: z.array(z.string()).default([]),
  basePerilsModifier: z.number().default(0),
});

const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hiddenDescription: z.string().default('???'),
  category: z.string(),
  conditions: z.array(z.object({
    type: z.string(),
    target: z.string(),
    value: z.number(),
  })),
  reward: z.object({
    xp: z.number().default(0),
    title: z.string().optional(),
    trait: z.string().optional(),
    item: z.string().optional(),
    thrones: z.number().optional(),
  }).default({}),
  progressive: z.boolean().default(false),
  maxProgress: z.number().default(1),
});

export function loadSkills() { return loadJsonFile('skills.json', SkillSchema); }
export function loadPerks() { return loadJsonFile('perks.json', PerkSchema); }
export function loadMutations() { return loadJsonFile('mutations.json', MutationSchema); }
export function loadPsychicPowers() { return loadJsonFile('psychic-powers.json', PsychicPowerSchema); }
export function loadAchievements() { return loadJsonFile('achievements.json', AchievementSchema); }
