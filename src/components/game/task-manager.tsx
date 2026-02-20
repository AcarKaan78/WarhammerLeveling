'use client';

import { useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { TaskCard } from '@/components/ui/task-card';
import { Modal } from '@/components/ui/modal';
import { Loading } from '@/components/ui/loading';
import { validateTaskName, validateTimeEstimate } from '@/lib/validators';
import { CONFIG } from '@/domain/config';

const DIFFICULTY_OPTIONS = [1, 2, 3, 5, 8] as const;
const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Trivial', 2: 'Easy', 3: 'Moderate', 5: 'Hard', 8: 'Extreme',
};
const CATEGORIES = [
  'physical_training', 'cardio_mobility', 'combat_training', 'study_learning',
  'meditation_discipline', 'social_networking', 'creative_work',
  'professional_work', 'self_care', 'exploration',
];

const emptyForm = {
  name: '',
  description: '',
  category: 'physical_training',
  difficulty: 3 as number,
  recurring: 'daily',
  timeEstimateMinutes: 30,
};

export function TaskManager() {
  const { gameState, loading, characterId, saveName, refresh } = useGameContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Create / Edit form state
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Delete confirmation
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  if (loading || !gameState) return <Loading text="Loading tasks..." />;

  const tasks = gameState.tasks;
  const isEditing = editingTaskId !== null;
  const modalOpen = createOpen || isEditing;

  // --- Handlers ---

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

  const handleOpenCreate = () => {
    setFormData({ ...emptyForm });
    setEditingTaskId(null);
    setCreateOpen(true);
  };

  const handleOpenEdit = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setFormData({
      name: task.name,
      description: '',
      category: task.category,
      difficulty: task.difficulty,
      recurring: 'daily',
      timeEstimateMinutes: 30,
    });
    setEditingTaskId(taskId);
    setCreateOpen(false);
  };

  const handleCloseModal = () => {
    setCreateOpen(false);
    setEditingTaskId(null);
  };

  const handleSubmit = async () => {
    if (!characterId) return;
    const nameError = validateTaskName(formData.name);
    const timeError = validateTimeEstimate(formData.timeEstimateMinutes);
    if (nameError || timeError) {
      setFeedback(nameError ?? timeError);
      return;
    }

    try {
      if (isEditing) {
        // Update existing task
        const res = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTaskId,
            name: formData.name,
            category: formData.category,
            difficulty: formData.difficulty,
            saveName,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setFeedback('Task updated');
      } else {
        // Create new task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, characterId, saveName }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setFeedback('Task created');
      }
      handleCloseModal();
      await refresh();
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback(isEditing ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    try {
      const res = await fetch(`/api/tasks?id=${deletingTaskId}&save=${saveName}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDeletingTaskId(null);
      setFeedback('Task deleted');
      await refresh();
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to delete task');
    }
  };

  const taskToDelete = deletingTaskId ? tasks.find(t => t.id === deletingTaskId) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-lg">Daily Tasks</h2>
        <button
          onClick={handleOpenCreate}
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
            onEdit={handleOpenEdit}
            onDelete={setDeletingTaskId}
            disabled={completing === task.id}
          />
        ))}
        {tasks.filter(t => t.active).length === 0 && (
          <div className="text-parchment-dark text-sm text-center py-8">
            No active tasks. Create one to begin earning XP.
          </div>
        )}
      </div>

      {/* Create / Edit Task Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={isEditing ? 'Edit Task' : 'Create New Task'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-parchment-dark block mb-1">Task Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm focus:border-imperial-gold/50 outline-none"
              placeholder="e.g., Morning Run"
            />
          </div>
          <div>
            <label className="text-xs text-parchment-dark block mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm focus:border-imperial-gold/50 outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-parchment-dark block mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData(p => ({ ...p, difficulty: parseInt(e.target.value) }))}
                className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none"
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]} &mdash; {CONFIG.tasks.difficultyXP[d]} XP
                  </option>
                ))}
              </select>
            </div>
            {!isEditing && (
              <div>
                <label className="text-xs text-parchment-dark block mb-1">Time (min)</label>
                <input
                  type="number"
                  value={formData.timeEstimateMinutes}
                  onChange={e => setFormData(p => ({ ...p, timeEstimateMinutes: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none"
                  min={1} max={480}
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-imperial-gold/20 border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/30"
          >
            {isEditing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deletingTaskId !== null} onClose={() => setDeletingTaskId(null)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-parchment text-sm">
            Are you sure you want to delete <strong>{taskToDelete?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingTaskId(null)}
              className="flex-1 py-2 border border-panel-light text-parchment-dark rounded-sm hover:bg-panel-light/10 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 bg-red-500/20 border border-red-400/40 text-red-400 rounded-sm hover:bg-red-500/30 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
