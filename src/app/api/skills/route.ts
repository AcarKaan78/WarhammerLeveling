import { NextRequest, NextResponse } from 'next/server';
import { loadSkills, loadPerks } from '@/infrastructure/data-loader';
import { createContainer } from '@/infrastructure/di/container';

export async function GET(request: NextRequest) {
  try {
    const skills = loadSkills();
    const perks = loadPerks();

    // If characterId provided, merge in character's skill levels
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';

    if (characterId) {
      const container = createContainer(saveName);

      // Auto-seed skills if needed
      let charSkills = await container.repos.skill.getAllSkills(characterId);
      if (charSkills.length === 0) {
        await container.repos.skill.initializeAll(
          characterId,
          skills.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            governingStat1: s.governingStat1,
            governingStat2: s.governingStat2 ?? null,
          })),
        );
        charSkills = await container.repos.skill.getAllSkills(characterId);
      }

      // Merge levels into skill definitions
      const levelMap = new Map(charSkills.map(s => [s.id, s]));
      const mergedSkills = skills.map(s => {
        const charSkill = levelMap.get(s.id);
        return {
          ...s,
          level: charSkill?.level ?? 0,
          xp: charSkill?.xp ?? 0,
          xpToNext: charSkill?.xpToNext ?? 100,
        };
      });

      return NextResponse.json({ skills: mergedSkills, perks });
    }

    return NextResponse.json({ skills, perks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
