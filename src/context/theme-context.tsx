'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useGameContext } from './game-context';
import { COLORS } from '@/lib/constants';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  accent: string;
  border: string;
  glow: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
  sanityLevel: string;
  corruptionLevel: string;
  glitchIntensity: number;
  corruptionOverlay: number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSanityTheme(sanityState: string): Partial<ThemeColors> {
  switch (sanityState) {
    case 'shattered':
      return { background: '#0f0808', text: '#cc9999', glow: COLORS.sanityShattered };
    case 'breaking':
      return { background: '#0d0a08', text: '#ccaa99', glow: COLORS.sanityBreaking };
    case 'disturbed':
      return { background: '#0b0a0a', glow: COLORS.sanityDisturbed };
    case 'stressed':
      return { glow: COLORS.sanityStressed };
    default:
      return {};
  }
}

function getCorruptionTheme(corruptionState: string): Partial<ThemeColors> {
  switch (corruptionState) {
    case 'lost':
      return { accent: '#660066', border: '#440044', glow: COLORS.corruptionLost };
    case 'damned':
      return { accent: '#880044', border: '#440022', glow: COLORS.corruptionDamned };
    case 'corrupted':
      return { accent: '#993366', glow: COLORS.corruptionCorrupted };
    case 'tainted':
      return { glow: COLORS.corruptionTainted };
    default:
      return {};
  }
}

function getGlitchIntensity(sanityState: string): number {
  const intensities: Record<string, number> = {
    stable: 0,
    stressed: 0.1,
    disturbed: 0.3,
    breaking: 0.5,
    shattered: 0.8,
    lost: 1.0,
  };
  return intensities[sanityState] ?? 0;
}

function getCorruptionOverlay(corruptionState: string): number {
  const overlays: Record<string, number> = {
    pure: 0,
    untainted: 0,
    touched: 0.05,
    tainted: 0.15,
    corrupted: 0.3,
    damned: 0.5,
    lost: 0.7,
  };
  return overlays[corruptionState] ?? 0;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { gameState } = useGameContext();

  const sanityLevel = gameState?.character.sanityState ?? 'stable';
  const corruptionLevel = gameState?.character.corruptionState ?? 'pure';

  const value = useMemo<ThemeContextValue>(() => {
    const baseColors: ThemeColors = {
      background: COLORS.background,
      surface: COLORS.surface,
      text: COLORS.textPrimary,
      accent: COLORS.primary,
      border: COLORS.border,
      glow: COLORS.primary,
    };

    const sanityOverrides = getSanityTheme(sanityLevel);
    const corruptionOverrides = getCorruptionTheme(corruptionLevel);

    return {
      colors: { ...baseColors, ...sanityOverrides, ...corruptionOverrides },
      sanityLevel,
      corruptionLevel,
      glitchIntensity: getGlitchIntensity(sanityLevel),
      corruptionOverlay: getCorruptionOverlay(corruptionLevel),
    };
  }, [sanityLevel, corruptionLevel]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
