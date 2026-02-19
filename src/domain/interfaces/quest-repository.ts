import { Quest, QuestStatus } from '@/domain/models';

export interface IQuestRepository {
  create(characterId: number, data: Quest): Promise<Quest>;
  getById(characterId: number, questId: string): Promise<Quest | null>;
  getAll(characterId: number, status?: QuestStatus): Promise<Quest[]>;
  update(characterId: number, questId: string, changes: Partial<Quest>): Promise<Quest>;
  delete(characterId: number, questId: string): Promise<void>;
}
