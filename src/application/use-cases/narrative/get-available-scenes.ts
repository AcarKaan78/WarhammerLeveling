import { Scene } from '@/domain/models';
import { checkSceneConditions, type GameStateForNarrative } from '@/domain/engine/narrative-engine';

export interface AvailableScene {
  id: string;
  title: string;
  chapter: string;
  isHub: boolean;
  tags: string[];
}

export class GetAvailableScenesUseCase {
  async execute(allScenes: Scene[], gameState: GameStateForNarrative): Promise<AvailableScene[]> {
    const available: AvailableScene[] = [];

    for (const scene of allScenes) {
      const result = checkSceneConditions(scene.conditions, gameState);
      if (result.available) {
        available.push({
          id: scene.id,
          title: scene.title,
          chapter: scene.chapter,
          isHub: scene.isHub,
          tags: scene.tags,
        });
      }
    }

    return available;
  }
}
