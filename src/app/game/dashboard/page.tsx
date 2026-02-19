'use client';

import { useEffect, useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { ResourceBar } from '@/components/ui/resource-bar';
import { TaskCard } from '@/components/ui/task-card';
import { DailyBriefing } from '@/components/game/daily-briefing';
import { Notification } from '@/components/ui/notification';
import { Loading } from '@/components/ui/loading';
import { useSanityEffects } from '@/hooks/use-sanity-effects';
import { formatThrones } from '@/lib/formatters';
import Link from 'next/link';

export default function DashboardPage() {
  const { gameState, loading, characterId, saveName, refresh, setCharacterId } = useGameContext();
  const [briefing, setBriefing] = useState<Record<string, unknown> | null>(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);

  // Auto-detect character on first load
  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  // Start day on load
  useEffect(() => {
    if (!characterId || briefing) return;
    fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start-day', characterId, saveName }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setBriefing(data); refresh(); } })
      .catch(() => {});
  }, [characterId, saveName, briefing, refresh]);

  const sanityState = gameState?.character.sanityState ?? 'stable';
  const sanityEffects = useSanityEffects(sanityState);
  const fakeNotification: string | null = sanityEffects.fakeNotification;
  const dismissFakeNotification = sanityEffects.dismissFakeNotification;

  if (loading || !gameState) {
    return <Loading text="Accessing the Noosphere..." />;
  }

  const { character, tasks, quests } = gameState;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Fake Notification (sanity) */}
      {fakeNotification !== null ? (
        <Notification message={fakeNotification} type="fake" onDismiss={dismissFakeNotification} />
      ) : null}

      {/* Daily Briefing */}
      {briefing && !briefingDismissed && (
        <DailyBriefing briefing={briefing as never} onDismiss={() => setBriefingDismissed(true)} />
      )}

      {/* Character Summary */}
      <div className="bg-dark-slate border border-panel-light rounded-sm p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="font-gothic text-imperial-gold text-2xl">{character.name}</h1>
            <div className="text-sm text-parchment-dark">
              Level {character.level} | {formatThrones(character.thrones)} | System Level {character.systemLevel}
            </div>
          </div>
          <Link href="/game/character" className="text-xs text-parchment-dark hover:text-imperial-gold border border-panel-light px-2 py-1 rounded-sm">
            Full Sheet
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResourceBar type="hp" current={character.hp} max={character.hpMax} />
          <ResourceBar type="xp" current={character.xp} max={character.xpToNext} />
          <ResourceBar type="sanity" current={character.sanity} max={character.sanityMax} />
          <ResourceBar type="corruption" current={character.corruption} max={100} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/game/story" className="p-3 bg-panel border border-panel-light rounded-sm text-center hover:border-imperial-gold/40 transition-colors">
          <span className="text-sm text-parchment">Continue Story</span>
        </Link>
        <Link href="/game/inventory" className="p-3 bg-panel border border-panel-light rounded-sm text-center hover:border-imperial-gold/40 transition-colors">
          <span className="text-sm text-parchment">Inventory</span>
        </Link>
        <Link href="/game/relationships" className="p-3 bg-panel border border-panel-light rounded-sm text-center hover:border-imperial-gold/40 transition-colors">
          <span className="text-sm text-parchment">Relationships</span>
        </Link>
      </div>

      {/* Today's Tasks */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-gothic text-imperial-gold text-lg">Today&apos;s Tasks</h2>
          <Link href="/game/tasks" className="text-xs text-parchment-dark hover:text-imperial-gold">
            Manage Tasks
          </Link>
        </div>
        <div className="space-y-2">
          {tasks.filter(t => t.active).slice(0, 5).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={async (taskId) => {
                await fetch('/api/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete', taskId, characterId, saveName }),
                });
                await refresh();
              }}
            />
          ))}
        </div>
      </div>

      {/* Active Quests */}
      {quests.active.length > 0 && (
        <div>
          <h2 className="font-gothic text-imperial-gold text-lg mb-3">Active Quests</h2>
          <div className="space-y-2">
            {quests.active.map(q => (
              <div key={q.id} className="bg-panel border border-panel-light rounded-sm p-3 flex justify-between items-center">
                <span className="text-sm text-parchment">{q.title}</span>
                <span className="text-xs text-imperial-gold">{q.objectivesComplete}/{q.objectivesTotal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Message */}
      <div className="font-mono text-xs text-system-green-dim opacity-50 text-center mt-8">
        [SYSTEM] Operator status: Active. Performance monitoring enabled.
      </div>
    </div>
  );
}
