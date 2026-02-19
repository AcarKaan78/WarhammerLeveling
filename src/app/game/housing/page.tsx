'use client';

import { useEffect } from 'react';
import { useGameContext } from '@/context/game-context';
import { HousingView } from '@/components/game/housing-view';
import { Loading } from '@/components/ui/loading';

export default function HousingPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (loading || !gameState) return <Loading text="Loading housing..." />;

  return (
    <div className="max-w-2xl">
      <HousingView />
    </div>
  );
}
