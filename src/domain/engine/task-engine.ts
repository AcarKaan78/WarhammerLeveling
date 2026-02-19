// ============================================================================
// TASK ENGINE - Pure functions for task XP, streaks, and stat gains.
// No database access, no side effects.
// ============================================================================

import { CONFIG } from '@/domain/config';
import type { TaskDifficulty, RecurringType, TaskCompletionReport } from '@/domain/models';
import { applyStatGain } from './stats-engine';

// ---------------------------------------------------------------------------
// calculateTaskXP
// ---------------------------------------------------------------------------

/**
 * Calculate XP earned from a single task completion.
 * Returns a floored integer >= 0.
 */
export function calculateTaskXP(
  difficulty: TaskDifficulty,
  streakMultiplier: number,
  diminishingFactor: number,
  difficultyMod: number,
): number {
  const baseXP = CONFIG.tasks.difficultyXP[difficulty] ?? 0;
  return Math.max(0, Math.floor(baseXP * streakMultiplier * diminishingFactor * difficultyMod));
}

// ---------------------------------------------------------------------------
// calculateStreakMultiplier
// ---------------------------------------------------------------------------

export function calculateStreakMultiplier(currentStreak: number): number {
  const thresholds = Object.keys(CONFIG.tasks.streakMultipliers)
    .map(Number)
    .sort((a, b) => a - b);
  let multiplier = 1.0;
  for (const t of thresholds) {
    if (currentStreak >= t) {
      multiplier = CONFIG.tasks.streakMultipliers[t];
    }
  }
  return multiplier;
}

// ---------------------------------------------------------------------------
// calculateDiminishingFactor
// ---------------------------------------------------------------------------

export function calculateDiminishingFactor(sameCategoryCount: number): number {
  const threshold = CONFIG.tasks.diminishingReturnsThreshold;
  const factor = CONFIG.tasks.diminishingReturnsFactor;
  if (sameCategoryCount <= threshold) {
    return 1.0;
  }
  const exponent = sameCategoryCount - threshold;
  const result = Math.pow(factor, exponent);
  return Math.max(0.1, result);
}

// ---------------------------------------------------------------------------
// calculateStatGains
// ---------------------------------------------------------------------------

export function calculateStatGains(
  category: string,
  difficulty: TaskDifficulty,
  currentStatValues: Record<string, number>,
): Record<string, number> {
  const catConfig = CONFIG.tasks.categoryStats[category];
  if (!catConfig) { return {}; }
  const rawGain = CONFIG.tasks.statGainPerDifficulty[difficulty] ?? 0;
  if (rawGain === 0) { return {}; }
  const gains: Record<string, number> = {};
  const primaryStat = catConfig.primary;
  const primaryCurrent = currentStatValues[primaryStat] ?? CONFIG.stats.baseStat;
  const primaryResult = applyStatGain(primaryCurrent, rawGain);
  if (primaryResult.actualGain > 0) { gains[primaryStat] = primaryResult.actualGain; }
  const secondaryStat = catConfig.secondary;
  const secondaryRawGain = rawGain * CONFIG.tasks.secondaryStatRatio;
  const secondaryCurrent = currentStatValues[secondaryStat] ?? CONFIG.stats.baseStat;
  const secondaryResult = applyStatGain(secondaryCurrent, secondaryRawGain);
  if (secondaryResult.actualGain > 0) { gains[secondaryStat] = secondaryResult.actualGain; }
  return gains;
}

// ---------------------------------------------------------------------------
// getDailyXPCap
// ---------------------------------------------------------------------------

export function getDailyXPCap(level: number): number {
  return CONFIG.tasks.dailyXPCapBase + level * CONFIG.tasks.dailyXPCapPerLevel;
}

// ---------------------------------------------------------------------------
// isTaskDueToday
// ---------------------------------------------------------------------------

export function isTaskDueToday(
  task: { recurring: RecurringType; customDays?: number[]; createdAt: Date },
  currentDate: Date,
): boolean {
  const dayOfWeek = currentDate.getDay();
  switch (task.recurring) {
    case 'daily': return true;
    case 'weekly': { const createdDay = new Date(task.createdAt).getDay(); return dayOfWeek === createdDay; }
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom': return Array.isArray(task.customDays) && task.customDays.includes(dayOfWeek);
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// calculateStreakBreak
// ---------------------------------------------------------------------------

export function calculateStreakBreak(
  lastCompleted: Date | null,
  currentDate: Date,
  recurring: RecurringType,
): boolean {
  if (!lastCompleted) { return true; }
  const last = new Date(lastCompleted);
  const current = new Date(currentDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const currentDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffMs = currentDay.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  switch (recurring) {
    case 'daily': return diffDays > 1;
    case 'weekly': return diffDays > 7;
    case 'weekdays': return diffDays > 3;
    case 'weekends': return diffDays > 7;
    case 'custom': return diffDays > 7;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// generateCompletionReport
// ---------------------------------------------------------------------------

export function generateCompletionReport(
  xpEarned: number,
  statGains: Record<string, number>,
  streak: number,
  bonuses: string[],
  penalties: string[],
  levelUp: boolean,
  newLevel: number | null,
  xpBeforeCap: number,
  xpCapped: boolean,
  streakMultiplier: number,
  diminishingFactor: number,
  bestStreak: number,
): TaskCompletionReport {
  return {
    xpEarned, xpBeforeCap, xpCapped, statGains,
    newStreak: streak, bestStreak, streakMultiplier, diminishingFactor,
    bonuses, penalties, levelUp, newLevel,
  };
}
