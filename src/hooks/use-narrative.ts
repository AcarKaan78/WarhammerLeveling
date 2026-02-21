'use client';

import { useState, useCallback } from 'react';
import type { Scene } from '@/domain/models';

interface NarrativeState {
  currentScene: Scene | null;
  availableScenes: Scene[];
  choiceResult: unknown | null;
}

interface UseNarrativeReturn extends NarrativeState {
  loading: boolean;
  error: string | null;
  loadScene: (sceneId: string, characterId: number, saveName?: string) => Promise<void>;
  loadAvailableScenes: (characterId: number, saveName?: string) => Promise<void>;
  makeChoice: (sceneId: string, choiceId: string, characterId: number, gameDay: number, saveName?: string) => Promise<unknown>;
  rerollChoice: (characterId: number, rerollContext: unknown, saveName?: string) => Promise<unknown>;
  clearScene: () => void;
  clearChoiceResult: () => void;
}

export function useNarrative(): UseNarrativeReturn {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [availableScenes, setAvailableScenes] = useState<Scene[]>([]);
  const [choiceResult, setChoiceResult] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScene = useCallback(async (sceneId: string, characterId: number, saveName = 'current') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/narrative?sceneId=${sceneId}&characterId=${characterId}&save=${saveName}`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load scene');
      setCurrentScene(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailableScenes = useCallback(async (characterId: number, saveName = 'current') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/narrative?characterId=${characterId}&save=${saveName}`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load scenes');
      setAvailableScenes(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const makeChoice = useCallback(async (
    sceneId: string,
    choiceId: string,
    characterId: number,
    gameDay: number,
    saveName = 'current',
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, sceneId, choiceId, gameDay, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to execute choice');
      const result = await res.json();
      setChoiceResult(result);
      // Don't auto-navigate — let the renderer show consequences first
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const rerollChoice = useCallback(async (
    characterId: number,
    rerollContext: unknown,
    saveName = 'current',
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/narrative', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, rerollContext, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to reroll');
      const result = await res.json();
      setChoiceResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearScene = useCallback(() => {
    setCurrentScene(null);
    setChoiceResult(null);
  }, []);

  const clearChoiceResult = useCallback(() => {
    setChoiceResult(null);
  }, []);

  return {
    currentScene, availableScenes, choiceResult,
    loading, error,
    loadScene, loadAvailableScenes, makeChoice, rerollChoice, clearScene, clearChoiceResult,
  };
}
