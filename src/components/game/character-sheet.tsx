'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '@/context/game-context';
import { StatBar } from '@/components/ui/stat-bar';
import { ResourceBar } from '@/components/ui/resource-bar';
import { Loading } from '@/components/ui/loading';
import { formatStatName } from '@/lib/formatters';
import { STAT_ABBREVIATIONS } from '@/lib/constants';

type Tab = 'stats' | 'skills' | 'perks' | 'mutations';

interface SkillData {
  id: string;
  name: string;
  category: string;
  governingStat1: string;
  governingStat2?: string;
  description: string;
}

interface PerkData {
  id: string;
  name: string;
  tree: string;
  tier: number;
  description: string;
  prerequisites: { perks: string[]; stats: Record<string, number>; level: number };
  effects: Record<string, unknown>;
}

const SKILL_CATEGORIES: Record<string, string> = {
  combat: 'Combat', physical: 'Physical', mental: 'Mental',
  social: 'Social', psychic: 'Psychic',
};

const PERK_TREES: Record<string, string> = {
  combat: 'Combat', psychic: 'Psychic', social: 'Social',
  survival: 'Survival', technical: 'Technical',
};

export function CharacterSheet() {
  const { gameState, loading, characterId, saveName, refresh } = useGameContext();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [allocating, setAllocating] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [perks, setPerks] = useState<PerkData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load skills/perks data
  useEffect(() => {
    if (!dataLoaded) {
      fetch('/api/skills')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setSkills(data.skills ?? []);
            setPerks(data.perks ?? []);
          }
          setDataLoaded(true);
        })
        .catch(() => setDataLoaded(true));
    }
  }, [dataLoaded]);

  const handleAllocateStat = useCallback(async (stat: string) => {
    if (!characterId || allocating) return;
    setAllocating(stat);
    try {
      const res = await fetch('/api/character', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate_stat', characterId, saveName, stat }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch {
      // silently fail
    } finally {
      setAllocating(null);
    }
  }, [characterId, saveName, allocating, refresh]);

  if (loading || !gameState) return <Loading text="Loading character..." />;
  const { character } = gameState;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'stats', label: 'Stats', badge: character.freeStatPoints > 0 ? character.freeStatPoints : undefined },
    { key: 'skills', label: 'Skills', badge: character.freeSkillPoints > 0 ? character.freeSkillPoints : undefined },
    { key: 'perks', label: 'Perks', badge: character.freePerkPoints > 0 ? character.freePerkPoints : undefined },
    { key: 'mutations', label: 'Mutations' },
  ];

  const primaryStats = character.primaryStats as Record<string, number>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-panel border border-panel-light rounded-sm p-4">
        <h2 className="font-gothic text-imperial-gold text-xl">{character.name}</h2>
        <div className="flex gap-4 mt-1 text-sm text-parchment-dark">
          <span>Level {character.level}</span>
          <span>{character.difficulty}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <ResourceBar type="hp" current={character.hp} max={character.hpMax} />
          <ResourceBar type="xp" current={character.xp} max={character.xpToNext} />
          <ResourceBar type="sanity" current={character.sanity} max={character.sanityMax} />
          <ResourceBar type="corruption" current={character.corruption} max={100} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-panel-light">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-mono transition-colors border-b-2 relative
              ${activeTab === tab.key
                ? 'text-imperial-gold border-imperial-gold'
                : 'text-parchment-dark border-transparent hover:text-parchment'
              }
            `}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="absolute -top-1 -right-1 bg-imperial-gold text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          {character.freeStatPoints > 0 && (
            <div className="bg-imperial-gold/10 border border-imperial-gold/30 rounded-sm p-2 text-xs text-imperial-gold text-center">
              {character.freeStatPoints} stat point{character.freeStatPoints > 1 ? 's' : ''} available to allocate
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(primaryStats).map(([key, value]) => (
              <div key={key} className="bg-panel border border-panel-light rounded-sm p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-parchment">{formatStatName(key)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-parchment-dark">{STAT_ABBREVIATIONS[key]}</span>
                    <span className="text-sm text-imperial-gold font-mono w-6 text-right">{value}</span>
                    {character.freeStatPoints > 0 && (
                      <button
                        onClick={() => handleAllocateStat(key)}
                        disabled={allocating !== null}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-imperial-gold/20 hover:bg-imperial-gold/40 border border-imperial-gold/50 rounded-sm text-imperial-gold transition-colors disabled:opacity-30"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
                <StatBar label="" current={value} max={100} showNumbers size="sm" />
              </div>
            ))}
          </div>

          <div className="bg-panel border border-panel-light rounded-sm p-3">
            <h3 className="text-sm font-gothic text-imperial-gold mb-2">Available Points</h3>
            <div className="flex gap-6 text-sm">
              <span className="text-parchment">Stat: <strong className="text-imperial-gold">{character.freeStatPoints}</strong></span>
              <span className="text-parchment">Skill: <strong className="text-imperial-gold">{character.freeSkillPoints}</strong></span>
              <span className="text-parchment">Perk: <strong className="text-imperial-gold">{character.freePerkPoints}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          {character.freeSkillPoints > 0 && (
            <div className="bg-imperial-gold/10 border border-imperial-gold/30 rounded-sm p-2 text-xs text-imperial-gold text-center">
              {character.freeSkillPoints} skill point{character.freeSkillPoints > 1 ? 's' : ''} available
            </div>
          )}

          {Object.entries(SKILL_CATEGORIES).map(([catKey, catName]) => {
            const catSkills = skills.filter(s => s.category === catKey);
            if (catSkills.length === 0) return null;

            return (
              <div key={catKey}>
                <h3 className="text-sm font-gothic text-imperial-gold mb-2 uppercase tracking-wide">{catName}</h3>
                <div className="space-y-1">
                  {catSkills.map(skill => (
                    <div key={skill.id} className="bg-panel border border-panel-light rounded-sm p-2 flex justify-between items-center">
                      <div className="flex-1">
                        <span className="text-sm text-parchment">{skill.name}</span>
                        <div className="text-[10px] text-parchment-dark">
                          {formatStatName(skill.governingStat1)}
                          {skill.governingStat2 ? ` / ${formatStatName(skill.governingStat2)}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-parchment-dark font-mono">Lv 0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Perks Tab */}
      {activeTab === 'perks' && (
        <div className="space-y-4">
          {character.freePerkPoints > 0 && (
            <div className="bg-imperial-gold/10 border border-imperial-gold/30 rounded-sm p-2 text-xs text-imperial-gold text-center">
              {character.freePerkPoints} perk point{character.freePerkPoints > 1 ? 's' : ''} available
            </div>
          )}

          {Object.entries(PERK_TREES).map(([treeKey, treeName]) => {
            const treePerks = perks.filter(p => p.tree === treeKey);
            if (treePerks.length === 0) return null;

            return (
              <div key={treeKey}>
                <h3 className="text-sm font-gothic text-imperial-gold mb-2 uppercase tracking-wide">{treeName}</h3>
                <div className="space-y-1">
                  {[1, 2, 3].map(tier => {
                    const tierPerks = treePerks.filter(p => p.tier === tier);
                    if (tierPerks.length === 0) return null;

                    return (
                      <div key={tier} className="space-y-1">
                        <div className="text-[10px] text-parchment-dark uppercase tracking-wider ml-1">Tier {tier}</div>
                        {tierPerks.map(perk => {
                          const meetsLevel = character.level >= perk.prerequisites.level;
                          const meetsStats = Object.entries(perk.prerequisites.stats).every(
                            ([stat, req]) => (primaryStats[stat] ?? 0) >= req
                          );
                          const canUnlock = meetsLevel && meetsStats;

                          return (
                            <div
                              key={perk.id}
                              className={`bg-panel border rounded-sm p-2 ${canUnlock ? 'border-imperial-gold/30' : 'border-panel-light opacity-50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <span className="text-sm text-parchment">{perk.name}</span>
                                  <div className="text-[10px] text-parchment-dark mt-0.5">{perk.description}</div>
                                </div>
                                <span className="text-[10px] text-parchment-dark shrink-0 ml-2">Lv {perk.prerequisites.level}+</span>
                              </div>
                              {!canUnlock && (
                                <div className="text-[10px] text-blood mt-1">
                                  {!meetsLevel && `Requires level ${perk.prerequisites.level}. `}
                                  {!meetsStats && Object.entries(perk.prerequisites.stats)
                                    .filter(([stat, req]) => (primaryStats[stat] ?? 0) < req)
                                    .map(([stat, req]) => `${formatStatName(stat)} ${req}+`)
                                    .join(', ')}
                                  {perk.prerequisites.perks.length > 0 && ` Requires: ${perk.prerequisites.perks.join(', ')}`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mutations Tab */}
      {activeTab === 'mutations' && (
        <div className="bg-panel border border-panel-light rounded-sm p-4 text-parchment-dark text-sm text-center">
          <p>No mutations yet.</p>
          <p className="text-xs mt-1">Mutations manifest at corruption thresholds (26, 41, 61, 76, 91).</p>
        </div>
      )}
    </div>
  );
}
