'use client';

import { useCallback, useRef, useState } from 'react';

type SoundEffect =
  | 'click'
  | 'task_complete'
  | 'level_up'
  | 'combat_hit'
  | 'combat_miss'
  | 'combat_critical'
  | 'dice_roll'
  | 'notification'
  | 'warp_surge'
  | 'door_open'
  | 'menu_open'
  | 'error';

interface UseAudioReturn {
  play: (sound: SoundEffect) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

// Placeholder audio system — plays no actual sounds yet.
// When audio files are added to /public/sounds/, uncomment the Audio logic.
export function useAudio(): UseAudioReturn {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const lastPlayedRef = useRef<Record<string, number>>({});

  const play = useCallback((sound: SoundEffect) => {
    if (muted) return;

    // Debounce: don't play the same sound within 50ms
    const now = Date.now();
    if (lastPlayedRef.current[sound] && now - lastPlayedRef.current[sound] < 50) return;
    lastPlayedRef.current[sound] = now;

    // Placeholder: when audio files exist, use:
    // const audio = new Audio(`/sounds/${sound}.mp3`);
    // audio.volume = volume;
    // audio.play().catch(() => {});
  }, [muted, volume]);

  return { play, muted, setMuted, volume, setVolume };
}
