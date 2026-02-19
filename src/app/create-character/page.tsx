'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateCharacterCreation, hasErrors } from '@/lib/validators';
import type { PrimaryStatKey } from '@/domain/models';

type Step = 'name' | 'origin' | 'background' | 'personality' | 'appearance' | 'stats' | 'difficulty' | 'confirm';
const STEPS: Step[] = ['name', 'origin', 'background', 'personality', 'appearance', 'stats', 'difficulty', 'confirm'];

const ORIGINS = [
  { id: 'hive_world', name: 'Hive World', desc: 'Born in the towering mega-cities. Streetwise and resilient.' },
  { id: 'forge_world', name: 'Forge World', desc: 'Raised among the Mechanicus. Technically gifted.' },
  { id: 'agri_world', name: 'Agri World', desc: 'From the breadbasket worlds. Strong and hardy.' },
  { id: 'shrine_world', name: 'Shrine World', desc: 'Raised in devotion. Strong-willed and faithful.' },
  { id: 'feral_world', name: 'Feral World', desc: 'From untamed worlds. Savage and tough.' },
  { id: 'void_born', name: 'Void Born', desc: 'Born between the stars. Perceptive and strange.' },
];

const BACKGROUNDS = [
  { id: 'guard_veteran', name: 'Guard Veteran', desc: 'Former Imperial Guard soldier.' },
  { id: 'clerk', name: 'Administratum Clerk', desc: 'Bureaucratic background with broad knowledge.' },
  { id: 'underhive_scum', name: 'Underhive Scum', desc: 'Street survivor from the depths.' },
  { id: 'scholam_student', name: 'Scholam Student', desc: 'Educated in an Imperial Scholam.' },
  { id: 'outcast_psyker', name: 'Outcast Psyker', desc: 'A rogue psyker, hunted and feared.' },
  { id: 'sanctioned_psyker', name: 'Sanctioned Psyker', desc: 'Imperially sanctioned, disciplined in the use of psychic powers.' },
  { id: 'merchant', name: 'Merchant', desc: 'Trader with connections and coin.' },
  { id: 'mechanicus_initiate', name: 'Mechanicus Initiate', desc: 'Follower of the Omnissiah.' },
];

const PERSONALITIES = [
  { id: 'stoic', name: 'Stoic', desc: 'Calm and unshakeable.' },
  { id: 'hot_blooded', name: 'Hot-Blooded', desc: 'Passionate and aggressive.' },
  { id: 'curious', name: 'Curious', desc: 'Knowledge-seeking, sometimes recklessly.' },
  { id: 'paranoid', name: 'Paranoid', desc: 'Always watching, trusts no one.' },
  { id: 'devout', name: 'Devout', desc: 'Deeply faithful to the Emperor.' },
  { id: 'pragmatic', name: 'Pragmatic', desc: 'Results over ideals.' },
  { id: 'compassionate', name: 'Compassionate', desc: 'Rare kindness in a cruel galaxy.' },
  { id: 'ambitious', name: 'Ambitious', desc: 'Power and advancement above all.' },
];

const STAT_KEYS: PrimaryStatKey[] = [
  'weaponSkill', 'ballisticSkill', 'strength', 'toughness', 'agility',
  'intelligence', 'perception', 'willpower', 'fellowship',
];

export default function CreateCharacterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    gender: 'male' as string,
    age: 25,
    origin: '',
    background: '',
    personality1: '',
    personality2: '',
    appearance: { build: 'average' as string, height: 'average' as string, distinguishingFeatures: '' },
    bonusStatAllocations: {} as Record<string, number>,
    difficulty: 'standard' as string,
    ironman: false,
  });

  const currentStep = STEPS[step];
  const totalBonusUsed = Object.values(form.bonusStatAllocations).reduce((s, v) => s + v, 0);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'name': return form.name.trim().length >= 2;
      case 'origin': return !!form.origin;
      case 'background': return !!form.background;
      case 'personality': return !!form.personality1 && !!form.personality2 && form.personality1 !== form.personality2;
      case 'appearance': return true;
      case 'stats': return totalBonusUsed <= 20;
      case 'difficulty': return true;
      case 'confirm': return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    const errors = validateCharacterCreation({
      name: form.name,
      age: form.age,
      personality1: form.personality1,
      personality2: form.personality2,
      bonusStatAllocations: form.bonusStatAllocations as Record<PrimaryStatKey, number>,
    });
    if (hasErrors(errors)) {
      setError(Object.values(errors).filter(Boolean).join(', '));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create character');
      }
      router.push('/game/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-sm ${i <= step ? 'bg-imperial-gold' : 'bg-panel-light'}`} />
          ))}
        </div>

        <div className="bg-dark-slate border border-panel-light rounded-sm p-6">
          {/* Step: Name */}
          {currentStep === 'name' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Identity</h2>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Character name"
                className="w-full bg-void-black border border-panel-light rounded-sm p-3 text-parchment outline-none focus:border-imperial-gold/50"
              />
              <div className="flex gap-2">
                {['male', 'female', 'nonbinary'].map(g => (
                  <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                    className={`flex-1 py-2 text-sm border rounded-sm capitalize transition-colors
                      ${form.gender === g ? 'border-imperial-gold text-imperial-gold bg-imperial-gold/10' : 'border-panel-light text-parchment-dark'}
                    `}>{g}</button>
                ))}
              </div>
              <div>
                <label className="text-xs text-parchment-dark block mb-1">Age</label>
                <input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: parseInt(e.target.value) || 16 }))}
                  min={16} max={80} className="w-24 bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none" />
              </div>
            </div>
          )}

          {/* Step: Origin */}
          {currentStep === 'origin' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Origin World</h2>
              <div className="grid grid-cols-1 gap-2">
                {ORIGINS.map(o => (
                  <button key={o.id} onClick={() => setForm(p => ({ ...p, origin: o.id }))}
                    className={`p-3 border rounded-sm text-left transition-colors
                      ${form.origin === o.id ? 'border-imperial-gold bg-imperial-gold/10' : 'border-panel-light hover:border-panel-light/60'}
                    `}>
                    <div className="text-parchment font-semibold text-sm">{o.name}</div>
                    <div className="text-xs text-parchment-dark mt-1">{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Background */}
          {currentStep === 'background' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Background</h2>
              <div className="grid grid-cols-1 gap-2">
                {BACKGROUNDS.map(b => (
                  <button key={b.id} onClick={() => setForm(p => ({ ...p, background: b.id }))}
                    className={`p-3 border rounded-sm text-left transition-colors
                      ${form.background === b.id ? 'border-imperial-gold bg-imperial-gold/10' : 'border-panel-light hover:border-panel-light/60'}
                    `}>
                    <div className="text-parchment font-semibold text-sm">{b.name}</div>
                    <div className="text-xs text-parchment-dark mt-1">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Personality */}
          {currentStep === 'personality' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Personality Traits</h2>
              <p className="text-xs text-parchment-dark">Select two different traits.</p>
              {[1, 2].map(idx => (
                <div key={idx}>
                  <label className="text-xs text-parchment-dark mb-1 block">Trait {idx}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERSONALITIES.map(p => {
                      const selected = idx === 1 ? form.personality1 === p.id : form.personality2 === p.id;
                      const disabled = idx === 1 ? form.personality2 === p.id : form.personality1 === p.id;
                      return (
                        <button key={p.id}
                          onClick={() => setForm(prev => ({ ...prev, [`personality${idx}`]: p.id }))}
                          disabled={disabled}
                          className={`p-2 border rounded-sm text-left text-xs transition-colors
                            ${selected ? 'border-imperial-gold bg-imperial-gold/10' : disabled ? 'border-panel-light/20 opacity-30' : 'border-panel-light hover:border-panel-light/60'}
                          `}>
                          <div className="text-parchment font-semibold">{p.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step: Appearance */}
          {currentStep === 'appearance' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Appearance</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-parchment-dark block mb-1">Build</label>
                  <select value={form.appearance.build}
                    onChange={e => setForm(p => ({ ...p, appearance: { ...p.appearance, build: e.target.value } }))}
                    className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none">
                    {['gaunt', 'lean', 'average', 'stocky', 'heavy'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-parchment-dark block mb-1">Height</label>
                  <select value={form.appearance.height}
                    onChange={e => setForm(p => ({ ...p, appearance: { ...p.appearance, height: e.target.value } }))}
                    className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none">
                    {['short', 'average', 'tall'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-parchment-dark block mb-1">Distinguishing Features</label>
                <input value={form.appearance.distinguishingFeatures}
                  onChange={e => setForm(p => ({ ...p, appearance: { ...p.appearance, distinguishingFeatures: e.target.value } }))}
                  placeholder="Scars, tattoos, cybernetics..."
                  className="w-full bg-void-black border border-panel-light rounded-sm p-2 text-parchment text-sm outline-none" />
              </div>
            </div>
          )}

          {/* Step: Stats */}
          {currentStep === 'stats' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Bonus Stat Allocation</h2>
              <p className="text-xs text-parchment-dark">Distribute up to 20 bonus points. Max 8 per stat.</p>
              <p className="text-xs text-imperial-gold">Points remaining: {20 - totalBonusUsed}</p>
              <div className="space-y-2">
                {STAT_KEYS.map(stat => {
                  const val = form.bonusStatAllocations[stat] ?? 0;
                  return (
                    <div key={stat} className="flex items-center gap-3">
                      <span className="text-xs text-parchment w-28 capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <button onClick={() => setForm(p => ({ ...p, bonusStatAllocations: { ...p.bonusStatAllocations, [stat]: Math.max(0, val - 1) } }))}
                        className="w-6 h-6 border border-panel-light text-parchment-dark text-xs rounded-sm hover:text-parchment">-</button>
                      <span className="text-sm text-imperial-gold w-4 text-center">{val}</span>
                      <button onClick={() => { if (totalBonusUsed < 20 && val < 8) setForm(p => ({ ...p, bonusStatAllocations: { ...p.bonusStatAllocations, [stat]: val + 1 } })); }}
                        disabled={totalBonusUsed >= 20 || val >= 8}
                        className="w-6 h-6 border border-panel-light text-parchment-dark text-xs rounded-sm hover:text-parchment disabled:opacity-30">+</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Difficulty */}
          {currentStep === 'difficulty' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Difficulty</h2>
              {[
                { id: 'narrative', name: 'Narrative', desc: 'Forgiving. Focus on story and tasks.' },
                { id: 'standard', name: 'Standard', desc: 'Balanced challenge. The intended experience.' },
                { id: 'grimdark', name: 'Grimdark', desc: 'Brutal. Every decision matters. Death is permanent.' },
              ].map(d => (
                <button key={d.id} onClick={() => setForm(p => ({ ...p, difficulty: d.id }))}
                  className={`w-full p-3 border rounded-sm text-left transition-colors
                    ${form.difficulty === d.id ? 'border-imperial-gold bg-imperial-gold/10' : 'border-panel-light'}
                  `}>
                  <div className="text-parchment font-semibold">{d.name}</div>
                  <div className="text-xs text-parchment-dark mt-1">{d.desc}</div>
                </button>
              ))}
              <label className="flex items-center gap-2 text-sm text-parchment-dark mt-2">
                <input type="checkbox" checked={form.ironman} onChange={e => setForm(p => ({ ...p, ironman: e.target.checked }))}
                  className="accent-imperial-gold" />
                Ironman Mode (no manual saves)
              </label>
            </div>
          )}

          {/* Step: Confirm */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <h2 className="font-gothic text-imperial-gold text-xl">Confirm Character</h2>
              <div className="space-y-2 text-sm">
                <div className="text-parchment"><strong>Name:</strong> {form.name}</div>
                <div className="text-parchment"><strong>Origin:</strong> {form.origin}</div>
                <div className="text-parchment"><strong>Background:</strong> {form.background}</div>
                <div className="text-parchment"><strong>Traits:</strong> {form.personality1}, {form.personality2}</div>
                <div className="text-parchment"><strong>Difficulty:</strong> {form.difficulty}{form.ironman ? ' (Ironman)' : ''}</div>
              </div>
            </div>
          )}

          {error && <div className="text-blood text-sm mt-3">{error}</div>}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="px-4 py-2 text-sm border border-panel-light text-parchment-dark rounded-sm hover:text-parchment disabled:opacity-30">
              Back
            </button>
            {currentStep === 'confirm' ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-6 py-2 text-sm border border-imperial-gold text-imperial-gold rounded-sm hover:bg-imperial-gold/10 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Begin'}
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="px-4 py-2 text-sm border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/10 disabled:opacity-30">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
