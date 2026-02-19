'use client';

import { useEffect, useState } from 'react';
import { ANIMATION } from '@/lib/constants';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color?: string;
  bgColor?: string;
  showNumbers?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatBar({
  label,
  current,
  max,
  color = 'bg-imperial-gold',
  bgColor = 'bg-dark-slate',
  showNumbers = true,
  animated = true,
  size = 'md',
}: StatBarProps) {
  const [displayWidth, setDisplayWidth] = useState(animated ? 0 : (current / max) * 100);

  useEffect(() => {
    if (!animated) {
      setDisplayWidth((current / max) * 100);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayWidth((current / max) * 100);
    }, 50);
    return () => clearTimeout(timer);
  }, [current, max, animated]);

  const heights = { sm: 'h-2', md: 'h-4', lg: 'h-6' };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-parchment-dark uppercase tracking-wider">{label}</span>
        {showNumbers && (
          <span className="text-xs font-mono text-parchment">
            {Math.round(current)}/{max}
          </span>
        )}
      </div>
      <div className={`w-full ${heights[size]} ${bgColor} rounded-sm overflow-hidden border border-panel-light`}>
        <div
          className={`h-full ${color} rounded-sm`}
          style={{
            width: `${Math.min(100, Math.max(0, displayWidth))}%`,
            transition: animated ? `width ${ANIMATION.barFill}ms ease-out` : 'none',
          }}
        />
      </div>
    </div>
  );
}
