'use client';

import { useEffect, useState } from 'react';
import { ANIMATION } from '@/lib/constants';

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system' | 'fake';

interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  onDismiss?: () => void;
}

const TYPE_STYLES: Record<NotificationType, string> = {
  info: 'border-panel-light bg-panel text-parchment',
  success: 'border-sanity-stable/50 bg-sanity-stable/10 text-sanity-stable',
  warning: 'border-sanity-stressed/50 bg-sanity-stressed/10 text-sanity-stressed',
  error: 'border-blood/50 bg-blood/10 text-blood-bright',
  system: 'border-system-green-dim/50 bg-void-black text-system-green font-mono',
  fake: 'border-corruption-glow/50 bg-warp-blue/30 text-corruption-glow font-mono animate-text-flicker',
};

export function Notification({ message, type = 'info', duration = 5000, onDismiss }: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), ANIMATION.fadeOut);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`
        border rounded-sm p-3 text-sm shadow-lg
        transition-opacity duration-200
        ${TYPE_STYLES[type]}
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={() => { setVisible(false); setTimeout(() => onDismiss(), ANIMATION.fadeOut); }}
            className="text-parchment-dark hover:text-parchment text-xs"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
