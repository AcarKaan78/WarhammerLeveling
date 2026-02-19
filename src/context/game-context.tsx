'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { FullGameState } from '@/application/services/game-state-service';

interface GameContextValue {
  gameState: FullGameState | null;
  loading: boolean;
  error: string | null;
  saveName: string;
  characterId: number | null;
  refresh: () => Promise<void>;
  setSaveName: (name: string) => void;
  setCharacterId: (id: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<FullGameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('current');
  const [characterId, setCharacterId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/character?save=${saveName}&id=${characterId}&full=true`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to load game state');
      }
      const data = await res.json();
      setGameState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [characterId, saveName]);

  useEffect(() => {
    if (characterId) {
      refresh();
    }
  }, [characterId, saveName, refresh]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        loading,
        error,
        saveName,
        characterId,
        refresh,
        setSaveName,
        setCharacterId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
