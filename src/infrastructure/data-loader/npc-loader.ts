import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { NPC } from '@/domain/models';

const NPCSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  role: z.string(),
  personality: z.string(),
  description: z.string(),
  location: z.string(),
  factionId: z.string().nullable(),
  relationship: z.object({
    affinity: z.number().default(0),
    respect: z.number().default(0),
    fear: z.number().default(0),
    knowledge: z.number().default(0),
    loyalty: z.number().default(0),
  }),
  romanceEligible: z.boolean().default(false),
  romanceStage: z.number().default(0),
  secrets: z.array(z.object({
    id: z.string(),
    description: z.string(),
    knowledgeRequired: z.number(),
    revealed: z.boolean().default(false),
    effectOnReveal: z.record(z.unknown()).optional(),
  })).default([]),
  breakingPoints: z.array(z.object({
    id: z.string(),
    condition: z.string(),
    description: z.string(),
    consequence: z.string(),
    triggered: z.boolean().default(false),
  })).default([]),
  companion: z.any().nullable().default(null),
  isAlive: z.boolean().default(true),
  dialogueTreeId: z.string().nullable().default(null),
});

const cache = new Map<string, NPC>();

export function loadNPCData(npcId: string): NPC | null {
  if (cache.has(npcId)) return cache.get(npcId)!;

  const filePath = join(process.cwd(), 'data', 'npcs', `${npcId}.json`);
  if (!existsSync(filePath)) return null;

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const npc = NPCSchema.parse(raw) as unknown as NPC;
    cache.set(npcId, npc);
    return npc;
  } catch (err) {
    console.error(`[npc-loader] Failed to load NPC ${npcId}:`, err);
    return null;
  }
}

export function loadAllNPCs(): NPC[] {
  const dir = join(process.cwd(), 'data', 'npcs');
  if (!existsSync(dir)) return [];

  const npcs: NPC[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.endsWith('.json') && !entry.startsWith('_')) {
      const id = entry.replace('.json', '');
      const npc = loadNPCData(id);
      if (npc) npcs.push(npc);
    }
  }
  return npcs;
}

export function clearNPCCache(): void {
  cache.clear();
}
