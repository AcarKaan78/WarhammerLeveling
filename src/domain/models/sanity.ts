export type SanityState = 'stable' | 'stressed' | 'disturbed' | 'breaking' | 'shattered' | 'lost';

export interface SanityThreshold {
  state: SanityState;
  minValue: number;
  statPenalties: Record<string, number>;
  debuffs: string[];
}

export interface UnreliableNarratorEffect {
  type: 'text_swap' | 'false_detail' | 'name_swap' | 'false_notification' | 'stat_display_error';
  probability: number;
  severity: number;
}

export interface NightmareResult {
  hasNightmare: boolean;
  sanityLoss: number;
  description: string | null;
  effects: Record<string, unknown>;
}
