import { ICharacterRepository } from '@/domain/interfaces';
import { Character, Skill } from '@/domain/models';
import { calculateEffectiveSkill, calculateSkillXPToNext } from '@/domain/engine/skill-engine';
import { CONFIG } from '@/domain/config';

// ---------------------------------------------------------------------------
// Skill Repository Interface (used locally until promoted to domain/interfaces)
// ---------------------------------------------------------------------------

export interface ISkillRepository {
  getSkill(characterId: number, skillId: string): Promise<Skill | null>;
  getAllSkills(characterId: number): Promise<Skill[]>;
  updateSkill(characterId: number, skillId: string, changes: Partial<Skill>): Promise<Skill>;
  initializeSkill(characterId: number, skillId: string, name: string, category: string, governingStat1: string, governingStat2: string | null): Promise<Skill>;
}

// ---------------------------------------------------------------------------
// AllocateSkillPointUseCase
// ---------------------------------------------------------------------------

export class AllocateSkillPointUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private skillRepo: ISkillRepository,
  ) {}

  /**
   * Allocate one or more free skill points into a specific skill, raising
   * its level by the given amount.  Each point raises the skill by 1 level.
   *
   * Guards:
   *  - Character must exist
   *  - Character must have enough freeSkillPoints
   *  - Skill must exist for the character
   *  - Skill level cannot exceed CONFIG-defined maximum (defaults to 100)
   */
  async execute(
    characterId: number,
    skillId: string,
    points: number = 1,
  ): Promise<{ success: boolean; skill?: Skill; character?: Character; reason?: string }> {
    // 1. Validate character
    const character = await this.characterRepo.get(characterId);
    if (!character) return { success: false, reason: 'Character not found' };
    if (character.freeSkillPoints < points) {
      return { success: false, reason: `Not enough skill points (have ${character.freeSkillPoints}, need ${points})` };
    }

    // 2. Validate skill
    const skill = await this.skillRepo.getSkill(characterId, skillId);
    if (!skill) return { success: false, reason: `Skill "${skillId}" not found for this character` };

    // 3. Calculate new level, clamped to max
    const maxSkillLevel = (CONFIG as Record<string, any>).skills?.maxLevel ?? 100;
    const newLevel = Math.min(skill.level + points, maxSkillLevel);
    const actualGain = newLevel - skill.level;

    if (actualGain === 0) {
      return { success: false, reason: 'Skill already at maximum level' };
    }

    // 4. Calculate new XP-to-next for the resulting level
    const newXPToNext = calculateSkillXPToNext(newLevel);

    // 5. Persist changes
    const updatedSkill = await this.skillRepo.updateSkill(characterId, skillId, {
      level: newLevel,
      xpToNext: newXPToNext,
    });

    const updatedCharacter = await this.characterRepo.update(characterId, {
      freeSkillPoints: character.freeSkillPoints - actualGain,
    });

    return { success: true, skill: updatedSkill, character: updatedCharacter };
  }
}
