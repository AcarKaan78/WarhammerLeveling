'use client';

import { useEffect } from 'react';
import { useGameContext } from '@/context/game-context';
import { QuestLog } from '@/components/game/quest-log';
import { Loading } from '@/components/ui/loading';

export default function JournalPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (loading || !gameState) return <Loading text="Loading journal..." />;

  return (
    <div className="max-w-2xl">
      <QuestLog />
    </div>
  );
}
