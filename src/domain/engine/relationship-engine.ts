// ============================================================================
// RELATIONSHIP ENGINE — Pure functions for NPC relationship calculations.
// No database access, no side effects.
// ============================================================================

import { RelationshipDimensions, RomanceStage, BreakingPoint } from '@/domain/models';
import { CONFIG } from '@/domain/config';

/**
 * Determine how an NPC reacts to the player based on relationship dimensions.
 * Priority order matters: fear and hostility override friendliness.
 */
export function calculateNPCReaction(
  dimensions: RelationshipDimensions,
  context: string,
): string {
  const { affinity, respect, fear, knowledge, loyalty } = dimensions;

  // Fear dominates — a terrified NPC won't act normally
  if (fear > 60) {
    return 'terrified';
  }

  // Active hostility
  if (affinity < -50) {
    return 'hostile';
  }

  // Treacherous loyalty (companion-relevant)
  if (loyalty < -30) {
    return 'treacherous';
  }

  // They know too much about you
  if (knowledge > 70) {
    return 'knowing';
  }

  // Grudging respect — they don't like you, but they acknowledge your competence
  if (respect > 50 && affinity < 0) {
    return 'grudging_respect';
  }

  // Friendly — genuine warmth backed by at least some respect
  if (affinity > 50 && respect > 30) {
    return 'friendly';
  }

  return 'neutral';
}

/**
 * Check whether romance can advance with an NPC.
 * Requires the NPC to be romance-eligible, and the player to have
 * sufficient affinity and respect as defined in CONFIG.
 */
export function checkRomanceEligibility(
  affinity: number,
  respect: number,
  romanceEligible: boolean,
  romanceStage: RomanceStage,
  storyFlags: Record<string, boolean>,
): boolean {
  return (
    romanceEligible &&
    affinity >= CONFIG.relationships.romanceMinAffinity &&
    respect >= CONFIG.relationships.romanceMinRespect
  );
}

/**
 * Check whether any of an NPC's breaking points have been triggered
 * by the current game flags. Returns the first untriggered breaking point
 * whose condition flag exists in gameFlags.
 */
export function checkBreakingPoint(
  breakingPoints: BreakingPoint[],
  gameFlags: Record<string, boolean>,
): { triggered: boolean; breakingPoint?: BreakingPoint } {
  for (const bp of breakingPoints) {
    // Skip already-triggered breaking points
    if (bp.triggered) {
      continue;
    }

    // The condition field is a flag name — check if it's set in gameFlags
    if (gameFlags[bp.condition] === true) {
      return { triggered: true, breakingPoint: bp };
    }
  }

  return { triggered: false };
}

/**
 * Calculate how much affinity should decay based on time since last interaction.
 * Returns the raw decay amount (always non-negative).
 */
export function calculateDecay(
  lastInteraction: Date | null,
  currentDate: Date,
  rate: number,
): number {
  if (lastInteraction === null) {
    return 0;
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const elapsed = currentDate.getTime() - lastInteraction.getTime();
  const weeksSinceInteraction = Math.max(0, elapsed / msPerWeek);

  return weeksSinceInteraction * rate;
}
