'use client';

import { useNarrative } from '@/hooks/use-narrative';
import { useSanityEffects } from '@/hooks/use-sanity-effects';
import { DialogueBox } from '@/components/ui/dialogue-box';
import { ChoiceList } from '@/components/ui/choice-list';
import { SkillCheckDisplay } from '@/components/ui/skill-check-display';
import { Typewriter } from '@/components/effects/typewriter';
import { Loading } from '@/components/ui/loading';
import React, { useState, useEffect, useRef } from 'react';

interface StoryRendererProps {
  characterId: number;
  gameDay: number;
  sanityState: string;
  saveName?: string;
}

export function StoryRenderer({ characterId, gameDay, sanityState, saveName = 'current' }: StoryRendererProps) {
  const { currentScene, availableScenes, choiceResult, loading, error, loadScene, loadAvailableScenes, makeChoice } = useNarrative();
  const { applyTextGlitch, glitchActive } = useSanityEffects(sanityState);
  const [skillCheck, setSkillCheck] = useState<{
    roll: number; target: number; success: boolean;
    criticalSuccess: boolean; criticalFailure: boolean; margin: number; skillName: string;
  } | null>(null);
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
    if (!currentScene && !loading && availableScenes.length > 0) {
      loadScene(availableScenes[0].id, characterId, saveName);
    }
  }, [currentScene, loading, availableScenes, characterId, saveName, loadScene]);

  if (loading) return <Loading text="Loading scene..." />;
  if (error) return <div className="text-blood text-sm">{error}</div>;

  if (!currentScene) {
    return (
      <div className="text-parchment-dark text-sm text-center py-12">
        <p>No scenes available at this time.</p>
        <p className="text-xs mt-2">Complete tasks and advance to unlock new story content.</p>
      </div>
    );
  }

  const handleChoice = async (choiceId: string) => {
    const result = await makeChoice(currentScene.id, choiceId, characterId, gameDay, saveName);

    if (result && typeof result === 'object' && 'skillCheckResult' in result) {
      const scr = (result as { skillCheckResult: typeof skillCheck }).skillCheckResult;
      if (scr) {
        const choice = currentScene.choices.find(c => c.id === choiceId);
        setSkillCheck({
          ...scr,
          skillName: choice?.skillCheck?.stat ?? 'Skill',
        });
      }
    }

    // If no next scene was auto-loaded, refresh available scenes
    if (result && typeof result === 'object' && !('nextSceneId' in result && (result as { nextSceneId: string | null }).nextSceneId)) {
      await loadAvailableScenes(characterId, saveName);
    }
  };

  return (
    <div className={`space-y-2 ${glitchActive ? 'animate-screen-glitch' : ''}`}>
      {/* Scene Title */}
      <div className="border-b border-panel-light pb-2 mb-4">
        <h2 className="font-gothic text-imperial-gold text-lg">{currentScene.title}</h2>
        {currentScene.location && (
          <span className="text-xs text-parchment-dark">{currentScene.location}</span>
        )}
      </div>

      {/* Narrative Blocks */}
      {currentScene.blocks.map((block, i) => {
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

      {/* Skill Check Result */}
      {skillCheck && (
        <SkillCheckDisplay
          {...skillCheck}
          onComplete={() => setSkillCheck(null)}
        />
      )}

      {/* Choice Result Notifications */}
      {(() => {
        if (choiceResult && typeof choiceResult === 'object' && 'notifications' in choiceResult) {
          const notifications = (choiceResult as { notifications: string[] }).notifications ?? [];
          return (
            <div className="space-y-1 mt-3">
              {notifications.map((n, i) => (
                <div key={i} className="text-xs text-system-green font-mono">{n}</div>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* Choices */}
      {!skillCheck && currentScene.choices.length > 0 && (
        <ChoiceList
          choices={currentScene.choices}
          onSelect={handleChoice}
          disabled={loading}
        />
      )}
    </div>
  );
}
