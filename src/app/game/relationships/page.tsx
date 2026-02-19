'use client';

import { useEffect } from 'react';
import { useGameContext } from '@/context/game-context';
import { RelationshipPanel } from '@/components/game/relationship-panel';
import { Loading } from '@/components/ui/loading';

export default function RelationshipsPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (loading || !gameState) return <Loading text="Loading relationships..." />;

  return (
    <div className="max-w-2xl">
      <RelationshipPanel />
    </div>
  );
}
