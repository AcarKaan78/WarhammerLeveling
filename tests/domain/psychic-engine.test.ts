import { describe, it, expect } from 'vitest';
import {
  calculatePerilsChance,
  resolvePowerUse,
} from '@/domain/engine/psychic-engine';
import type { PsychicPower } from '@/domain/models';

describe('Psychic Engine', () => {
  describe('calculatePerilsChance', () => {
    it('should return a number between 0 and 1', () => {
      const perilsChance = calculatePerilsChance(1, 'stable', 0, 0);
      expect(perilsChance).toBeGreaterThanOrEqual(0);
      expect(perilsChance).toBeLessThanOrEqual(1);
    });

    it('should increase with tier', () => {
      const tier1 = calculatePerilsChance(1, 'stable', 0, 0);
      const tier4 = calculatePerilsChance(4, 'stable', 0, 0);
      expect(tier4).toBeGreaterThanOrEqual(tier1);
    });

    it('should be affected by corruption', () => {
      const lowCorrupt = calculatePerilsChance(2, 'stable', 10, 0);
      const highCorrupt = calculatePerilsChance(2, 'stable', 80, 0);
      expect(highCorrupt).toBeGreaterThanOrEqual(lowCorrupt);
    });
  });

  describe('resolvePowerUse', () => {
    it('should return a power use result', () => {
      const power: PsychicPower = {
        id: 'py_flame_breath',
        discipline: 'pyromancy',
        name: 'Flame Breath',
        tier: 1,
        description: 'Breathe warp fire',
        contexts: ['combat'],
        difficulty: 10,
        effects: { combat: { damage: 10, range: 'short' } },
        prerequisites: [],
        basePerilsModifier: 0.01,
      };

      const result = resolvePowerUse(power, 40, 10, []);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('perilsResult');
      expect(result).toHaveProperty('corruptionGained');
      expect(result).toHaveProperty('effectDescription');
      expect(typeof result.success).toBe('boolean');
      expect(result.perilsResult).toHaveProperty('occurred');
    });
  });
});
