// ============================================================================
// WARHAMMER LEVELING - MASTER GAME BALANCE CONFIGURATION
// Pure TypeScript, zero external imports.
// ============================================================================

export const CONFIG = {
  // --------------------------------------------------------------------------
  // 1. XP & LEVELING
  // --------------------------------------------------------------------------
  xp: {
    basePerLevel: 100,
    scalingFactor: 1.15,
    maxLevel: 50,
    statPointsPerLevel: 2,
    skillPointsPerLevel: 3,
    perkPointEveryNLevels: 5,
  },

  // --------------------------------------------------------------------------
  // 2. TASKS
  // --------------------------------------------------------------------------
  tasks: {
    difficultyXP: {
      1: 5,
      2: 10,
      3: 15,
      5: 25,
      8: 40,
    } as Record<number, number>,

    dailyXPCapBase: 100,
    dailyXPCapPerLevel: 10,

    streakMultipliers: {
      7: 1.5,
      14: 2.0,
      30: 3.0,
      60: 4.0,
      90: 5.0,
    } as Record<number, number>,

    diminishingReturnsThreshold: 3,
    diminishingReturnsFactor: 0.5,

    categoryStats: {
      combat_training: { primary: 'weaponSkill', secondary: 'strength' },
      physical_fitness: { primary: 'strength', secondary: 'toughness' },
      shooting_practice: { primary: 'ballisticSkill', secondary: 'agility' },
      study_and_research: { primary: 'intelligence', secondary: 'willpower' },
      social_interaction: { primary: 'fellowship', secondary: 'influence' },
      meditation_and_faith: { primary: 'willpower', secondary: 'perception' },
      stealth_and_subterfuge: { primary: 'agility', secondary: 'perception' },
      crafting_and_repair: { primary: 'intelligence', secondary: 'strength' },
      leadership_duties: { primary: 'fellowship', secondary: 'willpower' },
      survival_and_exploration: { primary: 'toughness', secondary: 'perception' },
    } as Record<string, { primary: string; secondary: string }>,

    statGainPerDifficulty: {
      1: 0.1,
      2: 0.2,
      3: 0.3,
      5: 0.5,
      8: 0.8,
    } as Record<number, number>,

    secondaryStatRatio: 0.33,

    professionalThroneGain: {
      1: 2,
      2: 5,
      3: 10,
      5: 20,
      8: 40,
    } as Record<number, number>,
  },

  // --------------------------------------------------------------------------
  // 3. STATS
  // --------------------------------------------------------------------------
  stats: {
    scalingBreakpoints: [
      { threshold: 0, multiplier: 1.0 },
      { threshold: 15, multiplier: 1.0 },
      { threshold: 30, multiplier: 0.8 },
      { threshold: 45, multiplier: 0.6 },
      { threshold: 60, multiplier: 0.4 },
      { threshold: 75, multiplier: 0.25 },
      { threshold: 90, multiplier: 0.1 },
    ],

    levelDescriptions: {
      1: 'Feeble',
      10: 'Below Average',
      20: 'Average',
      30: 'Trained',
      40: 'Skilled',
      50: 'Veteran',
      60: 'Elite',
      70: 'Heroic',
      80: 'Legendary',
      90: 'Mythic',
      100: 'Transcendent',
    } as Record<number, string>,

    baseStat: 25,
    bonusAllocationPoints: 10,
    minStat: 1,
    maxStat: 100,
  },

  // --------------------------------------------------------------------------
  // 4. ORIGINS
  // --------------------------------------------------------------------------
  origins: {
    hive_world: {
      name: 'Hive World',
      statModifiers: {
        agility: 5,
        perception: 5,
        fellowship: -5,
        toughness: -5,
      } as Record<string, number>,
    },
    forge_world: {
      name: 'Forge World',
      statModifiers: {
        intelligence: 10,
        toughness: 5,
        fellowship: -10,
        willpower: -5,
      } as Record<string, number>,
    },
    agri_world: {
      name: 'Agri World',
      statModifiers: {
        strength: 5,
        toughness: 5,
        intelligence: -5,
        influence: -5,
      } as Record<string, number>,
    },
    shrine_world: {
      name: 'Shrine World',
      statModifiers: {
        willpower: 10,
        fellowship: 5,
        intelligence: -5,
        agility: -5,
      } as Record<string, number>,
    },
    feral_world: {
      name: 'Feral World',
      statModifiers: {
        weaponSkill: 10,
        strength: 5,
        intelligence: -10,
        fellowship: -5,
      } as Record<string, number>,
    },
    void_born: {
      name: 'Void Born',
      statModifiers: {
        willpower: 5,
        intelligence: 5,
        perception: 5,
        strength: -5,
        toughness: -5,
      } as Record<string, number>,
    },
  },

  // --------------------------------------------------------------------------
  // 5. BACKGROUNDS
  // --------------------------------------------------------------------------
  backgrounds: {
    guard_veteran: {
      name: 'Guard Veteran',
      statBonuses: {
        ballisticSkill: 5,
        toughness: 5,
      } as Record<string, number>,
      startingSkills: ['lasgun_proficiency', 'survival', 'discipline'],
    },
    clerk: {
      name: 'Administratum Clerk',
      statBonuses: {
        intelligence: 10,
      } as Record<string, number>,
      startingSkills: ['lore_imperium', 'linguistics', 'logic'],
    },
    underhive_scum: {
      name: 'Underhive Scum',
      statBonuses: {
        agility: 5,
        weaponSkill: 5,
      } as Record<string, number>,
      startingSkills: ['stealth', 'streetwise', 'blade_proficiency'],
    },
    scholam_student: {
      name: 'Scholam Student',
      statBonuses: {
        willpower: 5,
        perception: 5,
      } as Record<string, number>,
      startingSkills: ['interrogation', 'law_imperium', 'discipline'],
    },
    outcast_psyker: {
      name: 'Outcast Psyker',
      statBonuses: {
        willpower: 10,
      } as Record<string, number>,
      startingSkills: ['psyniscience', 'invocation', 'warp_sense'],
      psyRating: 1,
    },
    sanctioned_psyker: {
      name: 'Sanctioned Psyker',
      statBonuses: {
        willpower: 5,
        intelligence: 5,
      } as Record<string, number>,
      startingSkills: ['psyniscience', 'discipline', 'lore_imperium'],
      psyRating: 1,
    },
    merchant: {
      name: 'Merchant',
      statBonuses: {
        fellowship: 5,
        intelligence: 5,
      } as Record<string, number>,
      startingSkills: ['commerce', 'charm', 'evaluate'],
    },
    mechanicus_initiate: {
      name: 'Mechanicus Initiate',
      statBonuses: {
        intelligence: 10,
      } as Record<string, number>,
      startingSkills: ['tech_use', 'lore_mechanicus', 'cybernetics'],
    },
  },

  // --------------------------------------------------------------------------
  // 6. PERSONALITIES
  // --------------------------------------------------------------------------
  personalities: {
    stoic: {
      name: 'Stoic',
      statMods: {
        willpower: 5,
        fellowship: -5,
      } as Record<string, number>,
      special: 'Reduced sanity loss from traumatic events',
    },
    zealous: {
      name: 'Zealous',
      statMods: {
        willpower: 10,
        intelligence: -5,
      } as Record<string, number>,
      special: 'Faith tasks grant bonus XP; increased corruption resistance',
    },
    cunning: {
      name: 'Cunning',
      statMods: {
        intelligence: 5,
        perception: 5,
        fellowship: -5,
      } as Record<string, number>,
      special: 'Bonus to stealth and social manipulation tasks',
    },
    aggressive: {
      name: 'Aggressive',
      statMods: {
        weaponSkill: 5,
        strength: 5,
        agility: -5,
      } as Record<string, number>,
      special: 'Bonus damage in combat; penalty to defensive actions',
    },
    compassionate: {
      name: 'Compassionate',
      statMods: {
        fellowship: 10,
        willpower: -5,
      } as Record<string, number>,
      special: 'Relationship gains doubled; vulnerability to morale damage',
    },
    paranoid: {
      name: 'Paranoid',
      statMods: {
        perception: 10,
        fellowship: -10,
      } as Record<string, number>,
      special: 'Cannot be surprised; penalty to all social interactions',
    },
    ambitious: {
      name: 'Ambitious',
      statMods: {
        influence: 10,
        willpower: -5,
      } as Record<string, number>,
      special: 'XP gains increased by 10%; corruption gain increased by 10%',
    },
    melancholic: {
      name: 'Melancholic',
      statMods: {
        intelligence: 5,
        willpower: 5,
        strength: -5,
      } as Record<string, number>,
      special: 'Enhanced research/study XP; reduced physical task performance',
    },
  },

  // --------------------------------------------------------------------------
  // 7. SANITY
  // --------------------------------------------------------------------------
  sanity: {
    startingValues: {
      guard_veteran: 70,
      clerk: 65,
      underhive_scum: 65,
      scholam_student: 75,
      outcast_psyker: 50,
      sanctioned_psyker: 60,
      merchant: 70,
      mechanicus_initiate: 60,
    } as Record<string, number>,

    noSelfCarePenalty: 2,
    streakBreakPenalty: 2,
    maxDailyPenalty: 15,
    dailyCompletionBonusMax: 8,
    dailyCompletionCorruptionReduction: 3,
    meditationRecovery: 2,
    selfCareRecovery: 1,

    thresholds: {
      stable: 80,
      stressed: 60,
      disturbed: 40,
      breaking: 20,
      shattered: 1,
      lost: 0,
    } as Record<string, number>,

    falseNotificationChance: {
      stable: 0,
      stressed: 0.05,
      disturbed: 0.15,
      breaking: 0.30,
      shattered: 0.50,
      lost: 1.0,
    } as Record<string, number>,
  },

  // --------------------------------------------------------------------------
  // 8. CORRUPTION
  // --------------------------------------------------------------------------
  corruption: {
    thresholds: {
      pure: 0,
      untainted: 11,
      touched: 26,
      tainted: 41,
      corrupted: 61,
      damned: 76,
      lost: 91,
    } as Record<string, number>,

    mutationThresholds: [26, 41, 61, 76, 91],

    psychicUseGain: 1,
    faithDailyReduction: 0.1,
  },

  // --------------------------------------------------------------------------
  // 9. COMBAT
  // --------------------------------------------------------------------------
  combat: {
    flankingBonus: 15,
    aimBonus: 20,
    allOutAttackBonus: 10,
    allOutAttackDefensePenalty: 20,
    defensiveStanceBonus: 20,
    chargeDamageBonus: 10,
    chargeDefensePenalty: 10,
    criticalHitThreshold: 30,

    woundThresholds: {
      healthy: 1.0,
      lightly_wounded: 0.75,
      heavily_wounded: 0.50,
      critically_wounded: 0.25,
      incapacitated: 0,
    } as Record<string, number>,

    conditionPerformance: {
      pristine: 1.0,
      good: 0.95,
      worn: 0.85,
      damaged: 0.70,
      broken: 0.40,
    } as Record<string, number>,

    conditionJamChance: {
      pristine: 0,
      good: 0.01,
      worn: 0.05,
      damaged: 0.15,
      broken: 0.35,
    } as Record<string, number>,

    conditionDegradationPerUse: 2,

    hitLocationWeights: {
      head: 10,
      rightArm: 15,
      leftArm: 15,
      body: 30,
      rightLeg: 15,
      leftLeg: 15,
    } as Record<string, number>,
  },

  // --------------------------------------------------------------------------
  // 10. PSYCHIC
  // --------------------------------------------------------------------------
  psychic: {
    basePerilsChance: {
      minor: 0.05,
      moderate: 0.15,
      major: 0.30,
      extreme: 0.50,
    } as Record<string, number>,

    sanityPerilsModifier: {
      stable: 0,
      stressed: 0.05,
      disturbed: 0.10,
      breaking: 0.20,
      shattered: 0.40,
      lost: 1.0,
    } as Record<string, number>,

    corruptionPerilsModifier: 0.001,

    severityRanges: {
      negligible: { min: 1, max: 10 },
      minor: { min: 11, max: 25 },
      moderate: { min: 26, max: 50 },
      major: { min: 51, max: 75 },
      catastrophic: { min: 76, max: 100 },
    } as Record<string, { min: number; max: number }>,
  },

  // --------------------------------------------------------------------------
  // 11. ECONOMY
  // --------------------------------------------------------------------------
  economy: {
    rerollCost: 10,
    startingThrones: {
      guard_veteran: 50,
      clerk: 80,
      underhive_scum: 40,
      scholam_student: 60,
      outcast_psyker: 30,
      sanctioned_psyker: 60,
      merchant: 120,
      mechanicus_initiate: 100,
    } as Record<string, number>,

    housingRent: {
      underhive_hovel: 5,
      hab_block: 15,
      mid_hive_apartment: 40,
      upper_hive_suite: 100,
      spire_quarters: 300,
    } as Record<string, number>,

    housingUpgradeCost: {
      underhive_hovel: 0,
      hab_block: 100,
      mid_hive_apartment: 500,
      upper_hive_suite: 2000,
      spire_quarters: 10000,
    } as Record<string, number>,

    sellPriceMultiplier: 0.4,
  },

  // --------------------------------------------------------------------------
  // 12. RELATIONSHIPS
  // --------------------------------------------------------------------------
  relationships: {
    decayRatePerWeek: 1,
    romanceMinAffinity: 60,
    romanceMinRespect: 40,
  },

  // --------------------------------------------------------------------------
  // 13. SYSTEM EVOLUTION - level => unlocked features
  // --------------------------------------------------------------------------
  systemEvolution: {
    1: ['basic_tasks', 'xp_tracking', 'character_sheet'],
    3: ['task_categories', 'difficulty_levels'],
    5: ['streak_tracking', 'daily_xp_cap', 'basic_inventory'],
    7: ['stat_gains_from_tasks', 'task_history'],
    10: ['combat_system', 'basic_npcs', 'relationships'],
    12: ['equipment_conditions', 'weapon_jamming'],
    15: ['sanity_system', 'self_care_tracking', 'psychic_powers'],
    18: ['corruption_system', 'faith_mechanics'],
    20: ['advanced_combat', 'flanking', 'hit_locations', 'economy_system'],
    25: ['mutations', 'perils_of_the_warp', 'housing'],
    30: ['faction_reputation', 'cross_faction_effects'],
    35: ['advanced_npcs', 'romance', 'narrative_events'],
    40: ['difficulty_modes', 'advanced_perks'],
    45: ['endgame_content', 'legendary_equipment'],
    50: ['ascension', 'prestige_system'],
  } as Record<number, string[]>,

  // --------------------------------------------------------------------------
  // 14. DIFFICULTY
  // --------------------------------------------------------------------------
  difficulty: {
    narrative: {
      combatDamageTaken: 0.5,
      sanityDrain: 0.5,
      corruptionGain: 0.5,
      xpGain: 1.25,
      skillCheckBonus: 20,
      deathConsequence: 'respawn_no_penalty',
    },
    standard: {
      combatDamageTaken: 1.0,
      sanityDrain: 1.0,
      corruptionGain: 1.0,
      xpGain: 1.0,
      skillCheckBonus: 0,
      deathConsequence: 'respawn_with_penalty',
    },
    grimdark: {
      combatDamageTaken: 1.5,
      sanityDrain: 1.5,
      corruptionGain: 1.5,
      xpGain: 0.75,
      skillCheckBonus: -15,
      deathConsequence: 'permadeath',
    },
  },

  // --------------------------------------------------------------------------
  // 15. FACTION CROSS-EFFECTS
  // --------------------------------------------------------------------------
  factionCrossEffects: {
    imperium: {
      chaos: -2.0,
      xenos: -1.0,
      mechanicus: 0.5,
      ecclesiarchy: 0.5,
      inquisition: 0.25,
      underworld: -0.5,
    },
    chaos: {
      imperium: -2.0,
      ecclesiarchy: -2.0,
      inquisition: -2.0,
      mechanicus: -1.0,
      xenos: 0.25,
      underworld: 0.5,
    },
    mechanicus: {
      imperium: 0.5,
      chaos: -1.0,
      xenos: -0.5,
      ecclesiarchy: -0.25,
      inquisition: 0.25,
      underworld: -0.25,
    },
    ecclesiarchy: {
      imperium: 0.5,
      chaos: -2.0,
      mechanicus: -0.25,
      xenos: -1.0,
      inquisition: 0.5,
      underworld: -1.0,
    },
    inquisition: {
      imperium: 0.25,
      chaos: -2.0,
      mechanicus: 0.25,
      ecclesiarchy: 0.5,
      xenos: -1.0,
      underworld: -0.5,
    },
    xenos: {
      imperium: -1.0,
      chaos: 0.25,
      mechanicus: -0.5,
      ecclesiarchy: -1.0,
      inquisition: -1.0,
      underworld: 0.5,
    },
    underworld: {
      imperium: -0.5,
      chaos: 0.5,
      mechanicus: -0.25,
      ecclesiarchy: -1.0,
      inquisition: -0.5,
      xenos: 0.5,
    },
  } as Record<string, Record<string, number>>,
} as const;
