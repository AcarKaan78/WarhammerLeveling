import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SaveService } from '@/application/services/save-service';

const CreateSaveSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Save name must be alphanumeric with dashes/underscores'),
});

export async function GET() {
  try {
    const saveService = new SaveService();
    const saves = await saveService.listSaves();
    return NextResponse.json(saves);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;
    const saveService = new SaveService();

    if (action === 'create') {
      const data = CreateSaveSchema.parse(body);
      await saveService.createSave(data.name);
      return NextResponse.json({ success: true, name: data.name }, { status: 201 });
    }

    if (action === 'switch') {
      const data = CreateSaveSchema.parse(body);
      await saveService.switchSave(data.name);
      return NextResponse.json({ success: true, name: data.name });
    }

    return NextResponse.json({ error: 'Unknown action. Use: create, switch' }, { status: 400 });
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
    const name = request.nextUrl.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Save name required' }, { status: 400 });
    }

    const saveService = new SaveService();
    await saveService.deleteSave(name);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
