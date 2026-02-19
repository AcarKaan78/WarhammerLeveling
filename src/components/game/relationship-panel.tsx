'use client';

import { useGameContext } from '@/context/game-context';
import { NPCCard } from '@/components/ui/npc-card';
import { Loading } from '@/components/ui/loading';

interface RelationshipPanelProps {
  onSelectNPC?: (npcId: string) => void;
}

export function RelationshipPanel({ onSelectNPC }: RelationshipPanelProps) {
  const { gameState, loading } = useGameContext();

  if (loading || !gameState) return <Loading text="Loading relationships..." />;

  const aliveNPCs = gameState.npcs.filter(n => n.isAlive);
  const deadNPCs = gameState.npcs.filter(n => !n.isAlive);

  return (
    <div className="space-y-4">
      <h2 className="font-gothic text-imperial-gold text-lg">Relationships</h2>

      {aliveNPCs.length === 0 && (
        <div className="text-parchment-dark text-sm text-center py-8">No known NPCs.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {aliveNPCs.map(npc => (
          <NPCCard key={npc.id} npc={npc} onClick={() => onSelectNPC?.(npc.id)} />
        ))}
      </div>

      {deadNPCs.length > 0 && (
        <>
          <h3 className="font-gothic text-blood text-sm mt-6">Deceased</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {deadNPCs.map(npc => (
              <NPCCard key={npc.id} npc={npc} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
