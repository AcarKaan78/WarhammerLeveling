import { STAT_LABELS, STAT_ABBREVIATIONS } from './constants';

export function formatStatName(key: string): string {
  return STAT_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
}

export function formatStatAbbrev(key: string): string {
  return STAT_ABBREVIATIONS[key] ?? key.slice(0, 3).toUpperCase();
}

export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k XP`;
  }
  return `${xp} XP`;
}

export function formatThrones(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k Thrones`;
  }
  return `${amount} Thrones`;
}

export function formatPercentage(value: number, max: number): string {
  if (max === 0) return '0%';
  return `${Math.round((value / max) * 100)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(d);
}

export function formatStreakText(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

export function formatDifficulty(level: number): string {
  const labels: Record<number, string> = {
    1: 'Trivial',
    2: 'Easy',
    3: 'Moderate',
    5: 'Hard',
    8: 'Extreme',
  };
  return labels[level] ?? `Level ${level}`;
}

export function formatRarity(rarity: string): string {
  return rarity
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatCategory(category: string): string {
  return category
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatSanityState(state: string): string {
  const labels: Record<string, string> = {
    stable: 'Stable',
    stressed: 'Stressed',
    disturbed: 'Disturbed',
    breaking: 'Breaking',
    shattered: 'Shattered',
    lost: 'Lost',
  };
  return labels[state] ?? state;
}

export function formatCorruptionState(state: string): string {
  const labels: Record<string, string> = {
    pure: 'Pure',
    untainted: 'Untainted',
    touched: 'Touched',
    tainted: 'Tainted',
    corrupted: 'Corrupted',
    damned: 'Damned',
    lost: 'Lost',
  };
  return labels[state] ?? state;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function clampText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
