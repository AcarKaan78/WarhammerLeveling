'use client';

import { useSanityEffects } from '@/hooks/use-sanity-effects';

interface ScreenGlitchProps {
  sanityState: string;
  children: React.ReactNode;
}

export function ScreenGlitch({ sanityState, children }: ScreenGlitchProps) {
  const { glitchActive, screenShake, colorShift } = useSanityEffects(sanityState);

  const classes = [
    glitchActive ? 'animate-screen-glitch' : '',
    screenShake ? 'animate-screen-glitch' : '',
    colorShift ? 'hue-rotate-30' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`transition-all duration-100 ${classes}`}>
      {children}
      {glitchActive && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className="absolute inset-0 animate-scanline opacity-10"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)',
            }}
          />
        </div>
      )}
    </div>
  );
}
