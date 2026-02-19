export interface PsychicPowerRecord {
  id: number;
  characterId: number;
  powerId: string;
  discipline: string;
  name: string;
  tier: number;
  unlocked: boolean;
  timesUsed: number;
}

export interface IPsychicRepository {
  getAll(characterId: number): Promise<PsychicPowerRecord[]>;
  getUnlocked(characterId: number): Promise<PsychicPowerRecord[]>;
  unlock(characterId: number, powerId: string, discipline: string, name: string, tier: number): Promise<void>;
  incrementUsage(characterId: number, powerId: string): Promise<void>;
  isUnlocked(characterId: number, powerId: string): Promise<boolean>;
}
