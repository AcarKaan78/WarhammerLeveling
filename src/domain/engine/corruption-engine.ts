// ============================================================================
// CORRUPTION ENGINE -- Pure functions for corruption, mutations, resistance
// ============================================================================

import { CorruptionState, Mutation, MutationEffect } from '@/domain/models';
import { CONFIG } from '@/domain/config';
import { shuffle, clamp } from './dice';

// ----------------------------------------------------------------------------
// Internal mapping from config threshold values to model CorruptionState.
// CONFIG thresholds: pure(0), untainted(11), touched(26), tainted(41),
//                    corrupted(61), damned(76), lost(91)
// Model states:      pure | tainted | marked | corrupted | damned | abomination | lost
// Mapped in descending order for reverse-order threshold checking.
// ----------------------------------------------------------------------------

const CORRUPTION_BRACKETS: Array<{ minValue: number; state: CorruptionState }> = [
  { minValue: 91, state: 'lost' },
  { minValue: 76, state: 'abomination' },
  { minValue: 61, state: 'damned' },
  { minValue: 41, state: 'corrupted' },
  { minValue: 26, state: 'marked' },
  { minValue: 11, state: 'tainted' },
  { minValue: 0, state: 'pure' },
];

// ----------------------------------------------------------------------------
// getCorruptionState
// ----------------------------------------------------------------------------

export function getCorruptionState(corruptionValue: number): CorruptionState {
  for (const bracket of CORRUPTION_BRACKETS) {
    if (corruptionValue >= bracket.minValue) {
      return bracket.state;
    }
  }
  return 'pure';
}

// ----------------------------------------------------------------------------
// getCorruptionEffects
// ----------------------------------------------------------------------------

export function getCorruptionEffects(corruptionValue: number): {
  statMods: Record<string, number>;
  sanityDrainIncrease: number;
  npcReactionMod: number;
} {
  const state = getCorruptionState(corruptionValue);

  switch (state) {
    case 'pure':
      return { statMods: {}, sanityDrainIncrease: 0, npcReactionMod: 0 };

    case 'tainted':
      return {
        statMods: { fellowship: -5 },
        sanityDrainIncrease: 0.5,
        npcReactionMod: -5,
      };

    case 'marked':
      return {
        statMods: { fellowship: -10, willpower: -5 },
        sanityDrainIncrease: 1,
        npcReactionMod: -15,
      };

    case 'corrupted':
      return {
        statMods: { fellowship: -15, willpower: -10, strength: 5 },
        sanityDrainIncrease: 2,
        npcReactionMod: -30,
      };

    case 'damned':
      return {
        statMods: { fellowship: -20, willpower: -15, strength: 10, toughness: 5 },
        sanityDrainIncrease: 3,
        npcReactionMod: -50,
      };

    case 'abomination':
      return {
        statMods: { fellowship: -30, willpower: -20, strength: 15, toughness: 10 },
        sanityDrainIncrease: 5,
        npcReactionMod: -80,
      };

    case 'lost':
      return {
        statMods: { fellowship: -30, willpower: -20, strength: 15, toughness: 10 },
        sanityDrainIncrease: 5,
        npcReactionMod: -100,
      };
  }
}

// ----------------------------------------------------------------------------
// checkMutationThreshold
// ----------------------------------------------------------------------------

export function checkMutationThreshold(
  oldCorruption: number,
  newCorruption: number,
): boolean {
  const thresholds = CONFIG.corruption.mutationThresholds;
  for (const threshold of thresholds) {
    if (oldCorruption < threshold && newCorruption >= threshold) {
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------------------------------
// selectMutationOptions
// ----------------------------------------------------------------------------

export function selectMutationOptions(
  corruptionLevel: number,
  allMutations: Mutation[],
  currentMutationIds: string[],
): Mutation[] {
  const eligible = allMutations.filter(
    (m) => !currentMutationIds.includes(m.id) && m.corruptionThreshold <= corruptionLevel,
  );

  const shuffled = shuffle(eligible);
  return shuffled.slice(0, 3);
}

// ----------------------------------------------------------------------------
// applyMutationEffects
// ----------------------------------------------------------------------------

export function applyMutationEffects(mutations: Mutation[]): {
  statMods: Record<string, number>;
  abilities: string[];
  penalties: string[];
} {
  const statMods: Record<string, number> = {};
  const abilities: string[] = [];
  const penalties: string[] = [];

  for (const mutation of mutations) {
    const effects = mutation.effects;

    // Sum stat modifiers
    for (const [stat, value] of Object.entries(effects.statModifiers)) {
      statMods[stat] = (statMods[stat] ?? 0) + value;
    }

    // Collect abilities
    for (const ability of effects.abilities) {
      abilities.push(ability);
    }

    // Collect penalties
    for (const penalty of effects.penalties) {
      penalties.push(penalty);
    }
  }

  return { statMods, abilities, penalties };
}

// ----------------------------------------------------------------------------
// calculateCorruptionResistance
// ----------------------------------------------------------------------------

export function calculateCorruptionResistance(
  willpower: number,
  faithMods: number,
  equipmentMods: number,
  traitBonuses: number,
): number {
  return Math.floor(willpower / 2) + faithMods + equipmentMods + traitBonuses;
}
