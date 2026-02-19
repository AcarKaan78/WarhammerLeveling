// ============================================================================
// PROGRESSION ENGINE - Pure functions for XP, leveling, perks, and system
// evolution.  No database access, no side effects.
// ============================================================================

import { CONFIG } from '@/domain/config';
import type { PerkPrerequisites } from '@/domain/models';

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface LevelUpReward {
  level: number;
  statPoints: number;
  skillPoints: number;
  perkPoint: boolean;
}

export interface LevelUpResult {
  levelsGained: number;
  rewards: LevelUpReward[];
  remainingXP: number;
}

export interface SystemLevelInfo {
  systemLevel: number;
  newFeatures: string[];
}

export interface PerkEligibility {
  eligible: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// calculateXPToNext
// ---------------------------------------------------------------------------

/**
 * Calculate the XP required to advance from `level` to `level + 1`.
 * Formula: floor( basePerLevel * scalingFactor ^ (level - 1) )
 */
export function calculateXPToNext(level: number): number {
  return Math.floor(
    CONFIG.xp.basePerLevel * Math.pow(CONFIG.xp.scalingFactor, level - 1),
  );
}

// ---------------------------------------------------------------------------
// checkLevelUp
// ---------------------------------------------------------------------------

/**
 * Determine how many levels are gained from the current XP pool.
 * Loops while currentXP >= xpToNext, subtracting the cost each time.
 */
export function checkLevelUp(
  currentXP: number,
  xpToNext: number,
  currentLevel: number,
): LevelUpResult {
  let level = currentLevel;
  let xp = currentXP;
  let xpRequired = xpToNext;
  const rewards: LevelUpReward[] = [];

  while (xp >= xpRequired && level < CONFIG.xp.maxLevel) {
    xp -= xpRequired;
    level += 1;
    const grantPerk = level % CONFIG.xp.perkPointEveryNLevels === 0;
    rewards.push({
      level,
      statPoints: CONFIG.xp.statPointsPerLevel,
      skillPoints: CONFIG.xp.skillPointsPerLevel,
      perkPoint: grantPerk,
    });
    xpRequired = calculateXPToNext(level);
  }

  return { levelsGained: rewards.length, rewards, remainingXP: xp };
}

// ---------------------------------------------------------------------------
// getSystemLevelUnlocks
// ---------------------------------------------------------------------------

/**
 * Determine the current system evolution level and which features are
 * unlocked at that level. Finds the highest threshold <= playerLevel.
 */
export function getSystemLevelUnlocks(playerLevel: number): SystemLevelInfo {
  const evolution = CONFIG.systemEvolution;
  const thresholds = Object.keys(evolution).map(Number).sort((a, b) => a - b);
  let systemLevel = 0;
  let newFeatures: string[] = [];
  for (const t of thresholds) {
    if (playerLevel >= t) {
      systemLevel = t;
      newFeatures = [...evolution[t]];
    }
  }
  return { systemLevel, newFeatures };
}

// ---------------------------------------------------------------------------
// getAllUnlockedFeatures
// ---------------------------------------------------------------------------

/**
 * Collect ALL features unlocked up to and including the player level.
 */
export function getAllUnlockedFeatures(playerLevel: number): string[] {
  const evolution = CONFIG.systemEvolution;
  const thresholds = Object.keys(evolution).map(Number).sort((a, b) => a - b);
  const features: string[] = [];
  for (const t of thresholds) {
    if (playerLevel >= t) {
      features.push(...evolution[t]);
    }
  }
  return features;
}

// ---------------------------------------------------------------------------
// checkPerkPrerequisites
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a character meets a perk prerequisites.
 * Checks: level requirement, stat requirements, perk dependencies.
 */
export function checkPerkPrerequisites(
  perkPrereqs: PerkPrerequisites,
  currentPerks: string[],
  stats: Record<string, number>,
  level: number,
): PerkEligibility {
  if (level < perkPrereqs.level) {
    return { eligible: false, reason: `Requires level ${perkPrereqs.level} (current: ${level})` };
  }
  for (const [stat, minValue] of Object.entries(perkPrereqs.stats)) {
    const current = stats[stat] ?? 0;
    if (current < minValue) {
      return { eligible: false, reason: `Requires ${stat} >= ${minValue} (current: ${current})` };
    }
  }
  for (const requiredPerk of perkPrereqs.perks) {
    if (!currentPerks.includes(requiredPerk)) {
      return { eligible: false, reason: `Requires perk "${requiredPerk}" to be unlocked first` };
    }
  }
  return { eligible: true };
}
