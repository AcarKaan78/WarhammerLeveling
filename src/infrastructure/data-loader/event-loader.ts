import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { GameEvent } from '@/domain/models';

const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['daily', 'weekly', 'crisis', 'personal', 'faction', 'random']),
  conditions: z.object({
    minLevel: z.number().optional(),
    maxLevel: z.number().optional(),
    flags: z.array(z.string()).optional(),
    forbiddenFlags: z.array(z.string()).optional(),
    minSanity: z.number().optional(),
    maxSanity: z.number().optional(),
    minCorruption: z.number().optional(),
    maxCorruption: z.number().optional(),
    factionRep: z.record(z.object({ min: z.number().optional(), max: z.number().optional() })).optional(),
    season: z.string().optional(),
  }).default({}),
  weight: z.number().default(1),
  outcomes: z.array(z.object({
    description: z.string(),
    effects: z.object({
      xp: z.number().optional(),
      thrones: z.number().optional(),
      sanity: z.number().optional(),
      corruption: z.number().optional(),
      factionRep: z.record(z.number()).optional(),
      items: z.array(z.string()).optional(),
      flags: z.array(z.string()).optional(),
      startQuest: z.string().optional(),
      triggerCombat: z.any().optional(),
    }).default({}),
  })),
  choices: z.array(z.any()).optional(),
  unique: z.boolean().default(false),
  cooldownDays: z.number().default(0),
});

const cache = new Map<string, GameEvent[]>();

export function loadEvents(category: string): GameEvent[] {
  if (cache.has(category)) return cache.get(category)!;

  const filePath = join(process.cwd(), 'data', 'events', `${category}.json`);
  if (!existsSync(filePath)) return [];

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const events = z.array(EventSchema).parse(raw) as unknown as GameEvent[];
    cache.set(category, events);
    return events;
  } catch (err) {
    console.error(`[event-loader] Failed to load events/${category}:`, err);
    return [];
  }
}

export function loadAllEvents(): GameEvent[] {
  const dir = join(process.cwd(), 'data', 'events');
  if (!existsSync(dir)) return [];

  const allEvents: GameEvent[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.endsWith('.json') && !entry.startsWith('_')) {
      const category = entry.replace('.json', '');
      allEvents.push(...loadEvents(category));
    }
  }
  return allEvents;
}

export function clearEventCache(): void {
  cache.clear();
}
