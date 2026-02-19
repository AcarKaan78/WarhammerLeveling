import { describe, it, expect } from 'vitest';
import {
  getSanityState,
  calculateSanityEffects,
  applyUnreliableNarrator,
  generateFalseNotification,
  calculateSanityRecovery,
  checkNightmare,
} from '@/domain/engine/sanity-engine';

describe('Sanity Engine', () => {
  describe('getSanityState', () => {
    it('should return "stable" for high sanity', () => {
      expect(getSanityState(80)).toBe('stable');
    });

    it('should return progressively worse states for lower values', () => {
      const stable = getSanityState(80);
      const stressed = getSanityState(55);
      const shattered = getSanityState(10);
      expect(stable).not.toBe(stressed);
      expect(stressed).not.toBe(shattered);
    });

    it('should return worst state for 0 sanity', () => {
      const state = getSanityState(0);
      expect(['shattered', 'lost']).toContain(state);
    });
  });

  describe('calculateSanityEffects', () => {
    it('should return no penalties for stable sanity', () => {
      const effects = calculateSanityEffects('stable');
      expect(effects.statPenalties).toBeDefined();
      expect(Object.keys(effects.statPenalties).length).toBe(0);
      expect(effects.debuffs.length).toBe(0);
    });

    it('should return negative effects for low sanity', () => {
      const effects = calculateSanityEffects('shattered');
      const hasNegative = Object.values(effects.statPenalties).some(v => v < 0);
      expect(hasNegative).toBe(true);
      expect(effects.debuffs.length).toBeGreaterThan(0);
    });
  });

  describe('applyUnreliableNarrator', () => {
    it('should not modify text for stable sanity', () => {
      const original = 'Hello world';
      const result = applyUnreliableNarrator(original, 'stable');
      expect(result.text).toBe(original);
      expect(result.modified).toBe(false);
    });

    it('should potentially modify text for shattered sanity', () => {
      // Run multiple times since it's random
      let modified = false;
      for (let i = 0; i < 50; i++) {
        const result = applyUnreliableNarrator('The quick brown fox jumps over the lazy dog', 'shattered');
        if (result.modified) {
          modified = true;
          break;
        }
      }
      // With shattered sanity, text should eventually get modified
      expect(modified).toBe(true);
    });
  });

  describe('generateFalseNotification', () => {
    it('should return string or null', () => {
      // Since it's probability-based, run multiple times
      let gotString = false;
      for (let i = 0; i < 100; i++) {
        const notification = generateFalseNotification('disturbed');
        if (notification !== null) {
          expect(typeof notification).toBe('string');
          gotString = true;
          break;
        }
      }
      // With disturbed sanity, should eventually generate one
      expect(gotString).toBe(true);
    });

    it('should return null for stable sanity', () => {
      const notification = generateFalseNotification('stable');
      expect(notification).toBeNull();
    });
  });

  describe('calculateSanityRecovery', () => {
    it('should return positive recovery value', () => {
      const recovery = calculateSanityRecovery(1, 1, 0);
      expect(recovery).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for no activity', () => {
      const recovery = calculateSanityRecovery(0, 0, 0);
      expect(recovery).toBe(0);
    });
  });

  describe('checkNightmare', () => {
    it('should return nightmare report object', () => {
      const report = checkNightmare('disturbed');
      expect(report).toHaveProperty('hasNightmare');
      expect(typeof report.hasNightmare).toBe('boolean');
    });

    it('should never trigger nightmare for stable sanity', () => {
      // stable has 0 probability
      const report = checkNightmare('stable');
      expect(report.hasNightmare).toBe(false);
    });
  });
});
