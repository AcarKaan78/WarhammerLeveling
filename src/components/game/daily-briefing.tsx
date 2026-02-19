'use client';

import { Notification } from '@/components/ui/notification';

interface DailyBriefingData {
  isNewDay: boolean;
  gameDay: number;
  notifications: string[];
  brokenStreaks: string[];
  nightmareReport: { hadNightmare: boolean; description?: string | null; sanityLoss: number };
  dailyEvent: { id: string; title: string; description: string } | null;
  triggeredConsequences: string[];
  warnings: string[];
  xpCap: number;
}

interface DailyBriefingProps {
  briefing: DailyBriefingData;
  onDismiss?: () => void;
}

export function DailyBriefing({ briefing, onDismiss }: DailyBriefingProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-lg">Day {briefing.gameDay}</h2>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-parchment-dark hover:text-parchment px-2 py-1 border border-panel-light rounded-sm"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="text-xs text-parchment-dark">
        Daily XP Cap: {briefing.xpCap}
      </div>

      {/* Nightmare */}
      {briefing.nightmareReport.hadNightmare && (
        <div className="bg-warp-blue border border-warp-purple/30 rounded-sm p-3">
          <div className="text-xs text-corruption-glow font-mono mb-1">NIGHTMARE</div>
          <p className="text-sm text-parchment">{briefing.nightmareReport.description}</p>
          <p className="text-xs text-blood mt-1">Sanity -{briefing.nightmareReport.sanityLoss}</p>
        </div>
      )}

      {/* Broken Streaks */}
      {briefing.brokenStreaks.length > 0 && (
        <div className="space-y-1">
          {briefing.brokenStreaks.map((streak, i) => (
            <Notification key={i} message={`Streak broken: ${streak}`} type="warning" duration={0} />
          ))}
        </div>
      )}

      {/* Daily Event */}
      {briefing.dailyEvent && (
        <div className="bg-panel border border-imperial-gold/20 rounded-sm p-3">
          <div className="text-xs text-imperial-gold font-mono mb-1">EVENT</div>
          <h3 className="text-parchment font-semibold text-sm">{briefing.dailyEvent.title}</h3>
          <p className="text-xs text-parchment-dark mt-1">{briefing.dailyEvent.description}</p>
        </div>
      )}

      {/* Triggered Consequences */}
      {briefing.triggeredConsequences.map((c, i) => (
        <Notification key={`cons-${i}`} message={c} type="system" duration={0} />
      ))}

      {/* Warnings */}
      {briefing.warnings.map((w, i) => (
        <Notification key={`warn-${i}`} message={w} type="error" duration={0} />
      ))}

      {/* General Notifications */}
      {briefing.notifications.map((n, i) => (
        <Notification key={`notif-${i}`} message={n} type="info" duration={0} />
      ))}
    </div>
  );
}
