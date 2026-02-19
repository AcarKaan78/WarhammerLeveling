import { ICharacterRepository } from '@/domain/interfaces';
import { Character } from '@/domain/models';

export class GetCharacterUseCase {
  constructor(private characterRepo: ICharacterRepository) {}

  async execute(characterId?: number): Promise<Character | null> {
    return this.characterRepo.get(characterId);
  }
}
