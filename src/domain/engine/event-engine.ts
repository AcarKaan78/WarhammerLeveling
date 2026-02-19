// ============================================================================
// EVENT ENGINE — Pure functions for event selection and filtering.
// No database access, no side effects.
// ============================================================================

import { GameEvent, EventCondition } from '@/domain/models';
import { weightedRandom } from './dice';

/**
 * Check whether all conditions on an EventCondition are satisfied
 * by the current game state. All specified conditions must pass.
 *
 * Expected gameState keys:
 *   level: number, flags: string[], sanity: number, corruption: number,
 *   factionRep: Record<string, number>, season: string
 */
export function checkEventConditions(
  conditions: EventCondition,
  gameState: Record<string, unknown>,
): boolean {
  // Level range
  if (conditions.minLevel !== undefined) {
    const level = (gameState['level'] as number) ?? 0;
    if (level < conditions.minLevel) return false;
  }
  if (conditions.maxLevel !== undefined) {
    const level = (gameState['level'] as number) ?? 0;
    if (level > conditions.maxLevel) return false;
  }

  // Required flags — all must be present
  if (conditions.flags && conditions.flags.length > 0) {
    const playerFlags = (gameState['flags'] as string[]) ?? [];
    for (const flag of conditions.flags) {
      if (!playerFlags.includes(flag)) return false;
    }
  }

  // Forbidden flags — none may be present
  if (conditions.forbiddenFlags && conditions.forbiddenFlags.length > 0) {
    const playerFlags = (gameState['flags'] as string[]) ?? [];
    for (const flag of conditions.forbiddenFlags) {
      if (playerFlags.includes(flag)) return false;
    }
  }

  // Sanity range
  if (conditions.minSanity !== undefined) {
    const sanity = (gameState['sanity'] as number) ?? 100;
    if (sanity < conditions.minSanity) return false;
  }
  if (conditions.maxSanity !== undefined) {
    const sanity = (gameState['sanity'] as number) ?? 100;
    if (sanity > conditions.maxSanity) return false;
  }

  // Corruption range
  if (conditions.minCorruption !== undefined) {
    const corruption = (gameState['corruption'] as number) ?? 0;
    if (corruption < conditions.minCorruption) return false;
  }
  if (conditions.maxCorruption !== undefined) {
    const corruption = (gameState['corruption'] as number) ?? 0;
    if (corruption > conditions.maxCorruption) return false;
  }

  // Faction reputation requirements
  if (conditions.factionRep) {
    const factionRep = (gameState['factionRep'] as Record<string, number>) ?? {};
    for (const [factionId, range] of Object.entries(conditions.factionRep)) {
      const rep = factionRep[factionId] ?? 0;
      if (range.min !== undefined && rep < range.min) return false;
      if (range.max !== undefined && rep > range.max) return false;
    }
  }

  // Season
  if (conditions.season !== undefined) {
    const season = (gameState['season'] as string) ?? '';
    if (season !== conditions.season) return false;
  }

  return true;
}

/**
 * Filter the event pool to only events that are currently available.
 * Checks conditions, uniqueness (already used), and cooldown timers.
 */
export function filterAvailableEvents(
  eventPool: GameEvent[],
  gameState: Record<string, unknown>,
  usedEventIds: Record<string, number>,
  currentGameDay: number,
): GameEvent[] {
  return eventPool.filter((event) => {
    // Check all event conditions against game state
    if (!checkEventConditions(event.conditions, gameState)) {
      return false;
    }

    // Unique events can only fire once
    if (event.unique && usedEventIds[event.id] !== undefined) {
      return false;
    }

    // Cooldown check — event can't fire again until cooldown expires
    if (event.cooldownDays > 0 && usedEventIds[event.id] !== undefined) {
      const lastUsedDay = usedEventIds[event.id];
      if (currentGameDay - lastUsedDay < event.cooldownDays) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Select a single event from a weighted list using the dice engine.
 * Returns null if the event list is empty.
 */
export function selectWeightedEvent(events: GameEvent[]): GameEvent | null {
  if (events.length === 0) {
    return null;
  }

  const options = events.map((event) => ({
    item: event,
    weight: event.weight,
  }));

  return weightedRandom(options);
}
