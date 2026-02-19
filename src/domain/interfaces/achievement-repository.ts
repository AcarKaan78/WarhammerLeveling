export interface AchievementRecord {
  id: number;
  characterId: number;
  achievementId: string;
  name: string;
  category: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt: string | null;
}

export interface IAchievementRepository {
  initialize(data: Omit<AchievementRecord, 'id' | 'unlocked' | 'unlockedAt'>): Promise<AchievementRecord>;
  getAll(characterId: number): Promise<AchievementRecord[]>;
  unlock(characterId: number, achievementId: string): Promise<void>;
  updateProgress(characterId: number, achievementId: string, progress: number): Promise<void>;
}
