// ============================================================================
// ACHIEVEMENT ENGINE — Pure functions for achievement condition checking.
// No database access, no side effects.
// ============================================================================

import { AchievementCondition } from '@/domain/models';

/**
 * Check a single achievement condition against the current game state.
 *
 * Expected gameState keys by condition type:
 *   flag           → gameState['flags']: string[]
 *   stat_min       → gameState['stats']: Record<string, number>
 *   level_min      → gameState['level']: number
 *   kill_count     → gameState['kills']: Record<string, number>
 *   quest_complete → gameState['completedQuests']: string[]
 *   streak         → gameState['streaks']: Record<string, number>
 *   task_count     → gameState['totalTasks']: number
 *   reputation     → gameState['factionRep']: Record<string, number>
 *   corruption_min → gameState['corruption']: number
 *   sanity_min     → gameState['sanity']: number
 *   custom         → gameState['customFlags']: Record<string, boolean>
 */
function checkSingleCondition(
  condition: AchievementCondition,
  gameState: Record<string, unknown>,
): boolean {
  switch (condition.type) {
    case 'flag': {
      const flags = (gameState['flags'] as string[]) ?? [];
      return flags.includes(condition.target);
    }

    case 'stat_min': {
      const stats = (gameState['stats'] as Record<string, number>) ?? {};
      const currentValue = stats[condition.target] ?? 0;
      return currentValue >= condition.value;
    }

    case 'level_min': {
      const level = (gameState['level'] as number) ?? 0;
      return level >= condition.value;
    }

    case 'kill_count': {
      const kills = (gameState['kills'] as Record<string, number>) ?? {};
      const killCount = kills[condition.target] ?? 0;
      return killCount >= condition.value;
    }

    case 'quest_complete': {
      const completedQuests = (gameState['completedQuests'] as string[]) ?? [];
      return completedQuests.includes(condition.target);
    }

    case 'streak': {
      const streaks = (gameState['streaks'] as Record<string, number>) ?? {};
      // Check if ANY streak meets the threshold, or a specific one if target is set
      if (condition.target && condition.target !== '') {
        const streakValue = streaks[condition.target] ?? 0;
        return streakValue >= condition.value;
      }
      // Any streak at or above value
      return Object.values(streaks).some((s) => s >= condition.value);
    }

    case 'task_count': {
      const totalTasks = (gameState['totalTasks'] as number) ?? 0;
      return totalTasks >= condition.value;
    }

    case 'reputation': {
      const factionRep = (gameState['factionRep'] as Record<string, number>) ?? {};
      const rep = factionRep[condition.target] ?? 0;
      return rep >= condition.value;
    }

    case 'corruption_min': {
      const corruption = (gameState['corruption'] as number) ?? 0;
      return corruption >= condition.value;
    }

    case 'sanity_min': {
      const sanity = (gameState['sanity'] as number) ?? 0;
      return sanity >= condition.value;
    }

    case 'custom': {
      const customFlags = (gameState['customFlags'] as Record<string, boolean>) ?? {};
      return customFlags[condition.target] === true;
    }

    default:
      return false;
  }
}

/**
 * Check whether ALL conditions for an achievement are met.
 * Every condition must pass for the achievement to unlock.
 */
export function checkAchievementCondition(
  conditions: AchievementCondition[],
  gameState: Record<string, unknown>,
): boolean {
  if (conditions.length === 0) {
    return false;
  }

  return conditions.every((condition) => checkSingleCondition(condition, gameState));
}

/**
 * Calculate how many of the achievement's conditions are currently met.
 * Useful for progressive achievement tracking and UI display.
 */
export function calculateProgress(
  conditions: AchievementCondition[],
  gameState: Record<string, unknown>,
): number {
  if (conditions.length === 0) {
    return 0;
  }

  return conditions.filter((condition) => checkSingleCondition(condition, gameState)).length;
}
