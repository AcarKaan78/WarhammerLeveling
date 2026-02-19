import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import { getSystemLevelUnlocks, getAllUnlockedFeatures } from '@/domain/engine/progression-engine';

export interface SystemEvolutionOutput {
  systemLevel: number;
  allFeatures: string[];
  newFeatures: string[];
  evolved: boolean;
}

export class CheckSystemEvolutionUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number, gameDay: number): Promise<SystemEvolutionOutput> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const { systemLevel, newFeatures } = getSystemLevelUnlocks(character.level);
    const allFeatures = getAllUnlockedFeatures(character.level);
    const evolved = systemLevel > character.systemLevel;

    if (evolved) {
      await this.characterRepo.update(characterId, { systemLevel });

      await this.eventRepo.logEvent(characterId, {
        eventType: 'system_evolution',
        title: 'System Evolution',
        description: `The System evolves. New capabilities unlocked: ${newFeatures.join(', ')}.`,
        data: { systemLevel, newFeatures },
        gameDay,
      });
    }

    return { systemLevel, allFeatures, newFeatures: evolved ? newFeatures : [], evolved };
  }
}
