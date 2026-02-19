export type EventCategory = 'daily' | 'weekly' | 'crisis' | 'personal' | 'faction' | 'random';

export interface EventCondition {
  minLevel?: number;
  maxLevel?: number;
  flags?: string[];
  forbiddenFlags?: string[];
  minSanity?: number;
  maxSanity?: number;
  minCorruption?: number;
  maxCorruption?: number;
  factionRep?: Record<string, { min?: number; max?: number }>;
  season?: string;
}

export interface EventOutcome {
  description: string;
  effects: {
    xp?: number;
    thrones?: number;
    sanity?: number;
    corruption?: number;
    factionRep?: Record<string, number>;
    items?: string[];
    flags?: string[];
    startQuest?: string;
    triggerCombat?: { enemyIds: string[] };
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  conditions: EventCondition;
  weight: number; // higher = more likely
  outcomes: EventOutcome[];
  choices?: Array<{
    text: string;
    outcome: EventOutcome;
    skillCheck?: { stat: string; difficulty: number };
  }>;
  unique: boolean; // can only happen once
  cooldownDays: number;
}

export interface EventPool {
  category: EventCategory;
  events: GameEvent[];
  lastUsedIds: Record<string, number>; // eventId => game day last used
}
