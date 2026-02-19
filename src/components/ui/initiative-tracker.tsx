'use client';

import type { CombatState } from '@/domain/models';

interface InitiativeTrackerProps {
  combatState: CombatState;
}

export function InitiativeTracker({ combatState }: InitiativeTrackerProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {combatState.initiativeOrder.map((id, idx) => {
        const combatant = combatState.combatants[id];
        if (!combatant) return null;
        const isCurrent = idx === combatState.currentCombatantIndex;
        const isDead = combatant.hp <= 0;

        return (
          <div
            key={id}
            className={`
              flex-shrink-0 px-3 py-2 rounded-sm border text-xs font-mono text-center min-w-[80px]
              ${isCurrent ? 'border-imperial-gold bg-imperial-gold/10 text-imperial-gold' : ''}
              ${!isCurrent && !isDead ? 'border-panel-light bg-panel text-parchment-dark' : ''}
              ${isDead ? 'border-blood/30 bg-blood/5 text-blood/50 line-through' : ''}
              ${combatant.isPlayer ? 'ring-1 ring-imperial-gold/30' : ''}
            `}
          >
            <div className="font-semibold truncate">{combatant.name}</div>
            <div className="mt-1">{combatant.hp}/{combatant.hpMax}</div>
          </div>
        );
      })}
    </div>
  );
}
