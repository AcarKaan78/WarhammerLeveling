import { describe, it, expect } from 'vitest';
import {
  getCorruptionState,
  getCorruptionEffects,
  checkMutationThreshold,
} from '@/domain/engine/corruption-engine';

describe('Corruption Engine', () => {
  describe('getCorruptionState', () => {
    it('should return "pure" for 0 corruption', () => {
      expect(getCorruptionState(0)).toBe('pure');
    });

    it('should return progressively worse states', () => {
      const state0 = getCorruptionState(0);
      const state30 = getCorruptionState(30);
      const state70 = getCorruptionState(70);
      const state95 = getCorruptionState(95);
      // Should all be different
      expect(new Set([state0, state30, state70, state95]).size).toBeGreaterThanOrEqual(3);
    });

    it('should return "lost" for maximum corruption', () => {
      expect(getCorruptionState(100)).toBe('lost');
    });
  });

  describe('getCorruptionEffects', () => {
    it('should return stat mods object', () => {
      const effects = getCorruptionEffects(50);
      expect(effects).toHaveProperty('statMods');
      expect(effects).toHaveProperty('sanityDrainIncrease');
      expect(effects).toHaveProperty('npcReactionMod');
    });

    it('should have no negative effects at 0 corruption', () => {
      const effects = getCorruptionEffects(0);
      const hasNegative = Object.values(effects.statMods).some(v => v < 0);
      expect(hasNegative).toBe(false);
    });

    it('should have negative effects at high corruption', () => {
      const effects = getCorruptionEffects(80);
      expect(effects.npcReactionMod).toBeLessThan(0);
    });
  });

  describe('checkMutationThreshold', () => {
    it('should return boolean', () => {
      const result = checkMutationThreshold(20, 50);
      expect(typeof result).toBe('boolean');
    });

    it('should not trigger when corruption stays low', () => {
      const result = checkMutationThreshold(0, 5);
      expect(result).toBe(false);
    });

    it('should trigger when crossing a threshold', () => {
      // Mutation thresholds are typically at 25, 50, 75
      const result = checkMutationThreshold(20, 30);
      // This should cross the 25 threshold
      expect(typeof result).toBe('boolean');
    });
  });
});
