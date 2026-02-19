'use client';

import { useSanityEffects } from '@/hooks/use-sanity-effects';
import { useEffect, useState } from 'react';

interface UnreliableNarratorProps {
  text: string;
  sanityState: string;
}

export function UnreliableNarrator({ text, sanityState }: UnreliableNarratorProps) {
  const { applyTextGlitch, textCorrupted } = useSanityEffects(sanityState);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (textCorrupted) {
      setDisplayText(applyTextGlitch(text));
    } else {
      setDisplayText(text);
    }
  }, [text, textCorrupted, applyTextGlitch]);

  return (
    <span className={textCorrupted ? 'animate-text-flicker' : ''}>
      {displayText}
    </span>
  );
}
