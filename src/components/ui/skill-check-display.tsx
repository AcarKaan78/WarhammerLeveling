'use client';

import { useEffect, useState } from 'react';

interface SkillCheckDisplayProps {
  roll: number;
  target: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
  margin: number;
  skillName?: string;
  onComplete?: () => void;
}

export function SkillCheckDisplay({
  roll,
  target,
  success,
  criticalSuccess,
  criticalFailure,
  margin,
  skillName,
  onComplete,
}: SkillCheckDisplayProps) {
  const [phase, setPhase] = useState<'rolling' | 'result'>('rolling');
  const [displayRoll, setDisplayRoll] = useState(0);

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 100) + 1);
      frame++;
      if (frame > 15) {
        clearInterval(interval);
        setDisplayRoll(roll);
        setPhase('result');
        setTimeout(() => onComplete?.(), 1500);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [roll, onComplete]);

  const resultColor = criticalSuccess
    ? 'text-imperial-gold'
    : criticalFailure
      ? 'text-blood-bright'
      : success
        ? 'text-sanity-stable'
        : 'text-blood';

  const resultLabel = criticalSuccess
    ? 'CRITICAL SUCCESS!'
    : criticalFailure
      ? 'CRITICAL FAILURE!'
      : success
        ? 'SUCCESS'
        : 'FAILURE';

  return (
    <div className="bg-void-black border border-panel-light rounded-sm p-4 text-center">
      {skillName && (
        <div className="text-xs text-parchment-dark uppercase tracking-wider mb-2">
          {skillName} Check
        </div>
      )}

      <div className="flex justify-center items-center gap-6 my-3">
        <div className="text-center">
          <div className="text-xs text-parchment-dark mb-1">Roll</div>
          <div className={`text-3xl font-mono font-bold ${phase === 'result' ? resultColor : 'text-parchment'}`}>
            {displayRoll}
          </div>
        </div>
        <div className="text-parchment-dark text-lg">vs</div>
        <div className="text-center">
          <div className="text-xs text-parchment-dark mb-1">Target</div>
          <div className="text-3xl font-mono font-bold text-parchment">{target}</div>
        </div>
      </div>

      {phase === 'result' && (
        <div className="mt-2">
          <div className={`text-lg font-gothic font-bold ${resultColor}`}>
            {resultLabel}
          </div>
          <div className="text-xs text-parchment-dark mt-1">
            Margin: {margin}
          </div>
        </div>
      )}
    </div>
  );
}
