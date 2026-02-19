'use client';

import { useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { TaskCard } from '@/components/ui/task-card';
import { Modal } from '@/components/ui/modal';
import { Loading } from '@/components/ui/loading';
import { validateTaskName, validateTimeEstimate } from '@/lib/validators';

export function TaskManager() {
  const { gameState, loading, characterId, saveName, refresh } = useGameContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Create form state
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    category: 'physical_training',
    difficulty: 3 as number,
    recurring: 'daily',
    timeEstimateMinutes: 30,
  });

  if (loading || !gameState) return <Loading text="Loading tasks..." />;

  const tasks = gameState.tasks;

  const handleComplete = async (taskId: number) => {
    if (!characterId) return;
    setCompleting(taskId);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskId, characterId, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const report = await res.json();
      setFeedback(`+${report.xpEarned} XP! Streak: ${report.newStreak}`);
      await refresh();
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to complete task');
    } finally {
      setCompleting(null);
    }
  };

  const handleCreate = async () => {
    if (!characterId) return;
    const nameError = validateTaskName(newTask.name);
    const timeError = validateTimeEstimate(newTask.timeEstimateMinutes);
    if (nameError || timeError) {
      setFeedback(nameError ?? timeError);
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, characterId, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setCreateOpen(false);
      setNewTask({ name: '', description: '', category: 'physical_training', difficulty: 3, recurring: 'daily', timeEstimateMinutes: 30 });
      await refresh();
    } catch {
      setFeedback('Failed to create task');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-lg">Daily Tasks</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-3 py-1 text-sm border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/10"
        >
          + New Task
        </button>
      </div>

      {feedback && (
        <div className="text-sm text-system-green font-mono p-2 bg-void-black border border-system-green-dim/30 rounded-sm">
          {feedback}
        </div>
      )}

      <div className="space-y-2">
        {tasks.filter(t => t.active).map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={handleComplete}
            disabled={completing === task.id}
          />
        ))}
        {tasks.filter(t => t.active).length === 0 && (
          <div className="text-parchment-dark text-sm text-center py-8">
            No active tasks. Create one to begin earning XP.
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Task">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-parchment-dark block mb-1">Task Name</label>
            <input
              type="text"
              value={newTask.name}
              onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm focus:border-imperial-gold/50 outline-none"
              placeholder="e.g., Morning Run"
            />
          </div>
          <div>
            <label className="text-xs text-parchment-dark block mb-1">Category</label>
            <select
              value={newTask.category}
              onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm focus:border-imperial-gold/50 outline-none"
            >
              {['physical_training', 'cardio_mobility', 'combat_training', 'study_learning',
                'meditation_discipline', 'social_networking', 'creative_work',
                'professional_work', 'self_care', 'exploration'].map(cat => (
                <option key={cat} value={cat}>{cat.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-parchment-dark block mb-1">Difficulty</label>
              <select
                value={newTask.difficulty}
                onChange={e => setNewTask(p => ({ ...p, difficulty: parseInt(e.target.value) }))}
                className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none"
              >
                {[1, 2, 3, 5, 8].map(d => (
                  <option key={d} value={d}>{['Trivial', 'Easy', 'Moderate', 'Hard', 'Extreme'][[1,2,3,5,8].indexOf(d)]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-parchment-dark block mb-1">Time (min)</label>
              <input
                type="number"
                value={newTask.timeEstimateMinutes}
                onChange={e => setNewTask(p => ({ ...p, timeEstimateMinutes: parseInt(e.target.value) || 0 }))}
                className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none"
                min={1} max={480}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2 bg-imperial-gold/20 border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/30"
          >
            Create Task
          </button>
        </div>
      </Modal>
    </div>
  );
}
