'use client';

import { useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { StatBar } from '@/components/ui/stat-bar';
import { ResourceBar } from '@/components/ui/resource-bar';
import { Loading } from '@/components/ui/loading';
import { formatStatName } from '@/lib/formatters';
import { STAT_ABBREVIATIONS } from '@/lib/constants';

type Tab = 'stats' | 'skills' | 'perks' | 'mutations';

export function CharacterSheet() {
  const { gameState, loading } = useGameContext();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  if (loading || !gameState) return <Loading text="Loading character..." />;
  const { character } = gameState;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'skills', label: 'Skills' },
    { key: 'perks', label: 'Perks' },
    { key: 'mutations', label: 'Mutations' },
  ];

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
            className={`px-4 py-2 text-sm font-mono transition-colors border-b-2
              ${activeTab === tab.key
                ? 'text-imperial-gold border-imperial-gold'
                : 'text-parchment-dark border-transparent hover:text-parchment'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(character.primaryStats).map(([key, value]) => (
            <div key={key} className="bg-panel border border-panel-light rounded-sm p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-parchment">{formatStatName(key)}</span>
                <span className="text-xs text-parchment-dark">{STAT_ABBREVIATIONS[key]}</span>
              </div>
              <StatBar label="" current={value as number} max={100} showNumbers size="sm" />
            </div>
          ))}

          <div className="sm:col-span-2 bg-panel border border-panel-light rounded-sm p-3">
            <h3 className="text-sm font-gothic text-imperial-gold mb-2">Available Points</h3>
            <div className="flex gap-6 text-sm">
              <span className="text-parchment">Stat: <strong className="text-imperial-gold">{character.freeStatPoints}</strong></span>
              <span className="text-parchment">Skill: <strong className="text-imperial-gold">{character.freeSkillPoints}</strong></span>
              <span className="text-parchment">Perk: <strong className="text-imperial-gold">{character.freePerkPoints}</strong></span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="bg-panel border border-panel-light rounded-sm p-4 text-parchment-dark text-sm">
          Skills display will be populated from character data.
        </div>
      )}

      {activeTab === 'perks' && (
        <div className="bg-panel border border-panel-light rounded-sm p-4 text-parchment-dark text-sm">
          Perk tree visualization will be displayed here.
        </div>
      )}

      {activeTab === 'mutations' && (
        <div className="bg-panel border border-panel-light rounded-sm p-4 text-parchment-dark text-sm">
          Active mutations and their effects will appear here.
        </div>
      )}
    </div>
  );
}
