export type Discipline = 'telekinesis' | 'telepathy' | 'pyromancy' | 'divination' | 'biomancy';
export type PerilsSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';
export type PowerContext = 'combat' | 'social' | 'exploration';

export interface PsychicPower {
  id: string;
  discipline: Discipline;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  description: string;
  contexts: PowerContext[];
  difficulty: number;
  effects: {
    combat?: { damage?: number; range?: string; special?: string[] };
    social?: { description: string };
    exploration?: { description: string };
  };
  prerequisites: string[];
  basePerilsModifier: number;
}

export interface PerilsEffect {
  description: string;
  sanityLoss: number;
  corruptionGain: number;
  damage: number;
  additionalEffects: string[];
}

export interface PerilsResult {
  occurred: boolean;
  severity: PerilsSeverity | null;
  effect: PerilsEffect | null;
}

export interface PsychicPowerUseResult {
  success: boolean;
  effectDescription: string;
  perilsResult: PerilsResult;
  corruptionGained: number;
}
