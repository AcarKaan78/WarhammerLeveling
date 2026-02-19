'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameContext } from '@/context/game-context';
import { PsychicTree } from '@/components/game/psychic-tree';
import { Loading } from '@/components/ui/loading';

export default function PsychicPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();
  const [unlockedPowers, setUnlockedPowers] = useState<string[]>([]);
  const [unlocking, setUnlocking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  // Fetch unlocked powers
  useEffect(() => {
    if (!characterId) return;
    fetch(`/api/psychic?characterId=${characterId}&save=${saveName}`)
      .then(r => r.ok ? r.json() : { unlockedPowerIds: [] })
      .then(data => setUnlockedPowers(data.unlockedPowerIds ?? []))
      .catch(() => setUnlockedPowers([]));
  }, [characterId, saveName]);

  const handleUnlock = useCallback(async (powerId: string) => {
    if (!characterId || unlocking) return;
    setUnlocking(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/psychic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock',
          characterId,
          powerId,
          gameDay: 1,
          saveName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlockedPowers(prev => [...prev, powerId]);
        setFeedback('Power unlocked! The Warp answers your call.');
      } else {
        setFeedback(data.reason ?? 'Cannot unlock this power.');
      }
    } catch {
      setFeedback('Failed to unlock power.');
    } finally {
      setUnlocking(false);
    }
  }, [characterId, unlocking, saveName]);

  if (loading || !gameState) return <Loading text="Channeling the Warp..." />;

  const { character } = gameState;

  if (character.psyRating === 0) {
    return (
      <div className="max-w-2xl">
        <h2 className="font-gothic text-imperial-gold text-xl mb-4">Psychic Disciplines</h2>
        <div className="text-parchment-dark text-sm text-center py-12 border border-panel-light rounded-sm bg-panel">
          <p>You are not a psyker.</p>
          <p className="text-xs mt-2">Only characters with the Outcast Psyker background can access psychic powers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {feedback && (
        <div className={`mb-4 p-3 rounded-sm border text-sm ${
          feedback.includes('unlocked')
            ? 'border-sanity-stable/50 text-sanity-stable bg-sanity-stable/10'
            : 'border-blood/50 text-blood bg-blood/10'
        }`}>
          {feedback}
        </div>
      )}
      <PsychicTree
        unlockedPowers={unlockedPowers}
        psyRating={character.psyRating}
        onUnlock={handleUnlock}
      />
      {unlocking && (
        <div className="mt-2 text-xs text-corruption-glow animate-pulse">Channeling the Warp...</div>
      )}
    </div>
  );
}
