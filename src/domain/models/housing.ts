export type HousingLevel = 1 | 2 | 3 | 4 | 5;

export interface DecorationSlot {
  id: string;
  type: 'wall' | 'floor' | 'table' | 'shelf' | 'special';
  occupied: boolean;
  decorationId: string | null;
}

export interface DecorationEffect {
  sanityRecoveryBonus: number;
  corruptionResist: number;
  xpBonusCategory: string | null;
  xpBonusPercent: number;
  statBonus: Record<string, number>;
  special: string | null;
}

export interface Decoration {
  id: string;
  name: string;
  description: string;
  slotType: 'wall' | 'floor' | 'table' | 'shelf' | 'special';
  basePrice: number;
  rarity: string;
  effects: DecorationEffect;
}

export interface Housing {
  characterId: number;
  level: HousingLevel;
  slots: DecorationSlot[];
  rent: number;
  decorations: Array<{ slotId: string; decoration: Decoration }>;
}
