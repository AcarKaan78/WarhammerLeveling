// ============================================================================
// USE CASE: Load Scene
// Processes a narrative scene for display: substitutes variables, applies
// unreliable narrator effects, and filters available choices.
// ============================================================================

import { IStoryRepository } from '@/domain/interfaces';
import { Scene, Choice, ChoiceVisibility } from '@/domain/models';
import {
  checkSceneConditions,
  filterAvailableChoices,
  GameStateForNarrative,
  substituteVariables,
} from '@/domain/engine/narrative-engine';
import { getSanityState, applyUnreliableNarrator } from '@/domain/engine/sanity-engine';

export interface LoadSceneResult {
  scene: Scene;
  processedBlocks: Array<{ type: string; text: string; speaker?: string; modified: boolean }>;
  availableChoices: Array<{ choice: Choice; visibility: ChoiceVisibility }>;
}

export class LoadSceneUseCase {
  constructor(private storyRepo: IStoryRepository) {}

  async execute(scene: Scene, gameState: GameStateForNarrative): Promise<LoadSceneResult> {
    // 1. Process narrative blocks - substitute variables and apply unreliable narrator
    const sanityState = getSanityState(gameState.sanity);
    const processedBlocks = scene.blocks.map(block => {
      let text = substituteVariables(block.text, gameState.variables);
      const narratorResult = applyUnreliableNarrator(text, sanityState);
      return {
        type: block.type,
        text: narratorResult.text,
        speaker: block.speaker,
        modified: narratorResult.modified,
      };
    });

    // 2. Filter available choices based on conditions, flags, stats, and system level
    const availableChoices = filterAvailableChoices(scene.choices, gameState, gameState.systemLevel);

    return { scene, processedBlocks, availableChoices };
  }
}
