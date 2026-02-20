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

function formatStat(stat: string): string {
  const names: Record<string, string> = {
    weaponSkill: 'Weapon Skill', ballisticSkill: 'Ballistic Skill',
    strength: 'Strength', toughness: 'Toughness', agility: 'Agility',
    intelligence: 'Intelligence', perception: 'Perception',
    willpower: 'Willpower', fellowship: 'Fellowship',
  };
  return names[stat] ?? stat;
}

export function ChoiceList({ choices, onSelect, disabled = false }: ChoiceListProps) {
  return (
    <div className="space-y-2 mt-4">
      {choices.map((choice) => {
        const isLocked = choice._visibility?.type === 'locked';

        // Build requirement tags
        const tags: Array<{ label: string; color: string }> = [];

        if (choice.conditions?.minStat) {
          for (const [stat, val] of Object.entries(choice.conditions.minStat)) {
            tags.push({ label: `${formatStat(stat)} ${val}+`, color: isLocked ? 'text-blood' : 'text-system-green-dim' });
          }
        }

        if (choice.skillCheck) {
          tags.push({ label: `${formatStat(choice.skillCheck.stat)} check`, color: 'text-imperial-gold' });
        }

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
            {tags.length > 0 && (
              <div className="flex gap-2 mt-1">
                {tags.map((tag, i) => (
                  <span key={i} className={`text-xs ${tag.color}`}>[{tag.label}]</span>
                ))}
              </div>
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
