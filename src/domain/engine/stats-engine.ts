// ============================================================================
// STATS ENGINE - Pure functions for stat calculation and checks.
// No database access, no side effects.
// ============================================================================

import { CONFIG } from '@/domain/config';
import type {
  PrimaryStats,
  PrimaryStatKey,
  Origin,
  Background,
  Personality,
} from '@/domain/models';
import type {
  DerivedStats,
  StatModifier,
  StatModifierSource,
  StatCheckResult,
} from '@/domain/models';
import { rollUnder } from './dice';

// All primary stat keys in a fixed order
const PRIMARY_STAT_KEYS: PrimaryStatKey[] = [
  'weaponSkill',
  'ballisticSkill',
  'strength',
  'toughness',
  'agility',
  'intelligence',
  'perception',
  'willpower',
  'fellowship',
];

/**
 * Build a blank PrimaryStats object with every key set to a given value.
 */
function blankStats(value: number): PrimaryStats {
  return {
    weaponSkill: value,
    ballisticSkill: value,
    strength: value,
    toughness: value,
    agility: value,
    intelligence: value,
    perception: value,
    willpower: value,
    fellowship: value,
  };
}

/**
 * Clamp a stat value to the configured min/max range.
 */
function clampStat(value: number): number {
  return Math.max(CONFIG.stats.minStat, Math.min(CONFIG.stats.maxStat, value));
}

// ---------------------------------------------------------------------------
// calculateInitialStats
// ---------------------------------------------------------------------------

/**
 * Calculate starting primary stats for a new character.
 *
 * 1. Start with baseStat (25) for every primary stat.
 * 2. Add origin stat modifiers.
 * 3. Add background stat bonuses.
 * 4. Add personality modifiers (two personalities).
 * 5. Add player-chosen bonus allocations.
 *
 * All values are clamped to [minStat, maxStat].
 */
export function calculateInitialStats(
  origin: Origin,
  background: Background,
  personalities: [Personality, Personality],
  bonusAllocations: Partial<Record<PrimaryStatKey, number>>,
): PrimaryStats {
  const stats = blankStats(CONFIG.stats.baseStat);

  // --- Origin modifiers ---
  const originConfig = CONFIG.origins[origin];
  if (originConfig) {
    for (const [stat, mod] of Object.entries(originConfig.statModifiers)) {
      if (stat in stats) {
        stats[stat as PrimaryStatKey] += mod;
      }
    }
  }

  // --- Background modifiers ---
  const bgConfig = (CONFIG.backgrounds as Record<string, { statBonuses: Record<string, number> }>)[background];
  if (bgConfig) {
    for (const [stat, mod] of Object.entries(bgConfig.statBonuses)) {
      if (stat in stats) {
        stats[stat as PrimaryStatKey] += mod;
      }
    }
  }

  // --- Personality modifiers ---
  for (const pKey of personalities) {
    const pConfig = (CONFIG.personalities as Record<string, { statMods: Record<string, number> }>)[pKey];
    if (pConfig) {
      for (const [stat, mod] of Object.entries(pConfig.statMods)) {
        if (stat in stats) {
          stats[stat as PrimaryStatKey] += mod;
        }
      }
    }
  }

  // --- Bonus allocations ---
  for (const [stat, points] of Object.entries(bonusAllocations)) {
    if (stat in stats && typeof points === 'number') {
      stats[stat as PrimaryStatKey] += points;
    }
  }

  // Clamp every stat
  for (const key of PRIMARY_STAT_KEYS) {
    stats[key] = clampStat(stats[key]);
  }

  return stats;
}

// ---------------------------------------------------------------------------
// calculateDerivedStats
// ---------------------------------------------------------------------------

/**
 * Compute all derived / secondary stats from primary stats, level, and
 * optional equipment bonuses and mutation effects.
 */
export function calculateDerivedStats(
  primaryStats: PrimaryStats,
  level: number,
  equipmentBonuses?: Partial<DerivedStats>,
  mutations?: Partial<DerivedStats>,
): DerivedStats {
  const ps = primaryStats;

  const base: DerivedStats = {
    initiative: ps.agility + ps.perception,
    movement: Math.floor(ps.agility / 5),
    dodgeChance: ps.agility,
    parryChance: ps.weaponSkill,
    meleeBonus: Math.floor(ps.strength / 10),
    rangedBonus: Math.floor(ps.ballisticSkill / 10),
    carryCapacity: ps.strength * 2 + ps.toughness,
    woundThreshold: ps.toughness,
    corruptionResistance: ps.willpower,
    sanityRecovery: Math.floor(ps.willpower / 10),
  };

  // Layer equipment bonuses
  if (equipmentBonuses) {
    for (const key of Object.keys(base) as (keyof DerivedStats)[]) {
      if (typeof equipmentBonuses[key] === 'number') {
        (base[key] as number) += equipmentBonuses[key]!;
      }
    }
  }

  // Layer mutation effects
  if (mutations) {
    for (const key of Object.keys(base) as (keyof DerivedStats)[]) {
      if (typeof mutations[key] === 'number') {
        (base[key] as number) += mutations[key]!;
      }
    }
  }

  return base;
}

// ---------------------------------------------------------------------------
// applyStatGain
// ---------------------------------------------------------------------------

/**
 * Apply a raw stat gain to a current stat value, using the scaling
 * breakpoints from CONFIG to determine the actual gain.
 *
 * Higher current values yield diminished actual gains.
 * The result is clamped to [1, 100].
 *
 * Returns both the actual gain applied and the new value.
 */
export function applyStatGain(
  currentValue: number,
  rawGain: number,
): { actualGain: number; newValue: number } {
  // Find the applicable multiplier: the highest threshold <= currentValue
  const breakpoints = CONFIG.stats.scalingBreakpoints;
  let multiplier = 1.0;

  for (const bp of breakpoints) {
    if (currentValue >= bp.threshold) {
      multiplier = bp.multiplier;
    }
  }

  const actualGain = rawGain * multiplier;
  const newValue = clampStat(currentValue + actualGain);

  return {
    actualGain: newValue - currentValue, // exact delta after clamping
    newValue,
  };
}

// ---------------------------------------------------------------------------
// getStatLevelDescription
// ---------------------------------------------------------------------------

/**
 * Return a human-readable description for the given stat value by looking up
 * the highest matching threshold in CONFIG.stats.levelDescriptions.
 */
export function getStatLevelDescription(value: number): string {
  const descriptions = CONFIG.stats.levelDescriptions;
  const thresholds = Object.keys(descriptions)
    .map(Number)
    .sort((a, b) => a - b);

  let label = 'Unknown';
  for (const t of thresholds) {
    if (value >= t) {
      label = descriptions[t];
    }
  }

  return label;
}

// ---------------------------------------------------------------------------
// getAllModifiers
// ---------------------------------------------------------------------------

/**
 * Collect every active stat modifier from all sources into a flat array of
 * StatModifier objects. Useful for UI tooltips and audit trails.
 */
export function getAllModifiers(
  baseStats: PrimaryStats,
  origin: Origin,
  background: Background,
  personalities: [Personality, Personality],
  equipment: Record<string, number>,
  mutations: Record<string, number>,
  sanityState: string,
  corruptionState: string,
): StatModifier[] {
  const modifiers: StatModifier[] = [];

  // --- Origin ---
  const originConfig = CONFIG.origins[origin];
  if (originConfig) {
    for (const [stat, value] of Object.entries(originConfig.statModifiers)) {
      if (PRIMARY_STAT_KEYS.includes(stat as PrimaryStatKey)) {
        modifiers.push({
          source: 'origin' as StatModifierSource,
          stat: stat as PrimaryStatKey,
          value,
          description: `${originConfig.name} origin`,
        });
      }
    }
  }

  // --- Background ---
  const bgConfig = (CONFIG.backgrounds as Record<string, { name: string; statBonuses: Record<string, number> }>)[background];
  if (bgConfig) {
    for (const [stat, value] of Object.entries(bgConfig.statBonuses)) {
      if (PRIMARY_STAT_KEYS.includes(stat as PrimaryStatKey)) {
        modifiers.push({
          source: 'background' as StatModifierSource,
          stat: stat as PrimaryStatKey,
          value,
          description: `${bgConfig.name} background`,
        });
      }
    }
  }

  // --- Personalities ---
  for (const pKey of personalities) {
    const pConfig = (CONFIG.personalities as Record<string, { name: string; statMods: Record<string, number> }>)[pKey];
    if (pConfig) {
      for (const [stat, value] of Object.entries(pConfig.statMods)) {
        if (PRIMARY_STAT_KEYS.includes(stat as PrimaryStatKey)) {
          modifiers.push({
            source: 'personality' as StatModifierSource,
            stat: stat as PrimaryStatKey,
            value,
            description: `${pConfig.name} personality`,
          });
        }
      }
    }
  }

  // --- Equipment ---
  for (const [stat, value] of Object.entries(equipment)) {
    if (PRIMARY_STAT_KEYS.includes(stat as PrimaryStatKey) && value !== 0) {
      modifiers.push({
        source: 'equipment' as StatModifierSource,
        stat: stat as PrimaryStatKey,
        value,
        description: 'Equipped items',
      });
    }
  }

  // --- Mutations ---
  for (const [stat, value] of Object.entries(mutations)) {
    if (PRIMARY_STAT_KEYS.includes(stat as PrimaryStatKey) && value !== 0) {
      modifiers.push({
        source: 'mutation' as StatModifierSource,
        stat: stat as PrimaryStatKey,
        value,
        description: 'Mutation effect',
      });
    }
  }

  // --- Sanity state penalties ---
  // Lower sanity states impose penalties to fellowship and intelligence
  const sanityPenalties: Record<string, Partial<Record<PrimaryStatKey, number>>> = {
    stable: {},
    stressed: { fellowship: -5 },
    disturbed: { fellowship: -10, intelligence: -5 },
    breaking: { fellowship: -15, intelligence: -10, perception: -5 },
    shattered: { fellowship: -20, intelligence: -15, perception: -10, willpower: -10 },
    lost: { fellowship: -30, intelligence: -20, perception: -15, willpower: -20 },
  };

  const sPenalties = sanityPenalties[sanityState] ?? {};
  for (const [stat, value] of Object.entries(sPenalties)) {
    modifiers.push({
      source: 'sanity' as StatModifierSource,
      stat: stat as PrimaryStatKey,
      value: value as number,
      description: `Sanity state: ${sanityState}`,
    });
  }

  // --- Corruption state penalties ---
  const corruptionPenalties: Record<string, Partial<Record<PrimaryStatKey, number>>> = {
    pure: {},
    untainted: {},
    touched: { fellowship: -5 },
    tainted: { fellowship: -10, willpower: -5 },
    corrupted: { fellowship: -15, willpower: -10 },
    damned: { fellowship: -20, willpower: -15, intelligence: -5 },
    lost: { fellowship: -30, willpower: -20, intelligence: -10 },
  };

  const cPenalties = corruptionPenalties[corruptionState] ?? {};
  for (const [stat, value] of Object.entries(cPenalties)) {
    modifiers.push({
      source: 'corruption' as StatModifierSource,
      stat: stat as PrimaryStatKey,
      value: value as number,
      description: `Corruption state: ${corruptionState}`,
    });
  }

  return modifiers;
}

// ---------------------------------------------------------------------------
// performStatCheck
// ---------------------------------------------------------------------------

/**
 * Perform a d100 roll-under stat check.
 *
 * The effective target is: statValue - difficulty + sum(modifiers).
 * Delegates to rollUnder from dice.ts for the actual roll, then wraps
 * the result into a StatCheckResult with degrees of success / failure.
 */
export function performStatCheck(
  statValue: number,
  difficulty: number,
  modifiers: number[] = [],
): StatCheckResult {
  const totalModifier = modifiers.reduce((sum, m) => sum + m, 0);
  const effectiveTarget = statValue - difficulty + totalModifier;

  const rollResult = rollUnder(effectiveTarget);

  return {
    roll: rollResult.roll,
    target: rollResult.target,
    success: rollResult.success,
    margin: rollResult.margin,
    criticalSuccess: rollResult.criticalSuccess,
    criticalFailure: rollResult.criticalFailure,
    degreesOfSuccess: rollResult.success ? Math.floor(rollResult.margin / 10) : 0,
    degreesOfFailure: rollResult.success ? 0 : Math.floor(rollResult.margin / 10),
  };
}
