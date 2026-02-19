'use client';

import { useCombat } from '@/hooks/use-combat';
import { InitiativeTracker } from '@/components/ui/initiative-tracker';
import { CombatActionMenu } from '@/components/ui/combat-action-menu';
import { ResourceBar } from '@/components/ui/resource-bar';
import { Loading } from '@/components/ui/loading';
import type { CombatAction } from '@/domain/models';

interface CombatArenaProps {
  onCombatEnd?: (result: unknown) => void;
  characterId: number;
  gameDay: number;
}

export function CombatArena({ onCombatEnd, characterId, gameDay }: CombatArenaProps) {
  const {
    combatState, lastResult, loading, error, isPlayerTurn,
    executeAction, processAITurn, resolveCombat,
  } = useCombat();

  if (!combatState) {
    return <Loading text="Initializing combat..." />;
  }

  const player = Object.values(combatState.combatants).find(c => c.isPlayer);
  const enemies = Object.values(combatState.combatants).filter(c => !c.isPlayer && !c.isCompanion && c.hp > 0);

  const handleAction = async (action: CombatAction, targetId?: string) => {
    await executeAction(action, targetId);
    // After player action, process AI turns
    if (!combatState.isComplete) {
      await processAITurn();
    }
  };

  const handleResolve = async () => {
    const result = await resolveCombat(characterId, gameDay);
    onCombatEnd?.(result);
  };

  return (
    <div className="space-y-4">
      {/* Initiative Tracker */}
      <InitiativeTracker combatState={combatState} />

      {/* Combat Log */}
      <div className="bg-void-black border border-panel-light rounded-sm p-3 max-h-40 overflow-y-auto font-mono text-xs">
        {combatState.combatLog.slice(-10).map((log, i) => (
          <div key={i} className="text-system-green-dim py-0.5">{log}</div>
        ))}
      </div>

      {/* Player Status */}
      {player && (
        <div className="bg-panel border border-panel-light rounded-sm p-3">
          <div className="text-sm text-parchment font-semibold mb-2">{player.name}</div>
          <ResourceBar type="hp" current={player.hp} max={player.hpMax} />
          {player.statusEffects.length > 0 && (
            <div className="flex gap-1 mt-2">
              {player.statusEffects.map((effect, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-warp-blue border border-warp-purple/30 rounded-sm text-corruption-glow">
                  {effect}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enemies */}
      <div className="grid grid-cols-2 gap-2">
        {enemies.map(enemy => (
          <div key={enemy.id} className="bg-panel border border-blood/20 rounded-sm p-2">
            <div className="text-xs text-blood font-semibold">{enemy.name}</div>
            <ResourceBar type="hp" current={enemy.hp} max={enemy.hpMax} showLabel={false} />
          </div>
        ))}
      </div>

      {/* Last Action Result */}
      {lastResult && (
        <div className={`text-sm p-2 rounded-sm border ${lastResult.hit ? 'border-blood/30 bg-blood/5 text-blood-bright' : 'border-panel-light bg-panel text-parchment-dark'}`}>
          {lastResult.description}
          {lastResult.damage > 0 && <span className="ml-2 text-blood-bright font-bold">{lastResult.damage} damage</span>}
        </div>
      )}

      {/* Actions */}
      {combatState.isComplete ? (
        <div className="text-center space-y-3">
          <div className="text-lg font-gothic text-imperial-gold">
            {combatState.result?.victory ? 'Victory!' : 'Defeat'}
          </div>
          <button
            onClick={handleResolve}
            className="px-6 py-2 bg-imperial-gold/20 border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/30 transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        isPlayerTurn && (
          <CombatActionMenu
            onAction={handleAction}
            disabled={loading}
            targets={enemies.map(e => ({ id: e.id, name: e.name }))}
          />
        )
      )}

      {error && <div className="text-xs text-blood">{error}</div>}
    </div>
  );
}
