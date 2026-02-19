export type SkillCategory = 'combat' | 'physical' | 'mental' | 'social' | 'technical' | 'psychic';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  governingStat1: string;
  governingStat2: string | null;
  description: string;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface SkillCheckResult {
  skillId: string;
  effectiveSkill: number;
  roll: number;
  target: number;
  success: boolean;
  margin: number;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}
