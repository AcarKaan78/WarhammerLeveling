// ============================================================================
// CONSEQUENCE ENGINE — Pure functions for delayed consequence evaluation.
// No database access, no side effects.
// ============================================================================

import { PendingConsequence } from '@/domain/models';

/**
 * Check whether a pending consequence's trigger condition is met
 * based on the current game state.
 *
 * Trigger types and expected gameState keys:
 *   game_day     → gameState['currentGameDay']: number
 *   flag_set     → gameState['flags']: Record<string, boolean>
 *   location_enter → gameState['currentLocation']: string
 *   stat_reach   → gameState['stats']: Record<string, number>
 *   reputation_reach → gameState['factionRep']: Record<string, number>
 *   item_acquire → gameState['inventory']: string[]
 */
export function checkTriggerCondition(
  consequence: PendingConsequence,
  gameState: Record<string, unknown>,
): boolean {
  // Already triggered — no need to re-trigger
  if (consequence.triggered) {
    return false;
  }

  const { triggerType, triggerValue } = consequence;

  switch (triggerType) {
    case 'game_day': {
      const currentDay = (gameState['currentGameDay'] as number) ?? 0;
      const targetDay = typeof triggerValue === 'number'
        ? triggerValue
        : parseInt(triggerValue as string, 10);
      return currentDay >= targetDay;
    }

    case 'flag_set': {
      const flags = (gameState['flags'] as Record<string, boolean>) ?? {};
      const flagName = String(triggerValue);
      return flags[flagName] === true;
    }

    case 'location_enter': {
      const currentLocation = (gameState['currentLocation'] as string) ?? '';
      return currentLocation === String(triggerValue);
    }

    case 'stat_reach': {
      // triggerValue expected format: "statName" with threshold in data,
      // or we parse "statName:threshold" from the value
      const stats = (gameState['stats'] as Record<string, number>) ?? {};
      const triggerStr = String(triggerValue);

      // Check if there's a threshold in the consequence data
      const threshold = (consequence.data['threshold'] as number) ?? 0;
      const statName = triggerStr;

      const currentStat = stats[statName] ?? 0;
      return currentStat >= threshold;
    }

    case 'reputation_reach': {
      const factionRep = (gameState['factionRep'] as Record<string, number>) ?? {};
      const factionId = String(triggerValue);
      const threshold = (consequence.data['threshold'] as number) ?? 0;
      const currentRep = factionRep[factionId] ?? 0;
      return currentRep >= threshold;
    }

    case 'item_acquire': {
      const inventory = (gameState['inventory'] as string[]) ?? [];
      const itemId = String(triggerValue);
      return inventory.includes(itemId);
    }

    default:
      return false;
  }
}

/**
 * Check whether a pending consequence has expired.
 * A consequence with no expiration day (null) never expires.
 */
export function isExpired(
  consequence: PendingConsequence,
  currentGameDay: number,
): boolean {
  return consequence.expiresDay !== null && currentGameDay > consequence.expiresDay;
}
