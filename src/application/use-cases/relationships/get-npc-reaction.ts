import { INPCRepository } from '@/domain/interfaces';
import { calculateNPCReaction } from '@/domain/engine/relationship-engine';

export interface NPCReactionOutput {
  npcId: string;
  npcName: string;
  reaction: string;
  relationship: {
    affinity: number;
    respect: number;
    fear: number;
    knowledge: number;
    loyalty: number;
  };
}

export class GetNPCReactionUseCase {
  constructor(private npcRepo: INPCRepository) {}

  async execute(npcId: string, context: string): Promise<NPCReactionOutput> {
    const npc = await this.npcRepo.getById(npcId);
    if (!npc) throw new Error('NPC not found');

    const reaction = calculateNPCReaction(npc.relationship, context);

    return {
      npcId: npc.id,
      npcName: npc.name,
      reaction,
      relationship: { ...npc.relationship },
    };
  }
}
