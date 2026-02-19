// ============================================================================
// CALENDAR ENGINE - Pure functions for date tracking, game-day calculation,
// and time-based triggers.  No database access, no side effects.
// ============================================================================

import type { Quest } from '@/domain/models';

// ---------------------------------------------------------------------------
// Helper: strip time portion, returning a Date at midnight local time.
// ---------------------------------------------------------------------------

function toMidnight(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ---------------------------------------------------------------------------
// Helper: count whole calendar days between two dates.
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const aDay = toMidnight(a).getTime();
  const bDay = toMidnight(b).getTime();
  return Math.floor((bDay - aDay) / msPerDay);
}

// ---------------------------------------------------------------------------
// isNewDay
// ---------------------------------------------------------------------------

/**
 * Determine whether currentDate is a different calendar day from lastPlayed.
 * Compares year, month, and day only (ignores time).
 */
export function isNewDay(lastPlayed: Date, currentDate: Date): boolean {
  const last = new Date(lastPlayed);
  const current = new Date(currentDate);
  return (
    last.getFullYear() !== current.getFullYear() ||
    last.getMonth() !== current.getMonth() ||
    last.getDate() !== current.getDate()
  );
}

// ---------------------------------------------------------------------------
// getGameDay
// ---------------------------------------------------------------------------

/**
 * Calculate the current game day - the number of calendar days since the
 * character was created, starting at 1. Day 1 is the creation day itself.
 */
export function getGameDay(createdAt: Date, currentDate: Date): number {
  return daysBetween(createdAt, currentDate) + 1;
}

// ---------------------------------------------------------------------------
// isUpkeepDue
// ---------------------------------------------------------------------------

/**
 * Upkeep (rent, companion maintenance, etc.) is due every 30 game days.
 * Returns true when gameDay has crossed a 30-day boundary since the last
 * upkeep was paid.
 */
export function isUpkeepDue(gameDay: number, lastUpkeepDay: number): boolean {
  return gameDay - lastUpkeepDay >= 30;
}

// ---------------------------------------------------------------------------
// checkQuestDeadlines
// ---------------------------------------------------------------------------

/**
 * Return all quests whose deadline has been reached or passed and that are
 * still in active status. Quests with deadline === null never expire.
 */
export function checkQuestDeadlines(quests: Quest[], gameDay: number): Quest[] {
  return quests.filter(
    (q) =>
      q.status === 'active' &&
      q.deadline !== null &&
      q.deadline <= gameDay,
  );
}
