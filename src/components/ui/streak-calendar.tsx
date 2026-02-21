'use client';

import { useState, useEffect, useCallback } from 'react';

interface CalendarDay {
  tasksCompleted: number;
  totalXP: number;
  categoryCounts: Record<string, number>;
  completions: Array<{ taskName: string; xpEarned: number }>;
}

interface TaskStreak {
  id: number;
  name: string;
  currentStreak: number;
  bestStreak: number;
  lastCompleted: string | null;
}

interface CalendarData {
  days: Record<string, CalendarDay>;
  tasks: TaskStreak[];
  totalActiveTasks: number;
}

interface StreakCalendarProps {
  characterId: number;
  saveName?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function StreakCalendar({ characterId, saveName = 'current' }: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchCalendar = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const key = getMonthKey(month);
      const res = await fetch(
        `/api/tasks/calendar?characterId=${characterId}&save=${saveName}&month=${key}`,
      );
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [characterId, saveName]);

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth, fetchCalendar]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) {
      setCurrentMonth(next);
      setSelectedDay(null);
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalTasks = data?.totalActiveTasks ?? 0;

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getIntensity = (completed: number): string => {
    if (completed === 0 || totalTasks === 0) return '';
    const ratio = completed / totalTasks;
    if (ratio >= 0.9) return 'bg-system-green/30 border-system-green/50';
    if (ratio >= 0.6) return 'bg-system-green/20 border-system-green/30';
    if (ratio >= 0.3) return 'bg-system-green/10 border-system-green/20';
    return 'bg-system-green/5 border-system-green/10';
  };

  const selectedData = selectedDay ? data?.days[selectedDay] : undefined;

  // Calculate longest active streak across all tasks
  const longestCurrent = data?.tasks?.reduce((max, t) => Math.max(max, t.currentStreak), 0) ?? 0;
  const longestBest = data?.tasks?.reduce((max, t) => Math.max(max, t.bestStreak), 0) ?? 0;

  return (
    <div className="border border-panel-light rounded-sm bg-panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="text-parchment-dark hover:text-imperial-gold transition-colors px-2 py-1"
        >
          &larr;
        </button>
        <h3 className="font-gothic text-imperial-gold text-lg">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={goToNextMonth}
          className="text-parchment-dark hover:text-imperial-gold transition-colors px-2 py-1"
          disabled={getMonthKey(new Date(year, month + 1, 1)) > getMonthKey(new Date())}
        >
          &rarr;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-parchment-dark font-semibold py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center text-parchment-dark text-sm py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="h-10" />;
            }

            const dayKey = getDayKey(year, month, day);
            const dayData = data?.days[dayKey];
            const completed = dayData?.tasksCompleted ?? 0;
            const isToday = dayKey === todayStr;
            const isSelected = dayKey === selectedDay;
            const isFuture = dayKey > todayStr;

            return (
              <button
                key={dayKey}
                onClick={() => !isFuture && setSelectedDay(isSelected ? null : dayKey)}
                disabled={isFuture}
                className={`
                  h-10 rounded-sm border text-xs relative transition-all
                  ${isFuture ? 'opacity-30 border-transparent cursor-default' : 'cursor-pointer hover:border-imperial-gold/40'}
                  ${isToday ? 'ring-1 ring-imperial-gold' : ''}
                  ${isSelected ? 'border-imperial-gold' : 'border-panel-light'}
                  ${completed > 0 ? getIntensity(completed) : 'bg-transparent'}
                `}
              >
                <span className={`
                  ${isToday ? 'text-imperial-gold font-bold' : 'text-parchment-dark'}
                  ${completed > 0 ? 'text-parchment' : ''}
                `}>
                  {day}
                </span>
                {completed > 0 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] text-system-green-dim font-mono">
                    {completed}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day detail */}
      {selectedData && (
        <div className="border-t border-panel-light pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-parchment">{selectedDay}</span>
            <span className="text-system-green font-mono">{selectedData.totalXP} XP</span>
          </div>
          <div className="text-xs text-parchment-dark">
            {selectedData.tasksCompleted} / {totalTasks} tasks completed
          </div>

          {/* Per-task completion list */}
          {selectedData.completions && selectedData.completions.length > 0 && (
            <div className="space-y-1 mt-2">
              <div className="text-[10px] text-parchment-dark uppercase tracking-[0.15em]">Completed Tasks</div>
              {selectedData.completions.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sanity-stable">&#10003;</span>
                    <span className="text-parchment">{c.taskName}</span>
                  </div>
                  <span className="text-system-green-dim font-mono">+{c.xpEarned} XP</span>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {Object.entries(selectedData.categoryCounts).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(selectedData.categoryCounts).map(([cat, count]) => (
                <span
                  key={cat}
                  className="text-[10px] px-1.5 py-0.5 bg-panel-light border border-panel-light rounded-sm text-parchment-dark"
                >
                  {cat.replace(/_/g, ' ')} x{count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No data message for selected day */}
      {selectedDay && !selectedData && (
        <div className="border-t border-panel-light pt-3">
          <div className="text-xs text-parchment-dark text-center py-2">
            No tasks completed on {selectedDay}
          </div>
        </div>
      )}

      {/* Streak summary */}
      {data?.tasks && data.tasks.length > 0 && (
        <div className="border-t border-panel-light pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-parchment-dark font-semibold uppercase tracking-wide">Streaks</span>
            <div className="flex gap-3 text-xs">
              <span className="text-imperial-gold">Best Active: {longestCurrent}d</span>
              <span className="text-parchment-dark">All-time: {longestBest}d</span>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.tasks
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map(task => (
                <div key={task.id} className="flex justify-between items-center text-xs">
                  <span className="text-parchment truncate flex-1">{task.name}</span>
                  <div className="flex gap-3 shrink-0 ml-2">
                    <span className={task.currentStreak > 0 ? 'text-imperial-gold' : 'text-parchment-dark'}>
                      {task.currentStreak > 0 ? `${task.currentStreak}d` : '-'}
                    </span>
                    <span className="text-parchment-dark w-8 text-right">
                      {task.bestStreak > 0 ? `${task.bestStreak}d` : '-'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
