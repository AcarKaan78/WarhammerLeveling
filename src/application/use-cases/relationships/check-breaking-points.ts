import { INPCRepository, IStoryRepository, IEventRepository } from '@/domain/interfaces';
import { checkBreakingPoint } from '@/domain/engine/relationship-engine';

export interface BreakingPointResult {
  npcId: string;
  npcName: string;
  breakingPointId: string;
  consequence: string;
}

export interface CheckBreakingPointsOutput {
  triggered: BreakingPointResult[];
}

export class CheckBreakingPointsUseCase {
  constructor(
    private npcRepo: INPCRepository,
    private storyRepo: IStoryRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(characterId: number, gameDay: number): Promise<CheckBreakingPointsOutput> {
    const npcs = await this.npcRepo.getAll(characterId);
    const storyState = await this.storyRepo.get(characterId);
    const flags = storyState?.flags ?? {};
    const triggered: BreakingPointResult[] = [];

    for (const npc of npcs) {
      if (!npc.isAlive) continue;

      const result = checkBreakingPoint(npc.breakingPoints, flags);
      if (result.triggered && result.breakingPoint) {
        const bp = result.breakingPoint;

        // Mark as triggered on the NPC
        const updatedBPs = npc.breakingPoints.map(b =>
          b.id === bp.id ? { ...b, triggered: true } : b,
        );
        await this.npcRepo.update(npc.id, { breakingPoints: updatedBPs } as never);

        triggered.push({
          npcId: npc.id,
          npcName: npc.name,
          breakingPointId: bp.id,
          consequence: bp.consequence,
        });

        await this.eventRepo.logEvent(characterId, {
          eventType: 'breaking_point_triggered',
          title: 'Breaking Point!',
          description: `${npc.name}: ${bp.description}`,
          data: { npcId: npc.id, breakingPointId: bp.id, consequence: bp.consequence },
          gameDay,
        });
      }
    }

    return { triggered };
  }
}
