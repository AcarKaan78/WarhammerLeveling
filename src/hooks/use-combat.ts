'use client';

import { useState, useCallback } from 'react';
import type { CombatState, CombatAction, CombatActionResult } from '@/domain/models';

interface UseCombatReturn {
  combatState: CombatState | null;
  lastResult: CombatActionResult | null;
  loading: boolean;
  error: string | null;
  isPlayerTurn: boolean;
  initCombat: (params: {
    characterId: number;
    playerCombatant: unknown;
    companions?: unknown[];
    enemies: unknown[];
    environmentModifiers?: unknown[];
    gameDay: number;
    saveName?: string;
  }) => Promise<void>;
  executeAction: (action: CombatAction, targetId?: string, params?: Record<string, unknown>) => Promise<void>;
  processAITurn: () => Promise<void>;
  resolveCombat: (characterId: number, gameDay: number, saveName?: string) => Promise<unknown>;
}

export function useCombat(): UseCombatReturn {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [lastResult, setLastResult] = useState<CombatActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlayerTurn = (() => {
    if (!combatState || combatState.isComplete) return false;
    const currentId = combatState.initiativeOrder[combatState.currentCombatantIndex];
    const current = combatState.combatants[currentId];
    return current?.isPlayer ?? false;
  })();

  const initCombat = useCallback(async (params: {
    characterId: number;
    playerCombatant: unknown;
    companions?: unknown[];
    enemies: unknown[];
    environmentModifiers?: unknown[];
    gameDay: number;
    saveName?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/combat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', ...params }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to init combat');
      setCombatState(await res.json());
      setLastResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const executeAction = useCallback(async (action: CombatAction, targetId?: string, params?: Record<string, unknown>) => {
    if (!combatState) return;
    setLoading(true);
    setError(null);
    try {
      const currentId = combatState.initiativeOrder[combatState.currentCombatantIndex];
      const res = await fetch('/api/combat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          combatState,
          actorId: currentId,
          combatAction: action,
          targetId,
          params,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to execute action');
      const data = await res.json();
      setCombatState(data.newState);
      setLastResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [combatState]);

  const processAITurn = useCallback(async () => {
    if (!combatState) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/combat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-turn', combatState }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to process AI turn');
      const data = await res.json();
      setCombatState(data.newState);
      setLastResult(data.lastResult ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [combatState]);

  const resolveCombat = useCallback(async (characterId: number, gameDay: number, saveName = 'current') => {
    if (!combatState) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/combat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', characterId, combatState, gameDay, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to resolve combat');
      const result = await res.json();
      setCombatState(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [combatState]);

  return {
    combatState, lastResult, loading, error, isPlayerTurn,
    initCombat, executeAction, processAITurn, resolveCombat,
  };
}
