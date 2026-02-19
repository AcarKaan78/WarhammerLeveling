import { NextRequest, NextResponse } from 'next/server';
import { loadPsychicPowers, loadSkills, loadPerks, loadMutations, loadAchievements } from '@/infrastructure/data-loader';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    switch (type) {
      case 'psychic-powers':
        return NextResponse.json(loadPsychicPowers());
      case 'skills':
        return NextResponse.json(loadSkills());
      case 'perks':
        return NextResponse.json(loadPerks());
      case 'mutations':
        return NextResponse.json(loadMutations());
      case 'achievements':
        return NextResponse.json(loadAchievements());
      default:
        return NextResponse.json({ error: 'Unknown data type. Use: psychic-powers, skills, perks, mutations, achievements' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
