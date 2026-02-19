'use client';

interface SystemMessageProps {
  text: string;
  level?: number;
  variant?: 'info' | 'warning' | 'error' | 'evolution';
}

const VARIANT_STYLES = {
  info: 'text-system-green border-system-green-dim/30',
  warning: 'text-yellow-400 border-yellow-400/30',
  error: 'text-blood-bright border-blood/30',
  evolution: 'text-corruption-glow border-corruption-glow/30',
};

export function SystemMessage({ text, level, variant = 'info' }: SystemMessageProps) {
  const style = VARIANT_STYLES[variant];

  return (
    <div className={`font-mono text-sm bg-void-black border ${style} p-3 rounded-sm my-2`}>
      {level !== undefined && (
        <span className="text-xs opacity-50 mr-2">[SYS-LV{level}]</span>
      )}
      <span>{text}</span>
    </div>
  );
}
