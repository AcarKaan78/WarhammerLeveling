// ============================================================================
// FACTION ENGINE — Pure functions for faction reputation calculations.
// No database access, no side effects.
// ============================================================================

import { CONFIG } from '@/domain/config';

/**
 * Calculate cross-faction reputation effects when a faction's reputation changes.
 * Returns a map of factionId => reputation change amount.
 */
export function calculateCrossEffects(
  factionId: string,
  repChange: number,
): Record<string, number> {
  const crossEffects: Record<string, number> = {};
  const factionEffects = CONFIG.factionCrossEffects[factionId];

  if (!factionEffects) {
    return crossEffects;
  }

  for (const [targetFactionId, multiplier] of Object.entries(factionEffects)) {
    const change = repChange * multiplier;
    if (change !== 0) {
      crossEffects[targetFactionId] = change;
    }
  }

  return crossEffects;
}

/**
 * Convert a numeric reputation value into a human-readable standing label.
 */
export function getStandingLabel(reputation: number): string {
  if (reputation >= 80) return 'revered';
  if (reputation >= 60) return 'allied';
  if (reputation >= 30) return 'friendly';
  if (reputation >= 10) return 'cordial';
  if (reputation >= -10) return 'neutral';
  if (reputation >= -30) return 'unfriendly';
  if (reputation >= -60) return 'hostile';
  return 'enemy';
}

/**
 * Check which tipping point events should fire when reputation moves
 * from oldRep to newRep. Handles both increasing and decreasing reputation.
 * Returns an array of event strings for all thresholds crossed.
 */
export function checkTippingPoints(
  oldRep: number,
  newRep: number,
  tippingPoints: Array<{ reputation: number; event: string }>,
): string[] {
  const triggeredEvents: string[] = [];

  for (const tp of tippingPoints) {
    const threshold = tp.reputation;

    // Crossed upward: old was below, new is at or above
    const crossedUp = oldRep < threshold && newRep >= threshold;
    // Crossed downward: old was at or above, new is below
    const crossedDown = oldRep >= threshold && newRep < threshold;

    if (crossedUp || crossedDown) {
      triggeredEvents.push(tp.event);
    }
  }

  return triggeredEvents;
}
