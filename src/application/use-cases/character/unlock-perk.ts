import { ICharacterRepository } from '@/domain/interfaces';
import { Character, Perk, PerkPrerequisites } from '@/domain/models';
import { checkPerkPrerequisites, PerkEligibility } from '@/domain/engine/progression-engine';

// ---------------------------------------------------------------------------
// Perk Repository Interface (used locally until promoted to domain/interfaces)
// ---------------------------------------------------------------------------

export interface IPerkRepository {
  getPerk(characterId: number, perkId: string): Promise<Perk | null>;
  getAllPerks(characterId: number): Promise<Perk[]>;
  getUnlockedPerks(characterId: number): Promise<Perk[]>;
  unlockPerk(characterId: number, perkId: string): Promise<Perk>;
}

// ---------------------------------------------------------------------------
// UnlockPerkUseCase
// ---------------------------------------------------------------------------

export class UnlockPerkUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private perkRepo: IPerkRepository,
  ) {}

  /**
   * Attempt to unlock a perk for the character.
   *
   * Workflow:
   *  1. Validate character exists and has a free perk point
   *  2. Validate the perk exists and is not already unlocked
   *  3. Gather character's currently unlocked perks
   *  4. Run prerequisite check via progression-engine (level, stats, prior perks)
   *  5. Deduct perk point and persist the unlock
   */
  async execute(
    characterId: number,
    perkId: string,
  ): Promise<{ success: boolean; perk?: Perk; character?: Character; reason?: string }> {
    // 1. Validate character
    const character = await this.characterRepo.get(characterId);
    if (!character) return { success: false, reason: 'Character not found' };
    if (character.freePerkPoints < 1) {
      return { success: false, reason: 'No free perk points available' };
    }

    // 2. Validate perk
    const perk = await this.perkRepo.getPerk(characterId, perkId);
    if (!perk) return { success: false, reason: `Perk "${perkId}" not found` };
    if (perk.unlocked) return { success: false, reason: `Perk "${perk.name}" is already unlocked` };

    // 3. Gather currently unlocked perks for prerequisite check
    const unlockedPerks = await this.perkRepo.getUnlockedPerks(characterId);
    const unlockedPerkIds = unlockedPerks.map((p) => p.id);

    // 4. Build a flat stat map from primaryStats for the engine
    const statsMap: Record<string, number> = {
      weaponSkill: character.primaryStats.weaponSkill,
      ballisticSkill: character.primaryStats.ballisticSkill,
      strength: character.primaryStats.strength,
      toughness: character.primaryStats.toughness,
      agility: character.primaryStats.agility,
      intelligence: character.primaryStats.intelligence,
      perception: character.primaryStats.perception,
      willpower: character.primaryStats.willpower,
      fellowship: character.primaryStats.fellowship,
    };

    // 5. Check prerequisites via the pure domain engine
    const eligibility: PerkEligibility = checkPerkPrerequisites(
      perk.prerequisites,
      unlockedPerkIds,
      statsMap,
      character.level,
    );

    if (!eligibility.eligible) {
      return { success: false, reason: eligibility.reason ?? 'Prerequisites not met' };
    }

    // 6. Unlock the perk and deduct the point
    const unlockedPerk = await this.perkRepo.unlockPerk(characterId, perkId);
    const updatedCharacter = await this.characterRepo.update(characterId, {
      freePerkPoints: character.freePerkPoints - 1,
    });

    return { success: true, perk: unlockedPerk, character: updatedCharacter };
  }
}
