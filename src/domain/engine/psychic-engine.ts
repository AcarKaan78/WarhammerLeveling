// ============================================================================
// PSYCHIC ENGINE -- Pure functions for psychic powers & Perils of the Warp
// ============================================================================

import {
  PerilsResult,
  PerilsSeverity,
  PerilsEffect,
  PsychicPower,
  PsychicPowerUseResult,
} from '@/domain/models';
import { CONFIG } from '@/domain/config';
import { chance, rollUnder, rollDie } from './dice';

// Map numeric power tiers (1-5) to CONFIG.psychic.basePerilsChance keys
const TIER_TO_CONFIG_KEY: Record<number, string> = {
  1: 'minor',
  2: 'moderate',
  3: 'major',
  4: 'extreme',
  5: 'extreme',
};

// ----------------------------------------------------------------------------
// calculatePerilsChance
// ----------------------------------------------------------------------------

export function calculatePerilsChance(
  powerTier: number,
  sanityState: string,
  corruption: number,
  overuseCount: number,
): number {
  const tierKey = TIER_TO_CONFIG_KEY[powerTier] ?? 'minor';
  const baseChance = CONFIG.psychic.basePerilsChance[tierKey] ?? 0;
  const sanityMod = CONFIG.psychic.sanityPerilsModifier[sanityState] ?? 0;
  const corruptionMod = corruption * CONFIG.psychic.corruptionPerilsModifier;
  const overuseMod = overuseCount * 0.02;

  const total = baseChance + sanityMod + corruptionMod + overuseMod;
  return Math.min(1, Math.max(0, total));
}

// ----------------------------------------------------------------------------
// getPerilsEffects
// ----------------------------------------------------------------------------

export function getPerilsEffects(severity: PerilsSeverity): PerilsEffect {
  switch (severity) {
    case 'minor':
      return {
        sanityLoss: rollDie(5),
        corruptionGain: 1,
        damage: 0,
        description: 'The warp whispers...',
        additionalEffects: ['Nosebleed'],
      };

    case 'moderate':
      return {
        sanityLoss: 5 + rollDie(6) - 1,
        corruptionGain: 2 + rollDie(2) - 1,
        damage: rollDie(10),
        description: 'Warp energy crackles...',
        additionalEffects: ['Temporary blindness', 'Headache'],
      };

    case 'major':
      return {
        sanityLoss: 10 + rollDie(11) - 1,
        corruptionGain: 5,
        damage: rollDie(10) + rollDie(10),
        description: 'The veil tears...',
        additionalEffects: ['Unconscious 1 round', 'Warp echo'],
      };

    case 'catastrophic':
      return {
        sanityLoss: 20 + rollDie(11) - 1,
        corruptionGain: 10,
        damage: rollDie(10) + rollDie(10) + rollDie(10) + 10,
        description: 'CATASTROPHIC WARP BREACH!',
        additionalEffects: ['Daemonic manifestation', 'Area damage', 'Permanent mutation'],
      };
  }
}

// ----------------------------------------------------------------------------
// resolvePerils
// ----------------------------------------------------------------------------

export function resolvePerils(perilsChance: number): PerilsResult {
  if (!chance(perilsChance)) {
    return { occurred: false, severity: null, effect: null };
  }

  // Determine severity by rolling 1-100 and mapping against CONFIG severity ranges
  const severityRoll = Math.floor(Math.random() * 100) + 1;
  const ranges = CONFIG.psychic.severityRanges;

  let severity: PerilsSeverity = 'minor';

  if (severityRoll >= ranges.catastrophic.min && severityRoll <= ranges.catastrophic.max) {
    severity = 'catastrophic';
  } else if (severityRoll >= ranges.major.min && severityRoll <= ranges.major.max) {
    severity = 'major';
  } else if (severityRoll >= ranges.moderate.min && severityRoll <= ranges.moderate.max) {
    severity = 'moderate';
  } else {
    // Covers both negligible and minor config ranges -- treat as minor
    severity = 'minor';
  }

  const effect = getPerilsEffects(severity);

  return { occurred: true, severity, effect };
}

// ----------------------------------------------------------------------------
// resolvePowerUse
// ----------------------------------------------------------------------------

export function resolvePowerUse(
  power: PsychicPower,
  casterWillpower: number,
  difficulty: number,
  modifiers: number[],
): PsychicPowerUseResult {
  const totalModifier = modifiers.reduce((sum, m) => sum + m, 0);
  const target = casterWillpower - difficulty + totalModifier;

  // Roll willpower check
  const rollResult = rollUnder(target);
  const success = rollResult.success;

  // Calculate perils chance using tier-based base chance + power's own modifier
  const tierKey = TIER_TO_CONFIG_KEY[power.tier] ?? 'minor';
  const basePerilsChance =
    (CONFIG.psychic.basePerilsChance[tierKey] ?? 0) + power.basePerilsModifier;
  const clampedPerilsChance = Math.min(1, Math.max(0, basePerilsChance));

  // Resolve Perils of the Warp
  const perilsResult = resolvePerils(clampedPerilsChance);

  // Calculate total corruption gained
  const baseCorruptionGain = CONFIG.corruption.psychicUseGain;
  const perilsCorruption = perilsResult.effect?.corruptionGain ?? 0;
  const corruptionGained = baseCorruptionGain + perilsCorruption;

  // Build effect description
  let effectDescription: string;
  if (success) {
    effectDescription = `${power.name} manifests successfully.`;
  } else {
    effectDescription = `${power.name} fails to manifest. The warp resists your will.`;
  }

  if (perilsResult.occurred && perilsResult.effect) {
    effectDescription += ` ${perilsResult.effect.description}`;
  }

  return {
    success,
    effectDescription,
    perilsResult,
    corruptionGained,
  };
}
