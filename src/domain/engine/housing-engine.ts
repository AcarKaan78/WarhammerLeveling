// ============================================================================
// HOUSING ENGINE - Pure functions for housing effects and decoration bonuses.
// No database access, no side effects.
// ============================================================================

import type { DecorationEffect, HousingLevel } from '@/domain/models';

// ---------------------------------------------------------------------------
// HousingEffects - the computed bonuses provided by housing + decorations
// ---------------------------------------------------------------------------

export interface HousingEffects {
  /** Bonus added to the character sanity recovery rate */
  sanityRecoveryBonus: number;
  /** Bonus added to the character corruption resistance */
  corruptionResist: number;
  /** Category-keyed XP bonus percentages from decorations */
  xpBonuses: Record<string, number>;
}

// ---------------------------------------------------------------------------
// calculateHousingEffects
// ---------------------------------------------------------------------------

/**
 * Calculate the combined effects of a character housing level and all
 * active decoration effects.
 *
 * Base bonuses from housing level:
 * - Sanity recovery bonus = housingLevel * 0.5
 * - Corruption resistance  = housingLevel * 0.2
 *
 * Decoration effects are summed on top:
 * - Each decoration sanityRecoveryBonus and corruptionResist are added.
 * - Each decoration xpBonusCategory / xpBonusPercent are accumulated into
 *   a Record keyed by category name.
 *
 * @param housingLevel       - Numeric housing level (1-5).
 * @param decorationEffects  - Array of DecorationEffect objects from all
 *                             placed decorations.
 * @returns A HousingEffects object with the combined bonuses.
 */
export function calculateHousingEffects(
  housingLevel: HousingLevel,
  decorationEffects: DecorationEffect[],
): HousingEffects {
  // Base bonuses from housing level
  let sanityRecoveryBonus = housingLevel * 0.5;
  let corruptionResist = housingLevel * 0.2;
  const xpBonuses: Record<string, number> = {};

  // Sum decoration effects
  for (const effect of decorationEffects) {
    sanityRecoveryBonus += effect.sanityRecoveryBonus;
    corruptionResist += effect.corruptionResist;

    if (effect.xpBonusCategory && effect.xpBonusPercent > 0) {
      const category = effect.xpBonusCategory;
      xpBonuses[category] = (xpBonuses[category] ?? 0) + effect.xpBonusPercent;
    }
  }

  return {
    sanityRecoveryBonus,
    corruptionResist,
    xpBonuses,
  };
}
