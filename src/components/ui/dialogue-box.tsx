'use client';

import type { NarrativeBlock } from '@/domain/models';

interface DialogueBoxProps {
  block: NarrativeBlock;
  glitchText?: boolean;
}

export function DialogueBox({ block, glitchText }: DialogueBoxProps) {
  if (block.type === 'system_message') {
    return (
      <div className="font-mono text-system-green bg-void-black border border-system-green-dim/30 p-3 rounded-sm my-2">
        <p className={glitchText ? 'animate-text-flicker' : ''}>{block.text}</p>
      </div>
    );
  }

  if (block.type === 'dialogue') {
    return (
      <div className="my-3 pl-4 border-l-2 border-imperial-gold/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-imperial-gold font-gothic text-sm font-bold">{block.speaker}</span>
          {block.speakerMood && (
            <span className="text-parchment-dark text-xs italic">({block.speakerMood})</span>
          )}
        </div>
        <p className={`text-parchment ${glitchText ? 'animate-text-flicker' : ''}`}>
          &ldquo;{block.text}&rdquo;
        </p>
      </div>
    );
  }

  // description
  return (
    <div className="my-3">
      <p className={`text-parchment-dark italic leading-relaxed ${glitchText ? 'animate-text-flicker' : ''}`}>
        {block.text}
      </p>
    </div>
  );
}
