'use client';

import { useEffect, useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { StoryRenderer } from '@/components/game/story-renderer';
import { Loading } from '@/components/ui/loading';

export default function StoryPage() {
  const { gameState, loading: gameLoading, characterId, saveName, setCharacterId } = useGameContext();

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (gameLoading || !gameState) return <Loading text="Loading story..." />;
  if (!characterId) return <Loading text="Loading character..." />;

  return (
    <div className="max-w-2xl">
      <StoryRenderer
        characterId={characterId}
        gameDay={1}
        sanityState={gameState.character.sanityState}
        saveName={saveName}
      />
    </div>
  );
}
