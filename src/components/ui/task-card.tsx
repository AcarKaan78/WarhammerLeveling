'use client';

import { formatStreakText, formatDifficulty, formatCategory } from '@/lib/formatters';

interface TaskCardProps {
  task: {
    id: number;
    name: string;
    category: string;
    difficulty: number;
    currentStreak: number;
    bestStreak: number;
    active: boolean;
  };
  onComplete?: (taskId: number) => void;
  onEdit?: (taskId: number) => void;
  disabled?: boolean;
}

export function TaskCard({ task, onComplete, onEdit, disabled = false }: TaskCardProps) {
  return (
    <div className={`p-3 border rounded-sm transition-colors
      ${task.active ? 'border-panel-light bg-panel' : 'border-panel-light/30 bg-panel/30 opacity-60'}
    `}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-parchment font-semibold text-sm">{task.name}</span>
          <div className="flex gap-3 mt-1 text-xs text-parchment-dark">
            <span>{formatCategory(task.category)}</span>
            <span>{formatDifficulty(task.difficulty)}</span>
          </div>
        </div>

        <div className="flex gap-2 ml-2">
          {onEdit && (
            <button
              onClick={() => onEdit(task.id)}
              className="text-xs text-parchment-dark hover:text-parchment px-2 py-1 border border-panel-light rounded-sm"
            >
              Edit
            </button>
          )}
          {onComplete && task.active && (
            <button
              onClick={() => onComplete(task.id)}
              disabled={disabled}
              className="text-xs text-imperial-gold hover:text-imperial-gold-dark px-3 py-1 border border-imperial-gold/40 rounded-sm
                hover:bg-imperial-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Complete
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-2 text-xs">
        <span className={`${task.currentStreak > 0 ? 'text-imperial-gold' : 'text-parchment-dark'}`}>
          Streak: {formatStreakText(task.currentStreak)}
        </span>
        <span className="text-parchment-dark">
          Best: {formatStreakText(task.bestStreak)}
        </span>
      </div>
    </div>
  );
}
