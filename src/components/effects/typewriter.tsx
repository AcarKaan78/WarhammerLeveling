'use client';

import { useState, useEffect, useRef } from 'react';
import { ANIMATION } from '@/lib/constants';

interface TypewriterProps {
  children: React.ReactNode;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function Typewriter({
  children,
  speed = ANIMATION.typewriterSpeed,
  delay = 0,
  onComplete,
}: TypewriterProps) {
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get text content for typewriter effect
  const textContent = typeof children === 'string' ? children : '';
  const isTextMode = typeof children === 'string';

  useEffect(() => {
    const delayTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible || !isTextMode || completed) return;

    if (charIndex >= textContent.length) {
      setCompleted(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [visible, charIndex, textContent, speed, isTextMode, completed, onComplete]);

  if (!visible) return null;

  // For non-text children, just show with fade-in
  if (!isTextMode) {
    return (
      <div className="animate-[fadeIn_0.3s_ease-in]">
        {children}
      </div>
    );
  }

  return (
    <span>
      {textContent.slice(0, charIndex)}
      {!completed && <span className="animate-typewriter-cursor">|</span>}
    </span>
  );
}
