import { describe, it, expect } from 'vitest';
import {
  calculateInitialStats,
  calculateDerivedStats,
  applyStatGain,
  getStatLevelDescription,
  performStatCheck,
} from '@/domain/engine/stats-engine';

describe('Stats Engine', () => {
  describe('calculateInitialStats', () => {
    it('should return all 9 primary stats', () => {
      const stats = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {});
      expect(stats).toHaveProperty('weaponSkill');
      expect(stats).toHaveProperty('ballisticSkill');
      expect(stats).toHaveProperty('strength');
      expect(stats).toHaveProperty('toughness');
      expect(stats).toHaveProperty('agility');
      expect(stats).toHaveProperty('intelligence');
      expect(stats).toHaveProperty('perception');
      expect(stats).toHaveProperty('willpower');
      expect(stats).toHaveProperty('fellowship');
    });

    it('should apply origin modifiers', () => {
      const baseStats = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {});
      const altStats = calculateInitialStats('feral_world', 'guard_veteran', ['stoic', 'pragmatic'], {});
      // Different origins should produce different stats
      expect(baseStats.strength).not.toBe(altStats.strength);
    });

    it('should apply bonus allocations', () => {
      const withoutBonus = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {});
      const withBonus = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], { strength: 5 });
      expect(withBonus.strength).toBe(withoutBonus.strength + 5);
    });

    it('should clamp stats to valid range', () => {
      const stats = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {
        weaponSkill: 100,
      });
      expect(stats.weaponSkill).toBeLessThanOrEqual(100);
      expect(stats.weaponSkill).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateDerivedStats', () => {
    it('should calculate derived stats from primary stats', () => {
      const primary = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {});
      const derived = calculateDerivedStats(primary, 1);
      expect(derived).toHaveProperty('initiative');
      expect(derived).toHaveProperty('movement');
      expect(derived).toHaveProperty('dodgeChance');
      expect(derived).toHaveProperty('carryCapacity');
      expect(derived.initiative).toBe(primary.agility + primary.perception);
    });
  });

  describe('applyStatGain', () => {
    it('should return positive actual gain for low stats', () => {
      const result = applyStatGain(20, 5);
      expect(result.actualGain).toBeGreaterThan(0);
      expect(result.newValue).toBe(25);
    });

    it('should apply diminishing returns at higher values', () => {
      const lowResult = applyStatGain(20, 5);
      const highResult = applyStatGain(80, 5);
      expect(highResult.actualGain).toBeLessThanOrEqual(lowResult.actualGain);
    });

    it('should not exceed max stat value', () => {
      const result = applyStatGain(98, 10);
      expect(result.newValue).toBeLessThanOrEqual(100);
    });
  });

  describe('getStatLevelDescription', () => {
    it('should return a string description', () => {
      const desc = getStatLevelDescription(25);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });

    it('should give different descriptions for different values', () => {
      const low = getStatLevelDescription(10);
      const high = getStatLevelDescription(80);
      expect(low).not.toBe(high);
    });
  });

  describe('performStatCheck', () => {
    it('should return a complete stat check result', () => {
      const result = performStatCheck(50, 0);
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('target');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('margin');
      expect(result).toHaveProperty('criticalSuccess');
      expect(result).toHaveProperty('criticalFailure');
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(100);
    });

    it('should apply difficulty modifier', () => {
      const easyResult = performStatCheck(50, 0);
      const hardResult = performStatCheck(50, 30);
      // Hard check has lower effective target
      expect(hardResult.target).toBeLessThan(easyResult.target);
    });
  });
});
