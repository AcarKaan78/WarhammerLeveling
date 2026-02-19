export type AchievementCategory = 'story' | 'combat' | 'social' | 'exploration' | 'discipline' | 'secret' | 'mastery';

export interface AchievementCondition {
  type: 'flag' | 'stat_min' | 'level_min' | 'kill_count' | 'quest_complete' | 'streak' | 'task_count' | 'reputation' | 'corruption_min' | 'sanity_min' | 'custom';
  target: string;
  value: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  hiddenDescription: string; // shown when locked: "???"
  category: AchievementCategory;
  conditions: AchievementCondition[];
  reward: {
    xp: number;
    title?: string;
    trait?: string;
    item?: string;
    thrones?: number;
  };
  progressive: boolean;
  maxProgress: number;
  currentProgress: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

export interface Title {
  id: string;
  name: string;
  achievementId: string;
  description: string;
  active: boolean;
}
