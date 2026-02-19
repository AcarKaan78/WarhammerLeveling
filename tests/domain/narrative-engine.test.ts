import { describe, it, expect } from 'vitest';
import {
  checkSceneConditions,
  evaluateChoiceVisibility,
  processChoiceEffects,
  substituteVariables,
  type GameStateForNarrative,
} from '@/domain/engine/narrative-engine';
import type { SceneConditions, ChoiceEffect } from '@/domain/models';

function makeGameState(overrides: Partial<GameStateForNarrative> = {}): GameStateForNarrative {
  return {
    level: 5,
    systemLevel: 2,
    flags: {},
    primaryStats: { weaponSkill: 30, ballisticSkill: 30, strength: 30, toughness: 30, agility: 30, intelligence: 30, perception: 30, willpower: 30, fellowship: 30 },
    factionReps: {},
    npcStates: {},
    sanity: 70,
    corruption: 10,
    mutations: [],
    activeQuests: [],
    completedQuests: [],
    variables: {},
    playerName: 'Test',
    thrones: 100,
    inventory: [],
    ...overrides,
  };
}

describe('Narrative Engine', () => {
  describe('checkSceneConditions', () => {
    it('should pass with no conditions', () => {
      const result = checkSceneConditions({}, makeGameState());
      expect(result.available).toBe(true);
    });

    it('should fail with insufficient level', () => {
      const conditions: SceneConditions = { minLevel: 10 };
      const result = checkSceneConditions(conditions, makeGameState({ level: 5 }));
      expect(result.available).toBe(false);
    });

    it('should pass with sufficient level', () => {
      const conditions: SceneConditions = { minLevel: 3 };
      const result = checkSceneConditions(conditions, makeGameState({ level: 5 }));
      expect(result.available).toBe(true);
    });

    it('should check required flags', () => {
      const conditions: SceneConditions = { requiredFlags: ['has_key'] };
      const fail = checkSceneConditions(conditions, makeGameState({ flags: {} }));
      expect(fail.available).toBe(false);

      const pass = checkSceneConditions(conditions, makeGameState({ flags: { has_key: true } }));
      expect(pass.available).toBe(true);
    });

    it('should check forbidden flags', () => {
      const conditions: SceneConditions = { forbiddenFlags: ['seen_scene'] };
      const pass = checkSceneConditions(conditions, makeGameState({ flags: {} }));
      expect(pass.available).toBe(true);

      const fail = checkSceneConditions(conditions, makeGameState({ flags: { seen_scene: true } }));
      expect(fail.available).toBe(false);
    });

    it('should check sanity range', () => {
      const conditions: SceneConditions = { minSanity: 50, maxSanity: 80 };
      const pass = checkSceneConditions(conditions, makeGameState({ sanity: 60 }));
      expect(pass.available).toBe(true);

      const fail = checkSceneConditions(conditions, makeGameState({ sanity: 30 }));
      expect(fail.available).toBe(false);
    });
  });

  describe('substituteVariables', () => {
    it('should replace player name', () => {
      const result = substituteVariables('Hello {playerName}', { playerName: 'Kael' });
      expect(result).toBe('Hello Kael');
    });

    it('should replace multiple variables', () => {
      const result = substituteVariables('{playerName} has {thrones} thrones', { playerName: 'Kael', thrones: 500 });
      expect(result).toBe('Kael has 500 thrones');
    });

    it('should leave unknown variables unchanged', () => {
      const result = substituteVariables('Hello {unknown}', {});
      expect(result).toBe('Hello {unknown}');
    });
  });
});
