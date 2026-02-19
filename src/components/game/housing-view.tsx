'use client';

import { useGameContext } from '@/context/game-context';
import { Loading } from '@/components/ui/loading';

const HOUSING_LEVELS = [
  { level: 0, name: 'Hab-Block Bunk', description: 'A cramped corner in a communal hab-block. Barely enough room to lie down.', upgradeCost: 0 },
  { level: 1, name: 'Private Cell', description: 'Your own small room with a cot, footlocker, and a door that locks.', upgradeCost: 100 },
  { level: 2, name: 'Quarters', description: 'Modest quarters with a proper bed, desk, and small storage area.', upgradeCost: 500 },
  { level: 3, name: 'Suite', description: 'Comfortable living space with separate sleeping and working areas.', upgradeCost: 2000 },
  { level: 4, name: 'Estate', description: 'A small estate with multiple rooms, servants, and proper furnishings.', upgradeCost: 10000 },
  { level: 5, name: 'Spire Manor', description: 'Luxurious spire-level accommodation befitting an Inquisitorial agent.', upgradeCost: 50000 },
];

export function HousingView() {
  const { gameState, loading, characterId, saveName, refresh } = useGameContext();

  if (loading || !gameState) return <Loading text="Loading housing..." />;

  const currentLevel = (gameState.character as unknown as { housingLevel?: number }).housingLevel ?? 0;
  const currentHousing = HOUSING_LEVELS[currentLevel] ?? HOUSING_LEVELS[0];
  const nextHousing = HOUSING_LEVELS[currentLevel + 1];

  const handleUpgrade = async () => {
    if (!nextHousing || !characterId) return;
    try {
      // Direct character update for housing level
      const res = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade-housing',
          characterId,
          saveName,
        }),
      });
      if (res.ok) await refresh();
    } catch {
      // Housing upgrade handled by future use case
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-gothic text-imperial-gold text-lg">Your Quarters</h2>

      {/* Current Housing */}
      <div className="bg-panel border border-imperial-gold/30 rounded-sm p-4">
        <h3 className="font-gothic text-imperial-gold">{currentHousing.name}</h3>
        <p className="text-parchment-dark text-sm mt-2">{currentHousing.description}</p>
        <div className="text-xs text-parchment-dark mt-2">Level {currentLevel}/5</div>
      </div>

      {/* Upgrade Option */}
      {nextHousing && (
        <div className="bg-panel border border-panel-light rounded-sm p-4">
          <h3 className="text-parchment font-semibold text-sm">Next Upgrade: {nextHousing.name}</h3>
          <p className="text-parchment-dark text-xs mt-1">{nextHousing.description}</p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-imperial-gold">{nextHousing.upgradeCost} Thrones</span>
            <button
              onClick={handleUpgrade}
              disabled={gameState.character.thrones < nextHousing.upgradeCost}
              className="px-3 py-1 text-xs border border-imperial-gold/40 text-imperial-gold rounded-sm
                hover:bg-imperial-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {!nextHousing && (
        <div className="text-sm text-imperial-gold text-center py-4 font-gothic">
          Maximum housing level reached.
        </div>
      )}
    </div>
  );
}
