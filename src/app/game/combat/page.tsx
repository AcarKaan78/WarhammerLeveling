'use client';

import { useEffect, useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { CombatArena } from '@/components/game/combat-arena';
import { Loading } from '@/components/ui/loading';

export default function CombatPage() {
  const { gameState, loading, characterId, saveName, refresh, setCharacterId } = useGameContext();
  const [combatResult, setCombatResult] = useState<unknown>(null);

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (loading || !gameState) return <Loading text="Preparing for combat..." />;

  if (combatResult) {
    const result = combatResult as { victory: boolean; xpEarned: number; description: string };
    return (
      <div className="max-w-2xl space-y-4">
        <h2 className={`font-gothic text-xl ${result.victory ? 'text-imperial-gold' : 'text-blood'}`}>
          {result.victory ? 'Victory' : 'Defeat'}
        </h2>
        <p className="text-parchment text-sm">{result.description}</p>
        <p className="text-sm text-imperial-gold">+{result.xpEarned} XP</p>
        <button
          onClick={() => { setCombatResult(null); refresh(); }}
          className="px-4 py-2 border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/10"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-gothic text-imperial-gold text-xl mb-4">Combat</h2>

      <div className="text-parchment-dark text-sm text-center py-12 border border-panel-light rounded-sm bg-panel">
        <p>No active combat encounter.</p>
        <p className="text-xs mt-2">Combat encounters are triggered through story choices and events.</p>
      </div>

      {/* When combat is active via story, it would render here */}
      {/* <CombatArena characterId={characterId!} gameDay={1} onCombatEnd={setCombatResult} /> */}
    </div>
  );
}
