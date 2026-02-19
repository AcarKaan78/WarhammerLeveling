'use client';

import { StatBar } from './stat-bar';

interface NPCCardProps {
  npc: {
    id: string;
    name: string;
    title?: string;
    role: string;
    isAlive: boolean;
    affinity: number;
    respect: number;
    fear?: number;
    knowledge?: number;
    loyalty?: number;
  };
  onClick?: () => void;
}

export function NPCCard({ npc, onClick }: NPCCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 border rounded-sm w-full text-left transition-colors
        ${npc.isAlive
          ? 'border-panel-light bg-panel hover:bg-panel-light'
          : 'border-blood/20 bg-blood/5 opacity-60'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-parchment font-gothic font-semibold">{npc.name}</span>
          {npc.title && <span className="text-xs text-parchment-dark block">{npc.title}</span>}
        </div>
        <span className="text-xs text-imperial-gold">{npc.role}</span>
      </div>

      {!npc.isAlive && (
        <div className="text-xs text-blood mb-2">[DECEASED]</div>
      )}

      <div className="space-y-1">
        <StatBar label="Affinity" current={Math.max(0, npc.affinity)} max={100} color="bg-sanity-stable" size="sm" showNumbers={false} />
        <StatBar label="Respect" current={Math.max(0, npc.respect)} max={100} color="bg-imperial-gold" size="sm" showNumbers={false} />
        {npc.fear !== undefined && npc.fear > 0 && (
          <StatBar label="Fear" current={npc.fear} max={100} color="bg-blood" size="sm" showNumbers={false} />
        )}
      </div>
    </button>
  );
}
