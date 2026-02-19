import { FactionReputation } from '@/domain/models';

export interface IFactionRepository {
  initialize(data: FactionReputation): Promise<FactionReputation>;
  get(characterId: number, factionId: string): Promise<FactionReputation | null>;
  getAll(characterId: number): Promise<FactionReputation[]>;
  updateReputation(characterId: number, factionId: string, reputation: number): Promise<void>;
  setStanding(characterId: number, factionId: string, standing: string): Promise<void>;
}
