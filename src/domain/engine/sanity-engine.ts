// ============================================================================
// SANITY ENGINE -- Pure functions for sanity mechanics & unreliable narrator
// ============================================================================

import { SanityState, NightmareResult } from '@/domain/models';
import { CONFIG } from '@/domain/config';
import { chance, rollDie } from './dice';

// ----------------------------------------------------------------------------
// getSanityState
// ----------------------------------------------------------------------------

export function getSanityState(sanityValue: number): SanityState {
  if (sanityValue >= 80) return 'stable';
  if (sanityValue >= 60) return 'stressed';
  if (sanityValue >= 40) return 'disturbed';
  if (sanityValue >= 20) return 'breaking';
  if (sanityValue >= 1) return 'shattered';
  return 'lost';
}

// ----------------------------------------------------------------------------
// calculateSanityEffects
// ----------------------------------------------------------------------------

export function calculateSanityEffects(sanityState: SanityState): {
  statPenalties: Record<string, number>;
  debuffs: string[];
} {
  switch (sanityState) {
    case 'stable':
      return { statPenalties: {}, debuffs: [] };

    case 'stressed':
      return {
        statPenalties: { willpower: -5 },
        debuffs: ['Slightly anxious'],
      };

    case 'disturbed':
      return {
        statPenalties: { willpower: -10, perception: -5 },
        debuffs: ['Disturbed sleep', 'Occasional hallucinations'],
      };

    case 'breaking':
      return {
        statPenalties: { willpower: -15, perception: -10, fellowship: -10 },
        debuffs: ['Severe anxiety', 'Frequent hallucinations', 'Trust issues'],
      };

    case 'shattered':
      return {
        statPenalties: { willpower: -20, perception: -15, fellowship: -15, intelligence: -10 },
        debuffs: ['Mental breakdown', 'Constant hallucinations', 'Paranoia', 'Impaired judgment'],
      };

    case 'lost':
      return {
        statPenalties: { willpower: -20, perception: -15, fellowship: -15, intelligence: -10 },
        debuffs: [
          'Mental breakdown',
          'Constant hallucinations',
          'Paranoia',
          'Impaired judgment',
          'Lost to madness',
        ],
      };
  }
}

// ----------------------------------------------------------------------------
// Unreliable Narrator -- word swaps & false detail insertions
// ----------------------------------------------------------------------------

const WORD_SWAPS: Array<[string, string]> = [
  ['friend', 'enemy'],
  ['safe', 'dangerous'],
  ['truth', 'lie'],
  ['light', 'darkness'],
  ['help', 'harm'],
  ['trust', 'betray'],
  ['alive', 'dead'],
  ['hope', 'despair'],
  ['smile', 'grimace'],
  ['calm', 'frantic'],
];

const FALSE_INSERTIONS: string[] = [
  '(you notice blood on your hands)',
  '(a shadow moves in the corner of your eye)',
  '(your reflection blinks independently)',
  '(the ground feels unstable beneath you)',
  '(you hear a faint scream in the distance)',
  '(your skin crawls with invisible insects)',
];

const NPC_NAME_SWAPS: string[] = [
  'a stranger',
  'someone you do not recognize',
  'a shadowy figure',
  'an old enemy',
  'a dead companion',
];

export function applyUnreliableNarrator(
  text: string,
  sanityState: SanityState,
): { text: string; modified: boolean } {
  const chanceByState: Record<SanityState, number> = {
    stable: 0,
    stressed: 0.05,
    disturbed: 0.15,
    breaking: 0.30,
    shattered: 0.50,
    lost: 0.50,
  };

  const probability = chanceByState[sanityState];
  if (probability === 0 || !chance(probability)) {
    return { text, modified: false };
  }

  let modifiedText = text;
  let wasModified = false;

  // Word swaps -- try each swap pair
  for (const [original, replacement] of WORD_SWAPS) {
    const regex = new RegExp(`\b${original}\b`, 'gi');
    if (regex.test(modifiedText) && chance(0.5)) {
      modifiedText = modifiedText.replace(regex, replacement);
      wasModified = true;
    }
  }

  // Insert false details at a random sentence boundary
  if (chance(0.4)) {
    const insertion = FALSE_INSERTIONS[Math.floor(Math.random() * FALSE_INSERTIONS.length)];
    const sentences = modifiedText.split('. ');
    if (sentences.length > 1) {
      const insertIndex = Math.floor(Math.random() * (sentences.length - 1)) + 1;
      sentences.splice(insertIndex, 0, insertion);
      modifiedText = sentences.join('. ');
    } else {
      modifiedText = modifiedText + ' ' + insertion;
    }
    wasModified = true;
  }

  // At breaking+: swap NPC-like capitalized names with other NPC names
  if (sanityState === 'breaking' || sanityState === 'shattered' || sanityState === 'lost') {
    if (chance(0.3)) {
      const nameRegex = /(?<=\s)[A-Z][a-z]{2,}/g;
      const matches = modifiedText.match(nameRegex);
      if (matches && matches.length > 0) {
        const targetName = matches[Math.floor(Math.random() * matches.length)];
        const swapName = NPC_NAME_SWAPS[Math.floor(Math.random() * NPC_NAME_SWAPS.length)];
        modifiedText = modifiedText.replace(targetName, swapName);
        wasModified = true;
      }
    }
  }

  return { text: modifiedText, modified: wasModified };
}

// ----------------------------------------------------------------------------
// generateFalseNotification
// ----------------------------------------------------------------------------

const FALSE_NOTIFICATIONS: string[] = [
  '[SYSTEM] Warning: Vital signs anomalous.',
  '[SYSTEM] Inventory updated.',
  '[SYSTEM] New quest available.',
  'You feel something watching from the shadows.',
  'A voice whispers your name.',
  '[SYSTEM] Corruption level increased.',
  'Your weapon feels heavier than before.',
  '[SYSTEM] Relationship status changed.',
  'The walls seem to breathe.',
];

export function generateFalseNotification(sanityState: SanityState): string | null {
  const probability = CONFIG.sanity.falseNotificationChance[sanityState] ?? 0;
  if (!chance(probability)) {
    return null;
  }
  return FALSE_NOTIFICATIONS[Math.floor(Math.random() * FALSE_NOTIFICATIONS.length)];
}

// ----------------------------------------------------------------------------
// calculateSanityRecovery
// ----------------------------------------------------------------------------

export function calculateSanityRecovery(
  meditationCount: number,
  selfCareCount: number,
  housingBonus: number,
): number {
  return (
    meditationCount * CONFIG.sanity.meditationRecovery +
    selfCareCount * CONFIG.sanity.selfCareRecovery +
    housingBonus
  );
}

// ----------------------------------------------------------------------------
// checkNightmare
// ----------------------------------------------------------------------------

const NIGHTMARE_DESCRIPTIONS: string[] = [
  'You dream of endless corridors dripping with blood, each turn revealing another dead end.',
  'A faceless figure stands over your bed, whispering secrets in a language that burns your mind.',
  'You are drowning in a sea of writhing bodies, their hands pulling you deeper into the abyss.',
  'The Emperor on the Golden Throne turns His gaze upon you, and you feel utterly unworthy.',
  'Your skin peels away revealing something inhuman underneath, and you cannot stop smiling.',
  'The warp opens before you like a great maw, and something inside it knows your name.',
  'You watch yourself commit unspeakable acts, powerless to intervene, while a daemon laughs.',
  'Every person you have ever known stands in judgement, their eyes hollow and accusing.',
];

export function checkNightmare(sanityState: SanityState): NightmareResult {
  const probabilityByState: Record<SanityState, number> = {
    stable: 0,
    stressed: 0.05,
    disturbed: 0.15,
    breaking: 0.30,
    shattered: 0.50,
    lost: 0.50,
  };

  const probability = probabilityByState[sanityState];

  if (!chance(probability)) {
    return {
      hasNightmare: false,
      sanityLoss: 0,
      description: null,
      effects: {},
    };
  }

  const sanityLoss = rollDie(5);
  const description =
    NIGHTMARE_DESCRIPTIONS[Math.floor(Math.random() * NIGHTMARE_DESCRIPTIONS.length)];

  return {
    hasNightmare: true,
    sanityLoss,
    description,
    effects: { disturbedSleep: true, sanityLoss },
  };
}
