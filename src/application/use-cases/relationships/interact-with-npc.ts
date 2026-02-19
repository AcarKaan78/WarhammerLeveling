import { INPCRepository, IEventRepository } from '@/domain/interfaces';
import { RelationshipDimensions } from '@/domain/models';
import { calculateNPCReaction, checkRomanceEligibility } from '@/domain/engine/relationship-engine';
import { CONFIG } from '@/domain/config';

export interface InteractInput {
  characterId: number;
  npcId: string;
  dimensionChanges: Partial<RelationshipDimensions>;
  context: string;
  gameDay: number;
}

export interface InteractOutput {
  newRelationship: RelationshipDimensions;
  reaction: string;
  romanceEligible: boolean;
}

export class InteractWithNPCUseCase {
  constructor(
    private npcRepo: INPCRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: InteractInput): Promise<InteractOutput> {
    const { characterId, npcId, dimensionChanges, context, gameDay } = input;

    const npc = await this.npcRepo.getById(npcId);
    if (!npc) throw new Error('NPC not found');
    if (!npc.isAlive) throw new Error('Cannot interact with deceased NPC');

    // Apply dimension changes
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const newRelationship: RelationshipDimensions = {
      affinity: clamp(npc.relationship.affinity + (dimensionChanges.affinity ?? 0), -100, 100),
      respect: clamp(npc.relationship.respect + (dimensionChanges.respect ?? 0), -100, 100),
      fear: clamp(npc.relationship.fear + (dimensionChanges.fear ?? 0), 0, 100),
      knowledge: clamp(npc.relationship.knowledge + (dimensionChanges.knowledge ?? 0), 0, 100),
      loyalty: clamp(npc.relationship.loyalty + (dimensionChanges.loyalty ?? 0), -100, 100),
    };

    await this.npcRepo.updateRelationship(npcId, newRelationship);
    await this.npcRepo.update(npcId, { lastInteraction: new Date() });

    const reaction = calculateNPCReaction(newRelationship, context);
    const romanceEligible = checkRomanceEligibility(
      newRelationship.affinity,
      newRelationship.respect,
      npc.romanceEligible,
      npc.romanceStage,
      {},
    );

    await this.eventRepo.logEvent(characterId, {
      eventType: 'npc_interaction',
      title: 'NPC Interaction',
      description: `Interacted with ${npc.name}. Reaction: ${reaction}.`,
      data: { npcId, context, reaction, dimensionChanges },
      gameDay,
    });

    return { newRelationship, reaction, romanceEligible };
  }
}
