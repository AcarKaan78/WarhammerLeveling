'use client';

import { useState, useCallback } from 'react';
import type { FullGameState } from '@/application/services/game-state-service';

interface UseGameStateReturn {
  state: FullGameState | null;
  loading: boolean;
  error: string | null;
  fetchState: (characterId: number, saveName?: string) => Promise<void>;
  completeTask: (taskId: number, characterId: number, saveName?: string) => Promise<unknown>;
  startDay: (characterId: number, saveName?: string) => Promise<unknown>;
}

export function useGameState(): UseGameStateReturn {
  const [state, setState] = useState<FullGameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async (characterId: number, saveName = 'current') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/character?save=${saveName}&id=${characterId}&full=true`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch');
      setState(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTask = useCallback(async (taskId: number, characterId: number, saveName = 'current') => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', taskId, characterId, saveName }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to complete task');
    const report = await res.json();
    // Refresh state after task completion
    await fetchState(characterId, saveName);
    return report;
  }, [fetchState]);

  const startDay = useCallback(async (characterId: number, saveName = 'current') => {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start-day', characterId, saveName }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to start day');
    const briefing = await res.json();
    await fetchState(characterId, saveName);
    return briefing;
  }, [fetchState]);

  return { state, loading, error, fetchState, completeTask, startDay };
}
