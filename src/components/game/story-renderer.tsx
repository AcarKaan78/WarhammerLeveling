'use client';

import { useNarrative } from '@/hooks/use-narrative';
import { useSanityEffects } from '@/hooks/use-sanity-effects';
import { useGameContext } from '@/context/game-context';
import { CONFIG } from '@/domain/config';
import { DialogueBox } from '@/components/ui/dialogue-box';
import { ChoiceList } from '@/components/ui/choice-list';
import { ChoiceConsequences } from '@/components/ui/choice-consequences';
import { Typewriter } from '@/components/effects/typewriter';
import { Loading } from '@/components/ui/loading';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface StoryRendererProps {
  characterId: number;
  gameDay: number;
  sanityState: string;
  saveName?: string;
}

interface PendingResult {
  nextSceneId: string | null;
  notifications: string[];
  skillCheckResult?: {
    roll: number; target: number; success: boolean;
    margin: number; criticalSuccess: boolean; criticalFailure: boolean;
  };
  rerollContext?: unknown;
  hasRerolled?: boolean;
}

export function StoryRenderer({ characterId, gameDay, sanityState, saveName = 'current' }: StoryRendererProps) {
  const { currentScene, availableScenes, choiceResult, loading, error, loadScene, loadAvailableScenes, makeChoice, rerollChoice, clearChoiceResult } = useNarrative();
  const { gameState, refresh } = useGameContext();
  const { applyTextGlitch, glitchActive } = useSanityEffects(sanityState);
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const initRef = useRef(false);

  // Load available scenes on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadAvailableScenes(characterId, saveName);
    }
  }, [characterId, saveName, loadAvailableScenes]);

  // Auto-load first available scene
  useEffect(() => {
    if (!currentScene && !loading && !pendingResult && availableScenes.length > 0) {
      loadScene(availableScenes[0].id, characterId, saveName);
    }
  }, [currentScene, loading, pendingResult, availableScenes, characterId, saveName, loadScene]);

  const handleChoice = useCallback(async (choiceId: string) => {
    if (!currentScene) return;
    const result = await makeChoice(currentScene.id, choiceId, characterId, gameDay, saveName);

    if (result && typeof result === 'object') {
      const r = result as {
        nextSceneId?: string | null;
        notifications?: string[];
        skillCheckResult?: PendingResult['skillCheckResult'];
        rerollContext?: unknown;
      };

      const notifications = r.notifications ?? [];
      const hasSkillCheck = !!r.skillCheckResult;

      // Auto-continue if nothing meaningful to show (e.g. simple "continue" transitions)
      if (!hasSkillCheck && notifications.length === 0) {
        clearChoiceResult();
        refresh();
        if (r.nextSceneId) {
          await loadScene(r.nextSceneId, characterId, saveName);
        } else {
          await loadAvailableScenes(characterId, saveName);
        }
        return;
      }

      // Show consequences panel — user must click "Continue" to proceed
      setPendingResult({
        nextSceneId: r.nextSceneId ?? null,
        notifications,
        skillCheckResult: r.skillCheckResult,
        rerollContext: r.rerollContext,
      });
    }
  }, [currentScene, makeChoice, characterId, gameDay, saveName]);

  const handleReroll = useCallback(async () => {
    if (!pendingResult?.rerollContext) return;

    const result = await rerollChoice(characterId, pendingResult.rerollContext, saveName);

    if (result && typeof result === 'object') {
      const r = result as {
        nextSceneId?: string | null;
        notifications?: string[];
        skillCheckResult?: PendingResult['skillCheckResult'];
      };

      setPendingResult({
        nextSceneId: r.nextSceneId ?? null,
        notifications: r.notifications ?? [],
        skillCheckResult: r.skillCheckResult,
        hasRerolled: true,
      });

      // Refresh game context to update thrones display
      refresh();
    }
  }, [pendingResult, rerollChoice, characterId, saveName, refresh]);

  const handleContinue = useCallback(async () => {
    if (!pendingResult) return;

    const { nextSceneId } = pendingResult;
    setPendingResult(null);
    clearChoiceResult();

    // Refresh game context now (after consequences shown) so stats update
    refresh();

    if (nextSceneId) {
      await loadScene(nextSceneId, characterId, saveName);
    } else {
      // No next scene — refresh available scenes to find what's next
      await loadAvailableScenes(characterId, saveName);
    }
  }, [pendingResult, clearChoiceResult, refresh, loadScene, loadAvailableScenes, characterId, saveName]);

  if (loading && !pendingResult) return <Loading text="Loading scene..." />;
  if (error) return <div className="text-blood text-sm">{error}</div>;

  if (!currentScene && !pendingResult) {
    return (
      <div className="text-parchment-dark text-sm text-center py-12">
        <p>No scenes available at this time.</p>
        <p className="text-xs mt-2">Complete tasks and advance to unlock new story content.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${glitchActive ? 'animate-screen-glitch' : ''}`}>
      {/* Scene Title */}
      {currentScene && (
        <div className="border-b border-panel-light pb-2 mb-4">
          <h2 className="font-gothic text-imperial-gold text-lg">{currentScene.title}</h2>
          {currentScene.location && (
            <span className="text-xs text-parchment-dark">{currentScene.location}</span>
          )}
        </div>
      )}

      {/* Narrative Blocks — hidden when showing consequences */}
      {currentScene && !pendingResult && currentScene.blocks.map((block, i) => {
        const processedBlock = {
          ...block,
          text: (sanityState === 'breaking' || sanityState === 'shattered' || sanityState === 'lost')
            ? applyTextGlitch(block.text) : block.text,
        };
        return (
          <Typewriter key={`${currentScene.id}-${i}`} delay={i * 500}>
            <DialogueBox block={processedBlock} glitchText={glitchActive} />
          </Typewriter>
        );
      })}

      {/* Consequences Panel — shown after making a choice */}
      {pendingResult && (
        <ChoiceConsequences
          notifications={pendingResult.notifications}
          skillCheckResult={pendingResult.skillCheckResult}
          onContinue={handleContinue}
          canReroll={!!pendingResult.rerollContext && !pendingResult.hasRerolled && !!pendingResult.skillCheckResult && !pendingResult.skillCheckResult.success}
          onReroll={handleReroll}
          rerollCost={CONFIG.economy.rerollCost}
          playerThrones={gameState?.character?.thrones ?? 0}
          isRerolling={loading}
        />
      )}

      {/* Choices — hidden while showing consequences or processing choice */}
      {!pendingResult && !choiceResult && currentScene && currentScene.choices.length > 0 && (
        <ChoiceList
          choices={currentScene.choices}
          onSelect={handleChoice}
          disabled={loading}
        />
      )}
    </div>
  );
}
