import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { CompleteTaskUseCase } from '@/application/use-cases/tasks/complete-task';
import { TaskCategory } from '@/domain/models';

const CreateTaskSchema = z.object({
  characterId: z.number().int(),
  name: z.string().min(1).max(100),
  description: z.string().default(''),
  category: z.nativeEnum(TaskCategory),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8)]),
  recurring: z.enum(['daily', 'weekly', 'weekdays', 'weekends', 'custom']),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  timeEstimateMinutes: z.number().int().min(1).max(480),
  saveName: z.string().default('current'),
});

const UpdateTaskSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8)]).optional(),
  isActive: z.boolean().optional(),
  saveName: z.string().default('current'),
});

const CompleteTaskSchema = z.object({
  taskId: z.number().int(),
  characterId: z.number().int(),
  saveName: z.string().default('current'),
});

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') !== 'false';
    const container = createContainer(saveName);

    const tasks = await container.repos.task.getAll(characterId, activeOnly);
    return NextResponse.json(tasks);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'complete') {
      const data = CompleteTaskSchema.parse(body);
      const container = createContainer(data.saveName);
      const useCase = new CompleteTaskUseCase(
        container.repos.task,
        container.repos.character,
        container.repos.event,
      );
      const report = await useCase.execute(data.taskId, data.characterId);
      return NextResponse.json(report);
    }

    const data = CreateTaskSchema.parse(body);
    const container = createContainer(data.saveName);
    const { saveName, ...taskData } = data;
    const task = await container.repos.task.create({
      ...taskData,
      isActive: true,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UpdateTaskSchema.parse(body);
    const container = createContainer(data.saveName);
    const { id, saveName, ...changes } = data;
    const updated = await container.repos.task.update(id, changes);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = parseInt(request.nextUrl.searchParams.get('id') ?? '0');
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }
    const container = createContainer(saveName);
    await container.repos.task.softDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
