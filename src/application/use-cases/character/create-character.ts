import { ICharacterRepository, IFactionRepository, IAchievementRepository, IStoryRepository, IEventRepository } from '@/domain/interfaces';
import { CharacterCreationData, Character, PrimaryStats } from '@/domain/models';
import { calculateInitialStats, calculateDerivedStats } from '@/domain/engine/stats-engine';
import { calculateXPToNext } from '@/domain/engine/progression-engine';
import { CONFIG } from '@/domain/config';

export class CreateCharacterUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private factionRepo: IFactionRepository,
    private achievementRepo: IAchievementRepository,
    private storyRepo: IStoryRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(data: CharacterCreationData): Promise<Character> {
    // 1. Calculate initial stats using stats-engine
    const primaryStats = calculateInitialStats(data.origin, data.background, [data.personality1, data.personality2], data.bonusStatAllocations);
    
    // 2. Calculate derived stats for HP
    const derived = calculateDerivedStats(primaryStats, 1);
    const hpMax = 10 + Math.floor(primaryStats.toughness / 5) + Math.floor(primaryStats.willpower / 10);
    
    // 3. Get starting values from config
    const sanity = (CONFIG.sanity.startingValues as Record<string, number>)[data.background] ?? 80;
    const thrones = (CONFIG.economy.startingThrones as Record<string, number>)[data.background] ?? 50;
    const bgConfig = (CONFIG.backgrounds as Record<string, { psyRating?: number }>)[data.background];
    const psyRating = bgConfig?.psyRating ?? 0;
    const xpToNext = calculateXPToNext(1);
    
    // 4. Create character in DB
    const character = await this.characterRepo.create({
      ...data,
      primaryStats,
      hpMax,
      sanity,
      thrones,
      psyRating,
    });
    
    // 5. Initialize story state
    await this.storyRepo.initialize(character.id);
    
    // 6. Initialize all factions at rep 0
    const factionIds = Object.keys(CONFIG.factionCrossEffects);
    const factionNames: Record<string, string> = {
      imperial_authority: 'Imperial Authority',
      underworld: 'The Underworld',
      ecclesiarchy: 'Ecclesiarchy',
      chaos_cults: 'Chaos Cults',
      inquisition: 'The Inquisition',
      adeptus_mechanicus: 'Adeptus Mechanicus',
      scholastica_psykana: 'Scholastica Psykana',
    };
    for (const factionId of factionIds) {
      await this.factionRepo.initialize({
        characterId: character.id,
        factionId,
        reputation: 0,
        standing: 'neutral',
        lastChange: new Date(),
      });
    }

    // 7. Log creation event
    await this.eventRepo.logEvent(character.id, {
      eventType: 'character_created',
      title: 'Character Created',
      description: `${character.name} begins their journey.`,
      data: { origin: data.origin, background: data.background },
      gameDay: 1,
    });
    
    return character;
  }
}
