'use client';

import { useGameContext } from '@/context/game-context';
import { StatBar } from '@/components/ui/stat-bar';
import { Loading } from '@/components/ui/loading';

export function QuestLog() {
  const { gameState, loading } = useGameContext();

  if (loading || !gameState) return <Loading text="Loading quests..." />;
  const { quests } = gameState;

  return (
    <div className="space-y-4">
      <h2 className="font-gothic text-imperial-gold text-lg">Quest Log</h2>

      {/* Active Quests */}
      {quests.active.length > 0 ? (
        <div className="space-y-2">
          {quests.active.map(quest => (
            <div key={quest.id} className="bg-panel border border-panel-light rounded-sm p-3">
              <div className="flex justify-between items-start">
                <span className="text-parchment font-semibold text-sm">{quest.title}</span>
                <span className="text-xs text-imperial-gold">
                  {quest.objectivesComplete}/{quest.objectivesTotal}
                </span>
              </div>
              <div className="mt-2">
                <StatBar
                  label=""
                  current={quest.objectivesComplete}
                  max={quest.objectivesTotal}
                  color="bg-imperial-gold"
                  size="sm"
                  showNumbers={false}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-parchment-dark text-sm text-center py-8">No active quests.</div>
      )}

      {/* Completed Count */}
      {quests.completed > 0 && (
        <div className="text-xs text-parchment-dark border-t border-panel-light pt-3">
          Completed quests: {quests.completed}
        </div>
      )}
    </div>
  );
}
