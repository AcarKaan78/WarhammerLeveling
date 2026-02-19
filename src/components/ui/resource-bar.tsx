'use client';

import { StatBar } from './stat-bar';

interface ResourceBarProps {
  type: 'hp' | 'sanity' | 'corruption' | 'fatigue' | 'xp';
  current: number;
  max: number;
  showLabel?: boolean;
}

const RESOURCE_CONFIG = {
  hp: { label: 'HP', color: 'bg-blood-bright', bgColor: 'bg-blood/20' },
  sanity: { label: 'Sanity', color: 'bg-sanity-stable', bgColor: 'bg-panel' },
  corruption: { label: 'Corruption', color: 'bg-corruption-glow', bgColor: 'bg-warp-blue' },
  fatigue: { label: 'Fatigue', color: 'bg-yellow-600', bgColor: 'bg-panel' },
  xp: { label: 'XP', color: 'bg-green-500', bgColor: 'bg-panel' },
};

function getSanityColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  if (pct > 0.7) return 'bg-sanity-stable';
  if (pct > 0.5) return 'bg-sanity-stressed';
  if (pct > 0.3) return 'bg-sanity-disturbed';
  if (pct > 0.1) return 'bg-sanity-breaking';
  return 'bg-sanity-shattered';
}

export function ResourceBar({ type, current, max, showLabel = true }: ResourceBarProps) {
  const config = RESOURCE_CONFIG[type];
  const color = type === 'sanity' ? getSanityColor(current, max) : config.color;

  return (
    <StatBar
      label={showLabel ? config.label : ''}
      current={current}
      max={max}
      color={color}
      bgColor={config.bgColor}
      size="md"
    />
  );
}
