'use client';

import type { Choice } from '@/domain/models';

interface ChoiceListProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
  characterLevel?: number;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  return (
    <div className="space-y-2 mt-4">
      {choices.map((choice) => {
        const isLocked = choice.visibleWhenLocked && choice.lockReason;

        return (
          <button
            key={choice.id}
            onClick={() => !isLocked && onSelect(choice.id)}
            disabled={disabled || !!isLocked}
            className={`w-full text-left p-3 rounded-sm border transition-all duration-200
              ${isLocked
                ? 'border-panel-light bg-panel/30 text-parchment-dark cursor-not-allowed opacity-50'
                : 'border-imperial-gold/30 bg-panel hover:bg-panel-light hover:border-imperial-gold/60 text-parchment cursor-pointer'
              }
              ${disabled ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <span className="block">{choice.text}</span>
            {choice.skillCheck && (
              <span className="text-xs text-imperial-gold mt-1 block">
                [{choice.skillCheck.stat} check - Difficulty {choice.skillCheck.difficulty}]
              </span>
            )}
            {isLocked && choice.lockReason && (
              <span className="text-xs text-blood mt-1 block">{choice.lockReason}</span>
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
