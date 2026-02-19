'use client';

import { useState, useEffect } from 'react';

interface Perk {
  id: string;
  name: string;
  tree: string;
  tier: number;
  description: string;
  prerequisites: { perks: string[]; stats: Record<string, number>; level: number };
}

interface PerkTreeProps {
  unlockedPerks: string[];
  characterLevel: number;
  primaryStats: Record<string, number>;
  freePerkPoints: number;
  onUnlock?: (perkId: string) => void;
}

const TREE_COLORS: Record<string, string> = {
  combat: 'border-blood/40 text-blood-bright',
  psychic: 'border-corruption-glow/40 text-corruption-glow',
  social: 'border-blue-400/40 text-blue-400',
  survival: 'border-sanity-stable/40 text-sanity-stable',
  technical: 'border-orange-400/40 text-orange-400',
};

export function PerkTree({ unlockedPerks, characterLevel, primaryStats, freePerkPoints, onUnlock }: PerkTreeProps) {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [selectedTree, setSelectedTree] = useState('combat');

  useEffect(() => {
    fetch('/api/data?type=perks')
      .then(r => r.ok ? r.json() : [])
      .then(setPerks)
      .catch(() => setPerks([]));
  }, []);

  const trees = [...new Set(perks.map(p => p.tree))];
  const filtered = perks.filter(p => p.tree === selectedTree).sort((a, b) => a.tier - b.tier);

  const canUnlock = (perk: Perk): boolean => {
    if (unlockedPerks.includes(perk.id)) return false;
    if (freePerkPoints <= 0) return false;
    if (characterLevel < perk.prerequisites.level) return false;
    if (!perk.prerequisites.perks.every(p => unlockedPerks.includes(p))) return false;
    for (const [stat, req] of Object.entries(perk.prerequisites.stats)) {
      if ((primaryStats[stat] ?? 0) < req) return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-lg">Perk Trees</h2>
        <span className="text-sm text-imperial-gold">Points: {freePerkPoints}</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {trees.map(tree => (
          <button
            key={tree}
            onClick={() => setSelectedTree(tree)}
            className={`px-3 py-1 text-xs rounded-sm border capitalize transition-colors
              ${selectedTree === tree
                ? TREE_COLORS[tree] ?? 'border-imperial-gold text-imperial-gold'
                : 'border-panel-light text-parchment-dark hover:text-parchment'
              }
            `}
          >
            {tree}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map(tier => {
          const tierPerks = filtered.filter(p => p.tier === tier);
          if (tierPerks.length === 0) return null;
          return (
            <div key={tier}>
              <div className="text-xs text-parchment-dark mb-1">Tier {tier}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tierPerks.map(perk => {
                  const unlocked = unlockedPerks.includes(perk.id);
                  const available = canUnlock(perk);

                  return (
                    <button
                      key={perk.id}
                      onClick={() => available && onUnlock?.(perk.id)}
                      disabled={!available && !unlocked}
                      className={`p-3 rounded-sm border text-left transition-all
                        ${unlocked ? `${TREE_COLORS[perk.tree] ?? ''} bg-panel` : ''}
                        ${available ? 'border-imperial-gold/40 bg-panel hover:bg-panel-light' : ''}
                        ${!unlocked && !available ? 'border-panel-light/30 bg-void-black/30 opacity-50' : ''}
                      `}
                    >
                      <div className="flex justify-between">
                        <span className={`text-sm font-semibold ${unlocked ? '' : 'text-parchment-dark'}`}>{perk.name}</span>
                        {unlocked && <span className="text-xs text-sanity-stable">Unlocked</span>}
                      </div>
                      <p className="text-xs text-parchment-dark mt-1">{perk.description}</p>
                      {!unlocked && perk.prerequisites.level > 1 && (
                        <p className="text-xs text-parchment-dark/50 mt-1">Requires level {perk.prerequisites.level}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
