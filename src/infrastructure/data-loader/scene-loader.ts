import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { Scene } from '@/domain/models';

const SceneSchema = z.object({
  id: z.string(),
  chapter: z.string(),
  title: z.string(),
  conditions: z.object({
    minLevel: z.number().optional(),
    maxLevel: z.number().optional(),
    requiredFlags: z.array(z.string()).optional(),
    forbiddenFlags: z.array(z.string()).optional(),
    minStat: z.record(z.number()).optional(),
    minReputation: z.record(z.number()).optional(),
    npcAlive: z.array(z.string()).optional(),
    npcDead: z.array(z.string()).optional(),
    minSanity: z.number().optional(),
    maxSanity: z.number().optional(),
    minCorruption: z.number().optional(),
    maxCorruption: z.number().optional(),
    hasMutation: z.array(z.string()).optional(),
    questActive: z.array(z.string()).optional(),
    questComplete: z.array(z.string()).optional(),
    systemLevel: z.number().optional(),
  }).default({}),
  blocks: z.array(z.object({
    type: z.enum(['description', 'dialogue', 'system_message']),
    text: z.string(),
    speaker: z.string().optional(),
    speakerMood: z.string().optional(),
    systemLevel: z.number().optional(),
  })),
  choices: z.array(z.any()).default([]),
  onEnterEffects: z.any().optional(),
  isHub: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
});

const cache = new Map<string, Scene>();

export function loadScene(sceneId: string): Scene | null {
  if (cache.has(sceneId)) return cache.get(sceneId)!;

  const storyDir = join(process.cwd(), 'data', 'story');
  if (!existsSync(storyDir)) return null;

  // Search recursively for the scene file
  const searchDir = (dir: string): string | null => {
    if (!existsSync(dir)) return null;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.name === `${sceneId}.json`) {
        return fullPath;
      }
    }
    return null;
  };

  const filePath = searchDir(storyDir);
  if (!filePath) return null;

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const scene = SceneSchema.parse(raw) as unknown as Scene;
    cache.set(sceneId, scene);
    return scene;
  } catch (err) {
    console.error(`[scene-loader] Failed to load scene ${sceneId}:`, err);
    return null;
  }
}

export function loadAllScenes(): Scene[] {
  const storyDir = join(process.cwd(), 'data', 'story');
  if (!existsSync(storyDir)) return [];

  const scenes: Scene[] = [];
  const loadDir = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        loadDir(fullPath);
      } else if (entry.name.endsWith('.json') && !entry.name.startsWith('_')) {
        try {
          const raw = JSON.parse(readFileSync(fullPath, 'utf-8'));
          const scene = SceneSchema.parse(raw) as unknown as Scene;
          cache.set(scene.id, scene);
          scenes.push(scene);
        } catch {
          // Skip invalid files
        }
      }
    }
  };
  loadDir(storyDir);
  return scenes;
}

export function clearSceneCache(): void {
  cache.clear();
}
