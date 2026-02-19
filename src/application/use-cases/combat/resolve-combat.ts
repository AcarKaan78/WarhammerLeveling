import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { CombatState, CombatResult, Wound } from '@/domain/models';
import { CONFIG } from '@/domain/config';

export interface ResolveCombatInput {
  /** The final combat state (must be complete) */
  combatState: CombatState;
  /** The character receiving combat rewards/penalties */
  characterId: number;
  /** Current in-game day for event logging */
  gameDay: number;
}

export interface ResolveCombatOutput {
  /** The combat result summary */
  result: CombatResult;
  /** XP actually awarded to the character */
  xpAwarded: number;
  /** Wounds applied to the character */
  woundsApplied: Wound[];
  /** Sanity change applied */
  sanityChange: number;
  /** Corruption change applied */
  corruptionChange: number;
  /** Whether the character leveled up from combat XP */
  leveledUp: boolean;
  /** New level if leveled up */
  newLevel: number | null;
}

export class ResolveCombatUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: ResolveCombatInput): Promise<ResolveCombatOutput> {
    const { combatState, characterId, gameDay } = input;

    // 1. Validate combat is complete
    if (!combatState.isComplete || !combatState.result) {
      throw new Error('Combat is not yet complete');
    }

    const combatResult = combatState.result;

    // 2. Load the character
    const character = await this.characterRepo.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // 3. Apply difficulty modifiers to consequences
    const diffConfig = (CONFIG.difficulty as Record<string, {
      combatDamageTaken: number;
      sanityDrain: number;
      corruptionGain: number;
      xpGain: number;
    }>)[character.difficulty];
    const damageMod = diffConfig?.combatDamageTaken ?? 1.0;
    const sanityMod = diffConfig?.sanityDrain ?? 1.0;
    const corruptionMod = diffConfig?.corruptionGain ?? 1.0;
    const xpMod = diffConfig?.xpGain ?? 1.0;

    // 4. Calculate XP reward
    const xpAwarded = Math.floor(combatResult.xpEarned * xpMod);

    // 5. Calculate wound damage to HP
    const woundsApplied = combatResult.woundsReceived;
    let totalWoundDamage = 0;
    for (const wound of woundsApplied) {
      totalWoundDamage += Math.floor(wound.damage * damageMod);
    }

    // 6. Calculate sanity change (modified by difficulty)
    const sanityChange = Math.floor(combatResult.sanityChange * sanityMod);

    // 7. Calculate corruption change (modified by difficulty)
    const corruptionChange = Math.floor(combatResult.corruptionChange * corruptionMod);

    // 8. Calculate new character values
    const newHP = Math.max(0, character.hpCurrent - totalWoundDamage);
    const newSanity = Math.max(0, Math.min(character.sanityMax, character.sanity + sanityChange));
    const newCorruption = Math.max(
      0,
      Math.min(100, character.corruption + corruptionChange),
    );

    // 9. Apply XP and check for level up
    const newXP = character.xp + xpAwarded;
    let level = character.level;
    let xpToNext = character.xpToNext;
    let remainingXP = newXP;
    let levelsGained = 0;
    let totalStatPoints = character.freeStatPoints;
    let totalSkillPoints = character.freeSkillPoints;
    let totalPerkPoints = character.freePerkPoints;

    while (remainingXP >= xpToNext && level < CONFIG.xp.maxLevel) {
      remainingXP -= xpToNext;
      level += 1;
      levelsGained += 1;
      totalStatPoints += CONFIG.xp.statPointsPerLevel;
      totalSkillPoints += CONFIG.xp.skillPointsPerLevel;
      if (level % CONFIG.xp.perkPointEveryNLevels === 0) {
        totalPerkPoints += 1;
      }
      xpToNext = Math.floor(
        CONFIG.xp.basePerLevel * Math.pow(CONFIG.xp.scalingFactor, level - 1),
      );
    }

    const leveledUp = levelsGained > 0;

    // 10. Update the character in the repository
    await this.characterRepo.update(characterId, {
      xp: remainingXP,
      xpToNext,
      level,
      hpCurrent: newHP,
      sanity: newSanity,
      corruption: newCorruption,
      freeStatPoints: totalStatPoints,
      freeSkillPoints: totalSkillPoints,
      freePerkPoints: totalPerkPoints,
    });

    // 11. Log the combat result event
    const outcomeLabel = combatResult.victory ? 'Victory' : 'Defeat';
    const companionDeathText =
      combatResult.companionDeaths.length > 0
        ? ` Companions lost: ${combatResult.companionDeaths.join(', ')}.`
        : '';
    const levelUpText = leveledUp ? ` Leveled up to ${level}!` : '';

    await this.eventRepo.logEvent(characterId, {
      eventType: 'combat_resolved',
      title: `Combat ${outcomeLabel}`,
      description:
        `${combatResult.description}${companionDeathText}` +
        ` XP earned: ${xpAwarded}. Sanity: ${sanityChange >= 0 ? '+' : ''}${sanityChange}.` +
        ` Corruption: ${corruptionChange >= 0 ? '+' : ''}${corruptionChange}.` +
        `${levelUpText}`,
      data: {
        combatId: combatState.id,
        victory: combatResult.victory,
        xpAwarded,
        woundsReceived: woundsApplied.length,
        totalDamageTaken: totalWoundDamage,
        sanityChange,
        corruptionChange,
        companionDeaths: combatResult.companionDeaths,
        loot: combatResult.loot,
        turnsElapsed: combatState.turnNumber,
        leveledUp,
        newLevel: leveledUp ? level : null,
      },
      gameDay,
    });

    return {
      result: combatResult,
      xpAwarded,
      woundsApplied,
      sanityChange,
      corruptionChange,
      leveledUp,
      newLevel: leveledUp ? level : null,
    };
  }
}
