'use client';

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

type NotifClass = 'reward' | 'penalty' | 'neutral';

function classifyNotification(msg: string): NotifClass {
  const lower = msg.toLowerCase();
  if (
    lower.includes('sanity +') || lower.includes('corruption -') ||
    lower.includes('purges the taint') || lower.includes('tasks completed')
  ) return 'reward';
  if (
    lower.includes('sanity -') || lower.includes('no self-care') ||
    lower.includes('broken streaks cost') || lower.includes('nightmare')
  ) return 'penalty';
  return 'neutral';
}

const NOTIF_STYLES: Record<NotifClass, { border: string; bg: string; text: string; icon: string }> = {
  reward: {
    border: 'border-sanity-stable/50',
    bg: 'bg-sanity-stable/10',
    text: 'text-sanity-stable',
    icon: '+',
  },
  penalty: {
    border: 'border-blood/40',
    bg: 'bg-blood/5',
    text: 'text-blood-bright',
    icon: '!',
  },
  neutral: {
    border: 'border-panel-light',
    bg: 'bg-panel',
    text: 'text-parchment',
    icon: '>',
  },
};

export function DailyBriefing({ briefing, onDismiss }: DailyBriefingProps) {
  const rewards = briefing.notifications.filter(n => classifyNotification(n) === 'reward');
  const penalties = briefing.notifications.filter(n => classifyNotification(n) === 'penalty');
  const neutral = briefing.notifications.filter(n => classifyNotification(n) === 'neutral');

  return (
    <div className="bg-dark-slate border border-imperial-gold/30 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-panel-light bg-panel">
        <div>
          <h2 className="font-gothic text-imperial-gold text-lg">Day {briefing.gameDay} — Daily Briefing</h2>
          <div className="text-[10px] text-parchment-dark uppercase tracking-[0.15em] mt-0.5">
            Daily XP Cap: {briefing.xpCap}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-parchment-dark hover:text-imperial-gold px-3 py-1.5 border border-panel-light hover:border-imperial-gold/40 rounded-sm transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Nightmare */}
        {briefing.nightmareReport.hadNightmare && (
          <div className="bg-warp-blue border border-warp-purple/30 rounded-sm p-3">
            <div className="text-xs text-corruption-glow font-mono mb-1 tracking-wider">/// NIGHTMARE ///</div>
            <p className="text-sm text-parchment italic">{briefing.nightmareReport.description}</p>
            <p className="text-xs text-blood mt-2 font-mono">Sanity -{briefing.nightmareReport.sanityLoss}</p>
          </div>
        )}

        {/* Rewards Section */}
        {rewards.length > 0 && (
          <div className="border border-sanity-stable/30 bg-sanity-stable/5 rounded-sm p-3">
            <div className="text-[10px] text-sanity-stable uppercase tracking-[0.2em] mb-2 font-mono">
              /// REWARDS ///
            </div>
            <div className="space-y-1.5">
              {rewards.map((n, i) => {
                const style = NOTIF_STYLES.reward;
                return (
                  <div key={`r-${i}`} className={`flex items-center gap-2 text-sm font-mono ${style.text}`}>
                    <span className="w-4 text-center text-xs opacity-70">{style.icon}</span>
                    <span>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Penalties Section */}
        {(penalties.length > 0 || briefing.brokenStreaks.length > 0) && (
          <div className="border border-blood/20 bg-blood/5 rounded-sm p-3">
            <div className="text-[10px] text-blood uppercase tracking-[0.2em] mb-2 font-mono">
              /// PENALTIES ///
            </div>
            <div className="space-y-1.5">
              {briefing.brokenStreaks.length > 0 && (
                <div className="flex items-center gap-2 text-sm font-mono text-sanity-stressed">
                  <span className="w-4 text-center text-xs opacity-70">!</span>
                  <span>Streaks broken: {briefing.brokenStreaks.join(', ')}</span>
                </div>
              )}
              {penalties.map((n, i) => (
                <div key={`p-${i}`} className="flex items-center gap-2 text-sm font-mono text-blood-bright">
                  <span className="w-4 text-center text-xs opacity-70">!</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Neutral Notifications */}
        {neutral.map((n, i) => (
          <div key={`n-${i}`} className="flex items-center gap-2 text-sm text-parchment border border-panel-light rounded-sm p-2">
            <span className="w-4 text-center text-xs text-parchment-dark">{'>'}</span>
            <span>{n}</span>
          </div>
        ))}

        {/* Daily Event */}
        {briefing.dailyEvent && (
          <div className="bg-panel border border-imperial-gold/20 rounded-sm p-3">
            <div className="text-[10px] text-imperial-gold font-mono mb-1 tracking-wider">/// EVENT ///</div>
            <h3 className="text-parchment font-gothic text-sm">{briefing.dailyEvent.title}</h3>
            <p className="text-xs text-parchment-dark mt-1">{briefing.dailyEvent.description}</p>
          </div>
        )}

        {/* Triggered Consequences */}
        {briefing.triggeredConsequences.map((c, i) => (
          <div key={`cons-${i}`} className="flex items-center gap-2 text-sm font-mono text-system-green border border-system-green-dim/30 bg-void-black rounded-sm p-2">
            <span className="w-4 text-center text-xs opacity-70">{'>'}</span>
            <span>{c}</span>
          </div>
        ))}

        {/* Warnings */}
        {briefing.warnings.length > 0 && (
          <div className="border border-sanity-stressed/30 bg-sanity-stressed/5 rounded-sm p-3">
            <div className="text-[10px] text-sanity-stressed uppercase tracking-[0.2em] mb-2 font-mono">
              /// WARNINGS ///
            </div>
            <div className="space-y-1.5">
              {briefing.warnings.map((w, i) => (
                <div key={`warn-${i}`} className="flex items-center gap-2 text-sm text-sanity-stressed">
                  <span className="w-4 text-center text-xs opacity-70">!</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
