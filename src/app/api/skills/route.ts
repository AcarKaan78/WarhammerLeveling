import { NextRequest, NextResponse } from 'next/server';
import { loadSkills, loadPerks } from '@/infrastructure/data-loader';

export async function GET() {
  try {
    const skills = loadSkills();
    const perks = loadPerks();
    return NextResponse.json({ skills, perks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
