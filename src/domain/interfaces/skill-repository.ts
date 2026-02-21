import type { Skill } from '@/domain/models';

export interface ISkillRepository {
  getSkill(characterId: number, skillId: string): Promise<Skill | null>;
  getAllSkills(characterId: number): Promise<Skill[]>;
  updateSkill(characterId: number, skillId: string, changes: Partial<Skill>): Promise<Skill>;
  initializeSkill(
    characterId: number,
    skillId: string,
    name: string,
    category: string,
    governingStat1: string,
    governingStat2: string | null,
  ): Promise<Skill>;
  initializeAll(
    characterId: number,
    skillDefs: Array<{ id: string; name: string; category: string; governingStat1: string; governingStat2: string | null }>,
  ): Promise<void>;
}
