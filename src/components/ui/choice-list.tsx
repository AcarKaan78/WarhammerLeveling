'use client';

import type { Choice } from '@/domain/models';

interface ChoiceWithVisibility extends Choice {
  _visibility?: {
    type: 'available' | 'locked' | 'skill_check';
    reason?: string;
    stat?: string;
    difficulty?: number;
  };
}

interface ChoiceListProps {
  choices: ChoiceWithVisibility[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  return (
    <div className="space-y-2 mt-4">
      {choices.map((choice) => {
        const isLocked = choice._visibility?.type === 'locked';

        return (
          <button
            key={choice.id}
            onClick={() => !isLocked && onSelect(choice.id)}
            disabled={disabled || isLocked}
            className={`w-full text-left p-3 rounded-sm border transition-all duration-200
              ${isLocked
                ? 'border-panel-light bg-panel/30 text-parchment-dark cursor-not-allowed opacity-50'
                : 'border-imperial-gold/30 bg-panel hover:bg-panel-light hover:border-imperial-gold/60 text-parchment cursor-pointer'
              }
              ${disabled ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <span className="block">{choice.text}</span>
            {choice._visibility?.type === 'skill_check' && (
              <span className="text-xs text-imperial-gold mt-1 block">
                [{choice._visibility.stat} check]
              </span>
            )}
            {isLocked && choice._visibility?.reason && (
              <span className="text-xs text-blood mt-1 block">{choice._visibility.reason}</span>
            )}
            {choice.tooltip && (
              <span className="text-xs text-parchment-dark mt-1 block">{choice.tooltip}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
