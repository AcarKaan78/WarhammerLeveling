// ============================================================================
// SKILL ENGINE — Pure functions for skill checks and XP calculations.
// No database access, no side effects.
// ============================================================================

import { SkillCheckResult } from '@/domain/models';
import { rollUnder } from './dice';

/**
 * Calculate the effective skill value used for skill checks.
 * Combines the raw skill level with governing stat contributions.
 * Primary stat contributes half its value; secondary stat contributes a quarter.
 */
export function calculateEffectiveSkill(
  skillLevel: number,
  governingStat1: number,
  governingStat2?: number,
): number {
  let effective = skillLevel + governingStat1 / 2;

  if (governingStat2 !== undefined) {
    effective += governingStat2 / 4;
  }

  return Math.round(effective);
}

/**
 * Perform a skill check using the d100 roll-under system.
 * The target is effectiveSkill - difficulty + sum of all modifiers.
 * Returns a full SkillCheckResult with margin, crits, etc.
 */
export function performSkillCheck(
  effectiveSkill: number,
  difficulty: number,
  modifiers: number[],
): SkillCheckResult {
  const totalModifiers = modifiers.reduce((sum, mod) => sum + mod, 0);
  const target = effectiveSkill - difficulty + totalModifiers;

  const result = rollUnder(target);

  return {
    skillId: '', // caller should fill this in based on context
    effectiveSkill,
    roll: result.roll,
    target: result.target,
    success: result.success,
    margin: result.margin,
    criticalSuccess: result.criticalSuccess,
    criticalFailure: result.criticalFailure,
  };
}

/**
 * Calculate the XP required to advance to the next skill level.
 * Uses exponential scaling: 50 * (1.2 ^ currentLevel).
 */
export function calculateSkillXPToNext(currentLevel: number): number {
  return Math.round(50 * Math.pow(1.2, currentLevel));
}

/**
 * Calculate XP gained from a skill check based on difficulty and outcome.
 * Higher difficulty yields more XP. Failing gives a 50% bonus
 * (learning from mistakes is more impactful than easy success).
 */
export function calculateSkillXPGain(difficulty: number, success: boolean): number {
  // Base XP mapped from difficulty tiers
  let baseXP: number;
  if (difficulty <= 10) baseXP = 5;
  else if (difficulty <= 20) baseXP = 10;
  else if (difficulty <= 30) baseXP = 15;
  else if (difficulty <= 40) baseXP = 20;
  else baseXP = 25;

  // Failure grants 50% bonus XP — you learn more from mistakes
  if (!success) {
    baseXP = Math.round(baseXP * 1.5);
  }

  return baseXP;
}
