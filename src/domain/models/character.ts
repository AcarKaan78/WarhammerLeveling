export type Origin =
  | 'hive_world'
  | 'forge_world'
  | 'agri_world'
  | 'shrine_world'
  | 'feral_world'
  | 'void_born';

export type Background =
  | 'guard_veteran'
  | 'clerk'
  | 'underhive_scum'
  | 'scholam_student'
  | 'outcast_psyker'
  | 'sanctioned_psyker'
  | 'merchant'
  | 'mechanicus_initiate';

export type Gender = 'male' | 'female' | 'nonbinary';

export type Personality =
  | 'stoic'
  | 'hot_blooded'
  | 'curious'
  | 'paranoid'
  | 'devout'
  | 'pragmatic'
  | 'compassionate'
  | 'ambitious';

export type Build = 'gaunt' | 'lean' | 'average' | 'stocky' | 'heavy';

export type Height = 'short' | 'average' | 'tall';

export type Difficulty = 'narrative' | 'standard' | 'grimdark';

export interface Appearance {
  build: Build;
  height: Height;
  distinguishingFeatures: string;
}

export type PrimaryStatKey =
  | 'weaponSkill'
  | 'ballisticSkill'
  | 'strength'
  | 'toughness'
  | 'agility'
  | 'intelligence'
  | 'perception'
  | 'willpower'
  | 'fellowship';

export interface PrimaryStats {
  weaponSkill: number;
  ballisticSkill: number;
  strength: number;
  toughness: number;
  agility: number;
  intelligence: number;
  perception: number;
  willpower: number;
  fellowship: number;
}

export interface CharacterCreationData {
  name: string;
  gender: Gender;
  age: number;
  appearance: Appearance;
  origin: Origin;
  background: Background;
  personality1: Personality;
  personality2: Personality;
  bonusStatAllocations: Partial<Record<PrimaryStatKey, number>>;
  difficulty: Difficulty;
  ironman: boolean;
}

export interface Character {
  id: number;
  name: string;
  gender: Gender;
  age: number;
  origin: Origin;
  background: Background;
  personality1: Personality;
  personality2: Personality;
  appearance: Appearance;
  level: number;
  xp: number;
  xpToNext: number;
  freeStatPoints: number;
  freeSkillPoints: number;
  freePerkPoints: number;
  primaryStats: PrimaryStats;
  hpCurrent: number;
  hpMax: number;
  sanity: number;
  sanityMax: number;
  corruption: number;
  corruptionThreshold: number;
  fatigue: number;
  fatigueMax: number;
  psyRating: number;
  carryCapacity: number;
  influence: number;
  thrones: number;
  housingLevel: number;
  currentLocation: string;
  systemLevel: number;
  difficulty: Difficulty;
  ironman: boolean;
  createdAt: Date;
  lastPlayed: Date;
}
