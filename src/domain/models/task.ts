export enum TaskCategory {
  PHYSICAL_TRAINING = 'physical_training',
  CARDIO_MOBILITY = 'cardio_mobility',
  COMBAT_TRAINING = 'combat_training',
  STUDY_LEARNING = 'study_learning',
  MEDITATION_DISCIPLINE = 'meditation_discipline',
  SOCIAL_NETWORKING = 'social_networking',
  CREATIVE_WORK = 'creative_work',
  PROFESSIONAL_WORK = 'professional_work',
  SELF_CARE = 'self_care',
  EXPLORATION = 'exploration',
}

export type TaskDifficulty = 1 | 2 | 3 | 5 | 8;

export type RecurringType = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

export interface Task {
  id: number;
  characterId: number;
  name: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  recurring: RecurringType;
  customDays?: number[];
  timeEstimateMinutes: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompleted: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface TaskCompletion {
  id: number;
  taskId: number;
  characterId: number;
  completedAt: Date;
  xpEarned: number;
  statGains: Record<string, number>;
  streakAtCompletion: number;
  bonusesApplied: string[];
  gameDay: number;
}

export interface TaskCompletionReport {
  xpEarned: number;
  xpBeforeCap: number;
  xpCapped: boolean;
  statGains: Record<string, number>;
  newStreak: number;
  bestStreak: number;
  streakMultiplier: number;
  diminishingFactor: number;
  bonuses: string[];
  penalties: string[];
  levelUp: boolean;
  newLevel: number | null;
}

export interface DailySession {
  id: number;
  characterId: number;
  date: string;
  totalXPEarned: number;
  xpCap: number;
  tasksCompleted: number;
  categoryCounts: Record<string, number>;
  streaksBroken: string[];
  gameDay: number;
}
