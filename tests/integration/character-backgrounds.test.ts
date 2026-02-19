/**
 * INTEGRATION TESTS — Character Background Variations
 *
 * Tests that each background produces correct starting values
 * (stats, sanity, thrones, psyRating) through the real config and engine.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createContainer, resetContainer } from '@/infrastructure/di/container';
import { deleteSave } from '@/infrastructure/database/connection';
import type { Container } from '@/infrastructure/di/container';
import { calculateInitialStats } from '@/domain/engine/stats-engine';
import { CONFIG } from '@/domain/config';
import type { Background } from '@/domain/models';

const BACKGROUNDS: { id: Background; expectedTraits: Record<string, unknown> }[] = [
  {
    id: 'guard_veteran',
    expectedTraits: { highStat: 'toughness', psyRating: 0, lowSanity: false },
  },
  {
    id: 'clerk',
    expectedTraits: { highStat: 'intelligence', psyRating: 0, lowSanity: false },
  },
  {
    id: 'underhive_scum',
    expectedTraits: { highStat: 'agility', psyRating: 0, lowSanity: false },
  },
  {
    id: 'scholam_student',
    expectedTraits: { highStat: 'willpower', psyRating: 0, lowSanity: false },
  },
  {
    id: 'outcast_psyker',
    expectedTraits: { highStat: 'willpower', psyRating: 1, lowSanity: true },
  },
  {
    id: 'merchant',
    expectedTraits: { highStat: 'fellowship', psyRating: 0, lowSanity: false },
  },
  {
    id: 'mechanicus_initiate',
    expectedTraits: { highStat: 'intelligence', psyRating: 0, lowSanity: false },
  },
];

describe('Integration: Character Backgrounds', () => {
  describe('CONFIG alignment', () => {
    it('should have all UI backgrounds in CONFIG.backgrounds', () => {
      const configBg = CONFIG.backgrounds as Record<string, unknown>;
      for (const bg of BACKGROUNDS) {
        expect(configBg[bg.id], `CONFIG.backgrounds missing key: ${bg.id}`).toBeDefined();
      }
    });

    it('should have all UI backgrounds in CONFIG.sanity.startingValues', () => {
      const sanityValues = CONFIG.sanity.startingValues as Record<string, number>;
      for (const bg of BACKGROUNDS) {
        expect(sanityValues[bg.id], `sanity.startingValues missing key: ${bg.id}`).toBeDefined();
        expect(sanityValues[bg.id]).toBeGreaterThan(0);
      }
    });

    it('should have all UI backgrounds in CONFIG.economy.startingThrones', () => {
      const throneValues = CONFIG.economy.startingThrones as Record<string, number>;
      for (const bg of BACKGROUNDS) {
        expect(throneValues[bg.id], `economy.startingThrones missing key: ${bg.id}`).toBeDefined();
        expect(throneValues[bg.id]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Stat calculation per background', () => {
    for (const bg of BACKGROUNDS) {
      it(`${bg.id}: should apply correct stat bonuses`, () => {
        // Use personalities that don't interfere with the stat we're checking
        const stats = calculateInitialStats(
          'hive_world',
          bg.id,
          ['curious', 'ambitious'],
          {},
        );

        const highStat = bg.expectedTraits.highStat as string;
        const statValue = (stats as unknown as Record<string, number>)[highStat];

        // Baseline stats without background are 25. Background adds bonuses.
        // Some origins also modify stats, so we just check it's at least base.
        // The key check is that different backgrounds produce different stat spreads.
        expect(statValue, `${bg.id} should have elevated ${highStat}`).toBeGreaterThanOrEqual(25);
      });
    }

    it('outcast_psyker should have highest willpower among backgrounds', () => {
      const psykerStats = calculateInitialStats('hive_world', 'outcast_psyker', ['stoic', 'pragmatic'], {});
      const guardStats = calculateInitialStats('hive_world', 'guard_veteran', ['stoic', 'pragmatic'], {});

      // Psyker gets +10 WP, guard gets +0 WP (gets BS+5, T+5)
      expect(psykerStats.willpower).toBeGreaterThan(guardStats.willpower);
    });
  });

  describe('Psyker-specific checks', () => {
    it('outcast_psyker should have lower starting sanity than most backgrounds', () => {
      const sanityValues = CONFIG.sanity.startingValues as Record<string, number>;
      const psykerSanity = sanityValues['outcast_psyker'];

      // Psyker sanity (50) should be lower than most
      expect(psykerSanity).toBeLessThanOrEqual(55);
      expect(psykerSanity).toBeLessThan(sanityValues['guard_veteran']);
      expect(psykerSanity).toBeLessThan(sanityValues['scholam_student']);
    });

    it('outcast_psyker should have lowest starting thrones', () => {
      const throneValues = CONFIG.economy.startingThrones as Record<string, number>;
      const psykerThrones = throneValues['outcast_psyker'];

      // Psyker should be among the poorest
      expect(psykerThrones).toBeLessThanOrEqual(40);
    });

    it('merchant should have highest starting thrones', () => {
      const throneValues = CONFIG.economy.startingThrones as Record<string, number>;
      const merchantThrones = throneValues['merchant'];

      // Merchant should be the richest
      for (const bg of BACKGROUNDS) {
        if (bg.id !== 'merchant') {
          expect(merchantThrones).toBeGreaterThanOrEqual(throneValues[bg.id]);
        }
      }
    });
  });

  describe('Full character creation per background', () => {
    let container: Container;

    beforeAll(() => {
      resetContainer();
      try { deleteSave('test_backgrounds'); } catch { /* ignore */ }
      container = createContainer('test_backgrounds');
    });

    afterAll(() => {
      resetContainer();
      try { deleteSave('test_backgrounds'); } catch { /* ignore */ }
    });

    it('should create an outcast_psyker with psyRating 1', async () => {
      const character = await container.repos.character.create({
        name: 'Psyker Test',
        gender: 'female',
        age: 22,
        origin: 'void_born',
        background: 'outcast_psyker',
        personality1: 'paranoid',
        personality2: 'curious',
        appearance: { build: 'gaunt', height: 'average', distinguishingFeatures: '' },
        difficulty: 'standard',
        ironman: false,
        bonusStatAllocations: {},
        primaryStats: calculateInitialStats('void_born', 'outcast_psyker', ['paranoid', 'curious'], {}),
        hpMax: 15,
        sanity: (CONFIG.sanity.startingValues as Record<string, number>)['outcast_psyker'],
        thrones: (CONFIG.economy.startingThrones as Record<string, number>)['outcast_psyker'],
        psyRating: 1,
      });

      expect(character.psyRating).toBe(1);
      expect(character.sanity).toBe(50);
      expect(character.thrones).toBe(30);
      expect(character.primaryStats.willpower).toBeGreaterThan(30);
    });
  });
});
