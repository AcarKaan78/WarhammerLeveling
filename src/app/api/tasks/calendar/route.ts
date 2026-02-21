import { NextRequest, NextResponse } from 'next/server';
import { createContainer } from '@/infrastructure/di/container';

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const month = request.nextUrl.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);

    if (!characterId) {
      return NextResponse.json({ error: 'characterId required' }, { status: 400 });
    }

    const container = createContainer(saveName);

    // Calculate date range for the month
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Get all daily sessions for the month
    const sessions = await container.repos.task.getDailySessionsForRange(characterId, startDate, endDate);

    // Get active tasks (for name lookup and streak info)
    const allTasks = await container.repos.task.getAll(characterId, true);
    const taskNameMap = new Map(allTasks.map(t => [t.id, t.name]));

    // Build day map with completion details
    const days: Record<string, {
      tasksCompleted: number;
      totalXP: number;
      categoryCounts: Record<string, number>;
      completions: Array<{ taskName: string; xpEarned: number }>;
    }> = {};

    for (const session of sessions) {
      // Get individual completions for this day
      const completions = await container.repos.task.getCompletionsForDate(characterId, session.date);

      days[session.date] = {
        tasksCompleted: session.tasksCompleted,
        totalXP: session.totalXPEarned,
        categoryCounts: session.categoryCounts as Record<string, number>,
        completions: completions.map(c => ({
          taskName: taskNameMap.get(c.taskId) ?? `Task #${c.taskId}`,
          xpEarned: c.xpEarned,
        })),
      };
    }

    // Task streak info
    const tasks = allTasks.map(t => ({
      id: t.id,
      name: t.name,
      currentStreak: t.currentStreak,
      bestStreak: t.bestStreak,
      lastCompleted: t.lastCompleted?.toISOString().slice(0, 10) ?? null,
    }));

    return NextResponse.json({ days, tasks, totalActiveTasks: allTasks.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
