'use client';

interface ChoiceConsequencesProps {
  notifications: string[];
  skillCheckResult?: {
    roll: number;
    target: number;
    success: boolean;
    margin: number;
    criticalSuccess: boolean;
    criticalFailure: boolean;
  };
  onContinue: () => void;
  canReroll?: boolean;
  onReroll?: () => void;
  rerollCost?: number;
  playerThrones?: number;
  isRerolling?: boolean;
}

function formatStatName(stat: string): string {
  const names: Record<string, string> = {
    weaponSkill: 'Weapon Skill', ballisticSkill: 'Ballistic Skill',
    strength: 'Strength', toughness: 'Toughness', agility: 'Agility',
    intelligence: 'Intelligence', perception: 'Perception',
    willpower: 'Willpower', fellowship: 'Fellowship',
  };
  return names[stat] ?? stat;
}

export function ChoiceConsequences({
  notifications, skillCheckResult, onContinue,
  canReroll, onReroll, rerollCost = 10, playerThrones = 0, isRerolling,
}: ChoiceConsequencesProps) {
  const hasContent = skillCheckResult || notifications.length > 0;
  const canAffordReroll = playerThrones >= rerollCost;

  return (
    <div className="space-y-3 mt-4">
      {/* Skill Check — rendered as a dramatic narrative block */}
      {skillCheckResult && (
        <div className={`border-l-4 p-4 rounded-sm ${
          skillCheckResult.success
            ? 'border-system-green bg-system-green-dim/5'
            : 'border-blood bg-blood/5'
        }`}>
          {/* The dice roll narrative */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-imperial-gold">{skillCheckResult.roll}</div>
                <div className="text-[10px] text-parchment-dark uppercase tracking-wider">Rolled</div>
              </div>
              <div className="text-parchment-dark text-2xl font-thin">/</div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-parchment">{skillCheckResult.target}</div>
                <div className="text-[10px] text-parchment-dark uppercase tracking-wider">Target</div>
              </div>
            </div>

            <div className="flex-1">
              <div className={`text-lg font-gothic tracking-wider ${
                skillCheckResult.criticalSuccess ? 'text-imperial-gold' :
                skillCheckResult.criticalFailure ? 'text-blood' :
                skillCheckResult.success ? 'text-system-green' : 'text-blood'
              }`}>
                {skillCheckResult.criticalSuccess ? 'CRITICAL SUCCESS' :
                 skillCheckResult.criticalFailure ? 'CRITICAL FAILURE' :
                 skillCheckResult.success ? 'SUCCESS' : 'FAILURE'}
              </div>
              <div className="text-xs text-parchment-dark mt-0.5">
                {skillCheckResult.success
                  ? skillCheckResult.criticalSuccess
                    ? 'The Emperor guides your hand. Penalties greatly reduced.'
                    : 'You succeed. Negative consequences are lessened.'
                  : skillCheckResult.criticalFailure
                    ? 'A catastrophic failure. The consequences are severe.'
                    : 'You fail. The consequences weigh heavier upon you.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consequences — each as its own styled block */}
      {notifications.length > 0 && (
        <div className="bg-panel border border-panel-light rounded-sm p-3">
          <div className="text-[10px] text-parchment-dark uppercase tracking-[0.2em] mb-2">
            {hasContent ? '/// CONSEQUENCES ///' : '/// RESULT ///'}
          </div>
          <div className="space-y-1.5">
            {notifications.map((notification, i) => {
              let icon = '';
              let color = 'text-parchment';

              if (notification.includes('XP')) {
                icon = '+'; color = 'text-system-green';
              } else if (notification.toLowerCase().includes('corruption')) {
                icon = '!'; color = 'text-warp-purple';
              } else if (notification.toLowerCase().includes('sanity') && notification.startsWith('-')) {
                icon = '-'; color = 'text-blood';
              } else if (notification.toLowerCase().includes('sanity') && notification.startsWith('+')) {
                icon = '+'; color = 'text-system-green';
              } else if (notification.toLowerCase().includes('thrones')) {
                icon = '$'; color = 'text-imperial-gold';
              } else if (notification.toLowerCase().includes('received') || notification.toLowerCase().includes('item')) {
                icon = '*'; color = 'text-imperial-gold';
              } else if (notification.toLowerCase().includes('passed') || notification.toLowerCase().includes('success')) {
                icon = '>'; color = 'text-system-green';
              } else if (notification.toLowerCase().includes('failed') || notification.toLowerCase().includes('failure')) {
                icon = 'x'; color = 'text-blood';
              }

              return (
                <div key={i} className={`flex items-center gap-2 text-sm font-mono ${color}`}>
                  <span className="w-4 text-center text-xs opacity-60">{icon}</span>
                  <span>{notification}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reroll — Tempt Fate Again */}
      {canReroll && onReroll && (
        <button
          onClick={onReroll}
          disabled={!canAffordReroll || isRerolling}
          className={`w-full py-3 mt-1 border rounded-sm transition-colors text-sm font-gothic tracking-[0.15em] uppercase ${
            canAffordReroll && !isRerolling
              ? 'border-imperial-gold/60 bg-imperial-gold/10 hover:bg-imperial-gold/25 text-imperial-gold'
              : 'border-parchment-dark/30 bg-panel text-parchment-dark cursor-not-allowed'
          }`}
        >
          {isRerolling
            ? 'The dice tumble...'
            : canAffordReroll
              ? `Tempt Fate Again (${rerollCost} Thrones)`
              : `Not enough Thrones (${playerThrones}/${rerollCost})`}
        </button>
      )}

      {/* Continue — styled as a narrative prompt */}
      <button
        onClick={onContinue}
        disabled={isRerolling}
        className="w-full py-3 mt-1 border border-imperial-gold/30 bg-imperial-gold/5 hover:bg-imperial-gold/15 text-imperial-gold rounded-sm transition-colors text-sm font-gothic tracking-[0.15em] uppercase"
      >
        Continue...
      </button>
    </div>
  );
}
