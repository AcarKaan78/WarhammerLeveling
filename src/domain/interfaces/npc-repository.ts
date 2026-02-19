import { NPC, RelationshipDimensions } from '@/domain/models';

export interface INPCRepository {
  create(characterId: number, data: Omit<NPC, 'lastInteraction'>): Promise<NPC>;
  getById(id: string): Promise<NPC | null>;
  getAll(characterId: number): Promise<NPC[]>;
  update(id: string, changes: Partial<NPC>): Promise<NPC>;
  delete(id: string): Promise<void>;
  updateRelationship(id: string, changes: Partial<RelationshipDimensions>): Promise<void>;
}
