'use client';

import { useEffect, useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { useNarrative } from '@/hooks/use-narrative';
import { StoryRenderer } from '@/components/game/story-renderer';
import { Loading } from '@/components/ui/loading';
import type { Scene } from '@/domain/models';

export default function StoryPage() {
  const { gameState, loading: gameLoading, characterId, saveName, setCharacterId } = useGameContext();
  const { currentScene, availableScenes, loadScene, loadAvailableScenes } = useNarrative();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  useEffect(() => {
    if (characterId && !loaded) {
      loadAvailableScenes(characterId, saveName);
      setLoaded(true);
    }
  }, [characterId, saveName, loaded, loadAvailableScenes]);

  if (gameLoading || !gameState) return <Loading text="Loading story..." />;

  const sanityState = gameState.character.sanityState;

  if (currentScene) {
    return (
      <div className="max-w-2xl">
        <StoryRenderer
          characterId={characterId!}
          gameDay={1} // Would come from game state
          sanityState={sanityState}
          saveName={saveName}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-gothic text-imperial-gold text-xl">Available Scenes</h2>

      {availableScenes.length === 0 ? (
        <div className="text-parchment-dark text-sm text-center py-12">
          <p>No scenes available at this time.</p>
          <p className="text-xs mt-2">Complete tasks and advance to unlock new story content.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {availableScenes.map((scene: Scene) => (
            <button
              key={scene.id}
              onClick={() => loadScene(scene.id, characterId!, saveName)}
              className="w-full p-4 border border-panel-light rounded-sm bg-panel hover:bg-panel-light hover:border-imperial-gold/40 text-left transition-colors"
            >
              <div className="text-parchment font-gothic font-semibold">{scene.title}</div>
              <div className="text-xs text-parchment-dark mt-1">{scene.chapter}</div>
              {scene.location && (
                <div className="text-xs text-parchment-dark/50 mt-1">{scene.location}</div>
              )}
              <div className="flex gap-1 mt-2">
                {scene.tags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 bg-panel-light border border-panel-light rounded-sm text-parchment-dark">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
