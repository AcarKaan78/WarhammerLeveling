import { describe, it, expect } from 'vitest';
import {
  initializeCombat,
  calculateInitiative,
  resolveAction,
} from '@/domain/engine/combat-engine';
import { CombatAction } from '@/domain/models';
import type { Combatant } from '@/domain/models';

function makeTestCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'player',
    name: 'Test Player',
    isPlayer: true,
    isCompanion: false,
    hp: 30,
    hpMax: 30,
    primaryStats: {
      weaponSkill: 40,
      ballisticSkill: 35,
      strength: 30,
      toughness: 30,
      agility: 30,
      intelligence: 25,
      perception: 30,
      willpower: 25,
      fellowship: 20,
    },
    weapon: { name: 'Combat Knife', damage: 6, accuracy: 0, armorPenetration: 0, range: 'melee', rateOfFire: 1, condition: 100 },
    armor: { name: 'Flak Vest', protection: 3, locations: ['body'] },
    wounds: [],
    statusEffects: [],
    initiative: 0,
    position: 0,
    isAiming: false,
    isDefending: false,
    isOverwatching: false,
    ...overrides,
  };
}

function makeEnemy(overrides: Partial<Combatant> = {}): Combatant {
  return makeTestCombatant({
    id: 'enemy_1',
    name: 'Test Enemy',
    isPlayer: false,
    aiType: 'aggressive',
    ...overrides,
  });
}

describe('Combat Engine', () => {
  describe('calculateInitiative', () => {
    it('should return a positive number', () => {
      const combatant = makeTestCombatant();
      const init = calculateInitiative(combatant);
      expect(init).toBeGreaterThan(0);
    });
  });

  describe('initializeCombat', () => {
    it('should create a valid combat state', () => {
      const player = makeTestCombatant();
      const enemy = makeEnemy();
      const state = initializeCombat(player, [], [enemy], []);

      expect(state.id).toBeTruthy();
      expect(state.turnNumber).toBe(1);
      expect(state.isComplete).toBe(false);
      expect(state.result).toBeNull();
      expect(Object.keys(state.combatants)).toHaveLength(2);
      expect(state.initiativeOrder).toHaveLength(2);
    });

    it('should include companions in combat', () => {
      const player = makeTestCombatant();
      const companion = makeTestCombatant({ id: 'companion_1', name: 'Ally', isPlayer: false, isCompanion: true });
      const enemy = makeEnemy();
      const state = initializeCombat(player, [companion], [enemy], []);

      expect(Object.keys(state.combatants)).toHaveLength(3);
    });

    it('should include environment modifiers', () => {
      const player = makeTestCombatant();
      const enemy = makeEnemy();
      const mods = [{ name: 'Darkness', effect: 'vision', modifier: -10 }];
      const state = initializeCombat(player, [], [enemy], mods);

      expect(state.environmentModifiers).toHaveLength(1);
      expect(state.environmentModifiers[0].name).toBe('Darkness');
    });
  });

  describe('resolveAction', () => {
    it('should resolve an attack action', () => {
      const player = makeTestCombatant();
      const enemy = makeEnemy();
      const state = initializeCombat(player, [], [enemy], []);

      // Find player in initiative order
      const playerId = state.initiativeOrder.find(id => state.combatants[id].isPlayer) ?? 'player';
      const enemyId = state.initiativeOrder.find(id => !state.combatants[id].isPlayer) ?? 'enemy_1';

      // Force player turn
      state.currentCombatantIndex = state.initiativeOrder.indexOf(playerId);

      const { newState, result } = resolveAction(state, playerId, CombatAction.ATTACK, enemyId);
      expect(result.actorId).toBe(playerId);
      expect(result.action).toBe(CombatAction.ATTACK);
      expect(typeof result.hit).toBe('boolean');
      expect(typeof result.description).toBe('string');
    });

    it('should resolve a defensive stance', () => {
      const player = makeTestCombatant();
      const enemy = makeEnemy();
      const state = initializeCombat(player, [], [enemy], []);
      const playerId = state.initiativeOrder.find(id => state.combatants[id].isPlayer) ?? 'player';
      state.currentCombatantIndex = state.initiativeOrder.indexOf(playerId);

      const { newState } = resolveAction(state, playerId, CombatAction.DEFENSIVE_STANCE);
      expect(newState.combatants[playerId].isDefending).toBe(true);
    });
  });
});
