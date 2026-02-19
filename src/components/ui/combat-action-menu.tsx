'use client';

import { CombatAction } from '@/domain/models';

interface CombatActionMenuProps {
  onAction: (action: CombatAction, targetId?: string) => void;
  disabled?: boolean;
  availableActions?: CombatAction[];
  targets?: Array<{ id: string; name: string }>;
}

const ACTION_INFO: Record<CombatAction, { label: string; description: string; needsTarget: boolean }> = {
  [CombatAction.ATTACK]: { label: 'Attack', description: 'Standard melee or ranged attack', needsTarget: true },
  [CombatAction.AIM]: { label: 'Aim', description: '+20 to next ranged attack', needsTarget: false },
  [CombatAction.ALL_OUT_ATTACK]: { label: 'All-Out Attack', description: '+30 to hit but no dodge', needsTarget: true },
  [CombatAction.DEFENSIVE_STANCE]: { label: 'Defend', description: '+20 to dodge and parry', needsTarget: false },
  [CombatAction.CHARGE]: { label: 'Charge', description: 'Move + attack with +10 to hit', needsTarget: true },
  [CombatAction.SUPPRESSIVE_FIRE]: { label: 'Suppress', description: 'Pin enemies in area', needsTarget: false },
  [CombatAction.USE_PSYCHIC]: { label: 'Psychic Power', description: 'Cast a psychic power', needsTarget: true },
  [CombatAction.USE_ITEM]: { label: 'Use Item', description: 'Use a consumable', needsTarget: false },
  [CombatAction.DISENGAGE]: { label: 'Disengage', description: 'Safely retreat from melee', needsTarget: false },
  [CombatAction.CALLED_SHOT]: { label: 'Called Shot', description: 'Target a specific location', needsTarget: true },
  [CombatAction.OVERWATCH]: { label: 'Overwatch', description: 'Fire at next moving enemy', needsTarget: false },
  [CombatAction.COMMAND]: { label: 'Command', description: 'Rally companions', needsTarget: false },
  [CombatAction.MOVE]: { label: 'Move', description: 'Change position', needsTarget: false },
};

const ALL_ACTIONS = Object.values(CombatAction);

export function CombatActionMenu({
  onAction,
  disabled = false,
  availableActions = ALL_ACTIONS,
  targets = [],
}: CombatActionMenuProps) {
  const handleAction = (action: CombatAction) => {
    const info = ACTION_INFO[action];
    if (info.needsTarget && targets.length > 0) {
      // For simplicity, auto-select first target. Full UI would show target picker.
      onAction(action, targets[0].id);
    } else {
      onAction(action);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {availableActions.map(action => {
        const info = ACTION_INFO[action];
        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={disabled}
            className="p-2 text-left border border-panel-light rounded-sm bg-panel
              hover:bg-panel-light hover:border-imperial-gold/40 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
            title={info.description}
          >
            <span className="block text-sm text-parchment font-semibold">{info.label}</span>
            <span className="block text-xs text-parchment-dark">{info.description}</span>
          </button>
        );
      })}
    </div>
  );
}
