'use client';

import { useState, useEffect } from 'react';

interface DiceRollAnimationProps {
  targetNumber: number;
  finalRoll: number;
  success: boolean;
  onComplete?: () => void;
}

export function DiceRollAnimation({ targetNumber, finalRoll, success, onComplete }: DiceRollAnimationProps) {
  const [rolling, setRolling] = useState(true);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const maxFrames = 20;
    const interval = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 100) + 1);
      frame++;
      if (frame >= maxFrames) {
        clearInterval(interval);
        setDisplay(finalRoll);
        setRolling(false);
        setTimeout(() => onComplete?.(), 1000);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [finalRoll, onComplete]);

  return (
    <div className="flex flex-col items-center py-4">
      <div className={`
        text-5xl font-mono font-bold transition-all duration-300
        ${rolling ? 'text-parchment' : success ? 'text-sanity-stable' : 'text-blood-bright'}
      `}>
        {display.toString().padStart(2, '0')}
      </div>

      <div className="text-xs text-parchment-dark mt-2">
        Target: {targetNumber}
      </div>

      {!rolling && (
        <div className={`text-sm font-gothic font-bold mt-2 ${success ? 'text-sanity-stable' : 'text-blood-bright'}`}>
          {success ? 'Success' : 'Failure'}
        </div>
      )}
    </div>
  );
}
