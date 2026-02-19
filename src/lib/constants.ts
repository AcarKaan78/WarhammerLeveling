// UI Constants — Colors, breakpoints, animation durations

export const COLORS = {
  // Core palette
  primary: '#c9a84c',       // Imperial gold
  secondary: '#8b0000',     // Blood red
  background: '#0a0a0f',    // Deep void black
  surface: '#1a1a2e',       // Panel background
  surfaceLight: '#252545',  // Elevated surface
  border: '#333355',        // Subtle borders

  // Text
  textPrimary: '#e8e6e3',
  textSecondary: '#9a9a9a',
  textMuted: '#666666',
  textGold: '#c9a84c',

  // Stats
  hp: '#cc3333',
  hpBackground: '#3d1111',
  sanity: '#3399cc',
  sanityBackground: '#112233',
  corruption: '#9933cc',
  corruptionBackground: '#221133',
  fatigue: '#cc9933',
  fatigueBackground: '#332211',
  xp: '#33cc66',
  xpBackground: '#113322',

  // Sanity states
  sanityStable: '#33cc66',
  sanityStressed: '#cccc33',
  sanityDisturbed: '#cc9933',
  sanityBreaking: '#cc6633',
  sanityShattered: '#cc3333',
  sanityLost: '#990000',

  // Corruption states
  corruptionPure: '#33cc66',
  corruptionUntainted: '#66cc66',
  corruptionTouched: '#cccc33',
  corruptionTainted: '#cc9933',
  corruptionCorrupted: '#cc6633',
  corruptionDamned: '#cc3333',
  corruptionLost: '#660066',

  // Rarity
  rarityCommon: '#9a9a9a',
  rarityUncommon: '#33cc66',
  rarityRare: '#3399ff',
  rarityVeryRare: '#9933cc',
  rarityLegendary: '#cc9933',

  // Faction
  factionFriendly: '#33cc66',
  factionNeutral: '#cccc33',
  factionHostile: '#cc3333',

  // Combat
  combatHit: '#cc3333',
  combatMiss: '#666666',
  combatCritical: '#cc9933',
  combatHeal: '#33cc66',

  // System
  systemGreen: '#00ff41',
  systemAmber: '#ffbf00',
  systemRed: '#ff0000',
  warpPurple: '#8800ff',
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  typewriterSpeed: 30,      // ms per character
  glitchInterval: 3000,     // ms between sanity glitches
  diceRollDuration: 1500,   // ms for dice roll animation
  fadeIn: 200,
  fadeOut: 150,
  slideIn: 300,
  barFill: 800,             // stat bar fill animation
} as const;

export const STAT_LABELS: Record<string, string> = {
  weaponSkill: 'Weapon Skill',
  ballisticSkill: 'Ballistic Skill',
  strength: 'Strength',
  toughness: 'Toughness',
  agility: 'Agility',
  intelligence: 'Intelligence',
  perception: 'Perception',
  willpower: 'Willpower',
  fellowship: 'Fellowship',
};

export const STAT_ABBREVIATIONS: Record<string, string> = {
  weaponSkill: 'WS',
  ballisticSkill: 'BS',
  strength: 'S',
  toughness: 'T',
  agility: 'Ag',
  intelligence: 'Int',
  perception: 'Per',
  willpower: 'WP',
  fellowship: 'Fel',
};

export const CATEGORY_ICONS: Record<string, string> = {
  physical_training: '⚔',
  cardio_mobility: '🏃',
  combat_training: '🗡',
  study_learning: '📚',
  meditation_discipline: '🧘',
  social_networking: '🤝',
  creative_work: '🎨',
  professional_work: '💼',
  self_care: '❤',
  exploration: '🗺',
};
