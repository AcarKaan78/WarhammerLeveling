'use client';

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    hiddenDescription: string;
    category: string;
    progressive: boolean;
    maxProgress: number;
  };
  unlocked: boolean;
  progress?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  discipline: 'border-imperial-gold/40',
  combat: 'border-blood/40',
  exploration: 'border-sanity-stable/40',
  mastery: 'border-corruption-glow/40',
  story: 'border-parchment/40',
  social: 'border-blue-400/40',
  secret: 'border-warp-purple/40',
};

export function AchievementCard({ achievement, unlocked, progress = 0 }: AchievementCardProps) {
  const borderClass = CATEGORY_COLORS[achievement.category] ?? 'border-panel-light';

  return (
    <div className={`p-3 border rounded-sm transition-colors
      ${unlocked
        ? `${borderClass} bg-panel`
        : 'border-panel-light/20 bg-void-black/50'
      }
    `}>
      <div className="flex justify-between items-start">
        <span className={`font-gothic font-semibold text-sm ${unlocked ? 'text-imperial-gold' : 'text-parchment-dark'}`}>
          {unlocked ? achievement.name : '???'}
        </span>
        <span className="text-xs text-parchment-dark capitalize">{achievement.category}</span>
      </div>

      <p className={`text-xs mt-1 ${unlocked ? 'text-parchment' : 'text-parchment-dark'}`}>
        {unlocked ? achievement.description : achievement.hiddenDescription}
      </p>

      {achievement.progressive && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-dark-slate rounded-sm overflow-hidden">
            <div
              className="h-full bg-imperial-gold/60 rounded-sm transition-all duration-500"
              style={{ width: `${Math.min(100, (progress / achievement.maxProgress) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-parchment-dark mt-1">
            {progress}/{achievement.maxProgress}
          </div>
        </div>
      )}

      {unlocked && (
        <div className="mt-2 text-xs text-sanity-stable">Unlocked</div>
      )}
    </div>
  );
}
