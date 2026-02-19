import type { PrimaryStatKey } from './character';

export type StatModifierSource =
  | 'origin'
  | 'background'
  | 'personality'
  | 'equipment'
  | 'trait'
  | 'mutation'
  | 'sanity'
  | 'corruption'
  | 'buff'
  | 'perk'
  | 'housing';

export interface StatModifier {
  source: StatModifierSource;
  stat: PrimaryStatKey;
  value: number;
  description: string;
}

export interface DerivedStats {
  initiative: number;
  movement: number;
  dodgeChance: number;
  parryChance: number;
  meleeBonus: number;
  rangedBonus: number;
  carryCapacity: number;
  woundThreshold: number;
  corruptionResistance: number;
  sanityRecovery: number;
}

export interface StatCheckResult {
  roll: number;
  target: number;
  success: boolean;
  margin: number;
  criticalSuccess: boolean;
  criticalFailure: boolean;
  degreesOfSuccess: number;
  degreesOfFailure: number;
}

export interface StatLevelDescription {
  min: number;
  max: number;
  label: string;
}

export interface StatScalingBreakpoint {
  threshold: number;
  rate: number;
}
