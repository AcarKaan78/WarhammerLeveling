'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ANIMATION } from '@/lib/constants';

interface SanityEffects {
  glitchActive: boolean;
  textCorrupted: boolean;
  fakeNotification: string | null;
  screenShake: boolean;
  colorShift: boolean;
}

interface UseSanityEffectsReturn extends SanityEffects {
  applyTextGlitch: (text: string) => string;
  dismissFakeNotification: () => void;
}

const GLITCH_CHARS = '█▓▒░╗╔╚╝║═╣╠╩╦╬';
const FAKE_NOTIFICATIONS = [
  '[SYSTEM] Corruption detected in memory banks...',
  '[ALERT] Something is watching you.',
  '[WARNING] Sanity threshold exceeded. Report to Medicae.',
  '[SYSTEM] Voices detected on subchannel Ω-7.',
  '[ERROR] Reality anchor failing. Please stand by.',
  '[ALERT] Your companion said something behind your back.',
  '[SYSTEM] Task streak broken. (This may not be true.)',
  '[WARNING] The walls are listening.',
  '[NOTICE] Inquisitorial audit scheduled for your sector.',
  '[ERROR] Faith shield degraded. Pray harder.',
];

export function useSanityEffects(sanityState: string): UseSanityEffectsReturn {
  const [glitchActive, setGlitchActive] = useState(false);
  const [textCorrupted, setTextCorrupted] = useState(false);
  const [fakeNotification, setFakeNotification] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [colorShift, setColorShift] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const intensity = (() => {
    switch (sanityState) {
      case 'stressed': return 0.1;
      case 'disturbed': return 0.3;
      case 'breaking': return 0.5;
      case 'shattered': return 0.8;
      case 'lost': return 1.0;
      default: return 0;
    }
  })();

  useEffect(() => {
    if (intensity <= 0) {
      setGlitchActive(false);
      setTextCorrupted(false);
      setFakeNotification(null);
      setScreenShake(false);
      setColorShift(false);
      return;
    }

    const scheduleEffect = () => {
      const baseInterval = ANIMATION.glitchInterval;
      const interval = baseInterval * (1 - intensity * 0.7);

      timerRef.current = setTimeout(() => {
        const roll = Math.random();

        if (roll < 0.3 * intensity) {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 200 + Math.random() * 500);
        } else if (roll < 0.5 * intensity) {
          setTextCorrupted(true);
          setTimeout(() => setTextCorrupted(false), 1000 + Math.random() * 2000);
        } else if (roll < 0.6 * intensity) {
          const msg = FAKE_NOTIFICATIONS[Math.floor(Math.random() * FAKE_NOTIFICATIONS.length)];
          setFakeNotification(msg);
          setTimeout(() => setFakeNotification(null), 5000);
        } else if (roll < 0.7 * intensity) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        } else if (roll < 0.8 * intensity) {
          setColorShift(true);
          setTimeout(() => setColorShift(false), 1000);
        }

        scheduleEffect();
      }, interval);
    };

    scheduleEffect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [intensity]);

  const applyTextGlitch = useCallback((text: string): string => {
    if (intensity <= 0) return text;

    const chars = text.split('');
    const numGlitches = Math.floor(chars.length * intensity * 0.1);

    for (let i = 0; i < numGlitches; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }

    return chars.join('');
  }, [intensity]);

  const dismissFakeNotification = useCallback(() => {
    setFakeNotification(null);
  }, []);

  return {
    glitchActive,
    textCorrupted,
    fakeNotification,
    screenShake,
    colorShift,
    applyTextGlitch,
    dismissFakeNotification,
  };
}
