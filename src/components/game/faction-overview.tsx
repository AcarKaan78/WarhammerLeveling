'use client';

import { useGameContext } from '@/context/game-context';
import { StatBar } from '@/components/ui/stat-bar';
import { Loading } from '@/components/ui/loading';

function getFactionColor(reputation: number): string {
  if (reputation >= 60) return 'bg-sanity-stable';
  if (reputation >= 20) return 'bg-imperial-gold';
  if (reputation >= -20) return 'bg-parchment-dark';
  if (reputation >= -60) return 'bg-sanity-breaking';
  return 'bg-blood';
}

function getStandingLabel(reputation: number): string {
  if (reputation >= 80) return 'Allied';
  if (reputation >= 60) return 'Friendly';
  if (reputation >= 20) return 'Cordial';
  if (reputation >= -20) return 'Neutral';
  if (reputation >= -60) return 'Suspicious';
  if (reputation >= -80) return 'Hostile';
  return 'Enemies';
}

export function FactionOverview() {
  const { gameState, loading } = useGameContext();

  if (loading || !gameState) return <Loading text="Loading factions..." />;

  const factions = gameState.factions;

  return (
    <div className="space-y-4">
      <h2 className="font-gothic text-imperial-gold text-lg">Faction Reputation</h2>

      {factions.length === 0 && (
        <div className="text-parchment-dark text-sm text-center py-8">No faction data.</div>
      )}

      <div className="space-y-3">
        {factions.map(faction => (
          <div key={faction.id} className="bg-panel border border-panel-light rounded-sm p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-parchment font-semibold text-sm">{faction.name}</span>
              <span className={`text-xs ${faction.reputation >= 0 ? 'text-sanity-stable' : 'text-blood'}`}>
                {getStandingLabel(faction.reputation)}
              </span>
            </div>
            <StatBar
              label=""
              current={faction.reputation + 100}
              max={200}
              color={getFactionColor(faction.reputation)}
              size="sm"
              showNumbers={false}
            />
            <div className="text-xs text-parchment-dark mt-1 text-right">
              {faction.reputation > 0 ? '+' : ''}{faction.reputation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
