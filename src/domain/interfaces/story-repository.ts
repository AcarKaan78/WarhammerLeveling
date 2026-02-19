import { StoryState } from '@/domain/models';

export interface IStoryRepository {
  initialize(characterId: number): Promise<StoryState>;
  get(characterId: number): Promise<StoryState | null>;
  update(characterId: number, changes: Partial<StoryState>): Promise<StoryState>;
  setFlag(characterId: number, flag: string, value: boolean): Promise<void>;
  addVisitedScene(characterId: number, sceneId: string): Promise<void>;
  addChoiceHistory(characterId: number, entry: { sceneId: string; choiceId: string; timestamp: Date }): Promise<void>;
  setVariable(characterId: number, key: string, value: string | number): Promise<void>;
}
