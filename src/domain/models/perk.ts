export type PerkTree = 'combat' | 'psychic' | 'social' | 'survival' | 'technical';
export type PerkTier = 1 | 2 | 3;

export interface PerkPrerequisites {
  perks: string[];
  stats: Record<string, number>;
  level: number;
  skills: Record<string, number>;
}

export interface PerkEffect {
  statModifiers: Record<string, number>;
  abilities: string[];
  special: string | null;
}

export interface Perk {
  id: string;
  name: string;
  tree: PerkTree;
  tier: PerkTier;
  description: string;
  prerequisites: PerkPrerequisites;
  effects: PerkEffect;
  unlocked: boolean;
}
