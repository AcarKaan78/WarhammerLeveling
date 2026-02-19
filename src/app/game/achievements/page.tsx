'use client';

import { useEffect, useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { AchievementCard } from '@/components/ui/achievement-card';
import { Loading } from '@/components/ui/loading';

interface AchievementData {
  id: string;
  name: string;
  description: string;
  hiddenDescription: string;
  category: string;
  progressive: boolean;
  maxProgress: number;
}

export default function AchievementsPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  useEffect(() => {
    // Load achievements data
    fetch('/api/data?type=achievements')
      .then(r => r.ok ? r.json() : [])
      .then(setAchievements)
      .catch(() => setAchievements([]));
  }, []);

  if (loading || !gameState) return <Loading text="Loading achievements..." />;

  const categories = [...new Set(achievements.map(a => a.category))];
  const unlocked = unlockedIds.size;
  const total = achievements.length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-xl">Achievements</h2>
        <span className="text-sm text-parchment-dark">{unlocked}/{total} unlocked</span>
      </div>

      {categories.map(category => {
        const catAchievements = achievements.filter(a => a.category === category);
        return (
          <div key={category}>
            <h3 className="text-sm font-gothic text-parchment uppercase tracking-wider mb-2 capitalize">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {catAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedIds.has(achievement.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {achievements.length === 0 && (
        <div className="text-parchment-dark text-sm text-center py-12">
          No achievements loaded.
        </div>
      )}
    </div>
  );
}
