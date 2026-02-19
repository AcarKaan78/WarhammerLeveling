'use client';

import { useTheme } from '@/context/theme-context';

interface WarpCorruptionProps {
  children: React.ReactNode;
}

export function WarpCorruption({ children }: WarpCorruptionProps) {
  const { corruptionOverlay } = useTheme();

  if (corruptionOverlay <= 0) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div
        className="pointer-events-none absolute inset-0 animate-corruption-pulse rounded-sm"
        style={{
          background: `radial-gradient(ellipse at center, rgba(107, 0, 153, ${corruptionOverlay * 0.15}) 0%, transparent 70%)`,
        }}
      />
      {corruptionOverlay > 0.3 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(107, 0, 153, ${corruptionOverlay * 0.05}) 100%)`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
}
