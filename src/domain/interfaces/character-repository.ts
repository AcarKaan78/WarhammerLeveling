import { Character, CharacterCreationData, PrimaryStats } from '@/domain/models';

export interface ICharacterRepository {
  create(data: CharacterCreationData & { primaryStats: PrimaryStats; hpMax: number; sanity: number; thrones: number; psyRating: number }): Promise<Character>;
  get(characterId?: number): Promise<Character | null>;
  update(id: number, changes: Partial<Character>): Promise<Character>;
  updateStats(id: number, statChanges: Partial<PrimaryStats>): Promise<void>;
  delete(id: number): Promise<void>;
  exists(): Promise<boolean>;
}
