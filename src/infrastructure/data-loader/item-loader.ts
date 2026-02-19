import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { Item } from '@/domain/models';

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  weight: z.number(),
  basePrice: z.number(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']),
  stackable: z.boolean(),
  maxStack: z.number().default(1),
  requirements: z.record(z.number()).default({}),
  properties: z.record(z.unknown()).default({}),
});

const cache = new Map<string, Item[]>();

export function loadItems(category: string): Item[] {
  if (cache.has(category)) return cache.get(category)!;

  const filePath = join(process.cwd(), 'data', 'items', `${category}.json`);
  if (!existsSync(filePath)) {
    console.warn(`[item-loader] File not found: ${filePath}`);
    return [];
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const items = z.array(ItemSchema).parse(raw) as unknown as Item[];
    cache.set(category, items);
    return items;
  } catch (err) {
    console.error(`[item-loader] Failed to load ${category}:`, err);
    return [];
  }
}

export function loadAllItems(): Item[] {
  const categories = ['weapons', 'armor', 'consumables', 'key-items'];
  return categories.flatMap(c => loadItems(c));
}

export function getItemById(id: string): Item | undefined {
  const all = loadAllItems();
  return all.find(item => item.id === id);
}

export function clearItemCache(): void {
  cache.clear();
}
