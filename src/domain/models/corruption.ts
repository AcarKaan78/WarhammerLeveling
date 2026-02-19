export type CorruptionState = 'pure' | 'tainted' | 'marked' | 'corrupted' | 'damned' | 'abomination' | 'lost';

export interface CorruptionThreshold {
  state: CorruptionState;
  minValue: number;
  npcReactionMod: number;
  sanityDrainIncrease: number;
}

export interface MutationEffect {
  statModifiers: Record<string, number>;
  abilities: string[];
  penalties: string[];
  visible: boolean;
  npcReactions: { fear?: number; knowledge?: number; affinity?: number };
}

export interface Mutation {
  id: string;
  name: string;
  description: string;
  corruptionThreshold: number;
  effects: MutationEffect;
  chosen: boolean;
}
