'use client';

import { useState, useEffect } from 'react';

interface PsychicPower {
  id: string;
  discipline: string;
  name: string;
  tier: number;
  description: string;
  prerequisites: string[];
}

interface PsychicTreeProps {
  unlockedPowers: string[];
  psyRating: number;
  onUnlock?: (powerId: string) => void;
}

const DISCIPLINE_COLORS: Record<string, string> = {
  telekinesis: 'border-blue-400 text-blue-400',
  telepathy: 'border-purple-400 text-purple-400',
  pyromancy: 'border-orange-400 text-orange-400',
  divination: 'border-yellow-400 text-yellow-400',
  biomancy: 'border-green-400 text-green-400',
};

export function PsychicTree({ unlockedPowers, psyRating, onUnlock }: PsychicTreeProps) {
  const [powers, setPowers] = useState<PsychicPower[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('telekinesis');

  useEffect(() => {
    fetch('/api/data?type=psychic-powers')
      .then(r => r.ok ? r.json() : [])
      .then(setPowers)
      .catch(() => setPowers([]));
  }, []);

  const disciplines = [...new Set(powers.map(p => p.discipline))];
  const filteredPowers = powers.filter(p => p.discipline === selectedDiscipline).sort((a, b) => a.tier - b.tier);

  const canUnlock = (power: PsychicPower): boolean => {
    if (unlockedPowers.includes(power.id)) return false;
    if (psyRating < power.tier) return false;
    return power.prerequisites.every(p => unlockedPowers.includes(p));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-gothic text-imperial-gold text-lg">Psychic Disciplines</h2>
        <span className="text-sm text-corruption-glow">Psy Rating: {psyRating}</span>
      </div>

      {/* Discipline Tabs */}
      <div className="flex gap-1 flex-wrap">
        {disciplines.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDiscipline(d)}
            className={`px-3 py-1 text-xs rounded-sm border capitalize transition-colors
              ${selectedDiscipline === d
                ? DISCIPLINE_COLORS[d] ?? 'border-imperial-gold text-imperial-gold'
                : 'border-panel-light text-parchment-dark hover:text-parchment'
              }
            `}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Power Grid */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map(tier => {
          const tierPowers = filteredPowers.filter(p => p.tier === tier);
          if (tierPowers.length === 0) return null;
          return (
            <div key={tier}>
              <div className="text-xs text-parchment-dark mb-1">Tier {tier}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tierPowers.map(power => {
                  const unlocked = unlockedPowers.includes(power.id);
                  const available = canUnlock(power);
                  const colorClass = DISCIPLINE_COLORS[power.discipline] ?? 'border-panel-light text-parchment';

                  return (
                    <button
                      key={power.id}
                      onClick={() => available && onUnlock?.(power.id)}
                      disabled={!available && !unlocked}
                      className={`p-3 rounded-sm border text-left transition-all
                        ${unlocked ? `${colorClass} bg-panel` : ''}
                        ${available ? 'border-imperial-gold/40 bg-panel hover:bg-panel-light cursor-pointer' : ''}
                        ${!unlocked && !available ? 'border-panel-light/30 bg-void-black/30 opacity-50' : ''}
                      `}
                    >
                      <div className="flex justify-between">
                        <span className={`text-sm font-semibold ${unlocked ? '' : 'text-parchment-dark'}`}>{power.name}</span>
                        {unlocked && <span className="text-xs text-sanity-stable">Learned</span>}
                      </div>
                      <p className="text-xs text-parchment-dark mt-1">{power.description}</p>
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
