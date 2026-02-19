import {
  ICharacterRepository,
  ITaskRepository,
  IInventoryRepository,
  IStoryRepository,
  IQuestRepository,
  IFactionRepository,
  INPCRepository,
  IAchievementRepository,
  IEventRepository,
} from '@/domain/interfaces';
import { getSanityState } from '@/domain/engine/sanity-engine';
import { getCorruptionState } from '@/domain/engine/corruption-engine';
import { getAllUnlockedFeatures } from '@/domain/engine/progression-engine';
import { calculateEncumbrance, calculateEquipmentBonuses } from '@/domain/engine/inventory-engine';

export interface FullGameState {
  character: {
    id: number;
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    primaryStats: Record<string, number>;
    hp: number;
    hpMax: number;
    sanity: number;
    sanityMax: number;
    sanityState: string;
    corruption: number;
    corruptionState: string;
    thrones: number;
    psyRating: number;
    freeStatPoints: number;
    freeSkillPoints: number;
    freePerkPoints: number;
    systemLevel: number;
    systemFeatures: string[];
    difficulty: string;
  };
  tasks: Array<{
    id: number;
    name: string;
    category: string;
    difficulty: number;
    currentStreak: number;
    bestStreak: number;
    active: boolean;
  }>;
  inventory: {
    items: Array<{ instanceId: number; itemId: string; name: string; quantity: number; condition: number; equipped: boolean; slot: string | null }>;
    encumbrance: { current: number; max: number; overloaded: boolean };
    equipmentBonuses: Record<string, number>;
  };
  factions: Array<{ id: string; name: string; reputation: number }>;
  npcs: Array<{ id: string; name: string; role: string; isAlive: boolean; affinity: number; respect: number }>;
  quests: {
    active: Array<{ id: string; title: string; objectivesComplete: number; objectivesTotal: number }>;
    completed: number;
  };
  storyFlags: Record<string, boolean>;
}

export class GameStateService {
  constructor(
    private characterRepo: ICharacterRepository,
    private taskRepo: ITaskRepository,
    private inventoryRepo: IInventoryRepository,
    private storyRepo: IStoryRepository,
    private questRepo: IQuestRepository,
    private factionRepo: IFactionRepository,
    private npcRepo: INPCRepository,
    private achievementRepo: IAchievementRepository,
    private eventRepo: IEventRepository,
  ) {}

  async getFullState(characterId: number): Promise<FullGameState> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const [tasks, allItems, storyState, activeQuests, completedQuests, factions, npcs] = await Promise.all([
      this.taskRepo.getAll(characterId, true),
      this.inventoryRepo.getAll(characterId),
      this.storyRepo.get(characterId),
      this.questRepo.getAll(characterId, 'active'),
      this.questRepo.getAll(characterId, 'completed'),
      this.factionRepo.getAll(characterId),
      this.npcRepo.getAll(characterId),
    ]);

    const encumbrance = calculateEncumbrance(allItems, character.carryCapacity);
    const equippedItems = allItems.filter(i => i.equipped);
    const equipmentBonuses = calculateEquipmentBonuses(equippedItems);

    return {
      character: {
        id: character.id,
        name: character.name,
        level: character.level,
        xp: character.xp,
        xpToNext: character.xpToNext,
        primaryStats: character.primaryStats as unknown as Record<string, number>,
        hp: character.hpCurrent,
        hpMax: character.hpMax,
        sanity: character.sanity,
        sanityMax: character.sanityMax,
        sanityState: getSanityState(character.sanity),
        corruption: character.corruption,
        corruptionState: getCorruptionState(character.corruption),
        thrones: character.thrones,
        psyRating: character.psyRating,
        freeStatPoints: character.freeStatPoints,
        freeSkillPoints: character.freeSkillPoints,
        freePerkPoints: character.freePerkPoints,
        systemLevel: character.systemLevel,
        systemFeatures: getAllUnlockedFeatures(character.level),
        difficulty: character.difficulty,
      },
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        difficulty: t.difficulty,
        currentStreak: t.currentStreak,
        bestStreak: t.bestStreak,
        active: t.isActive,
      })),
      inventory: {
        items: allItems.map(i => ({
          instanceId: i.instanceId,
          itemId: i.item.id,
          name: i.item.name,
          quantity: i.quantity,
          condition: i.condition,
          equipped: i.equipped,
          slot: i.slot,
        })),
        encumbrance,
        equipmentBonuses,
      },
      factions: factions.map(f => ({ id: f.factionId, name: f.factionId, reputation: f.reputation, standing: f.standing })),
      npcs: npcs.map(n => ({
        id: n.id,
        name: n.name,
        role: n.role,
        isAlive: n.isAlive,
        affinity: n.relationship.affinity,
        respect: n.relationship.respect,
      })),
      quests: {
        active: activeQuests.map(q => ({
          id: q.id,
          title: q.title,
          objectivesComplete: q.objectives.filter(o => o.completed).length,
          objectivesTotal: q.objectives.length,
        })),
        completed: completedQuests.length,
      },
      storyFlags: storyState?.flags ?? {},
    };
  }
}
