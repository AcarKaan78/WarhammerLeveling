'use client';

import { useEffect, useState } from 'react';
import { Modal } from './modal';

const W40K_QUOTES = [
  { text: "Even a man who has nothing can still offer his life.", author: "Imperial Proverb" },
  { text: "The Emperor protects.", author: "Ecclesiarchy Blessing" },
  { text: "In the grim darkness of the far future, there is only war.", author: "Imperial Records" },
  { text: "Knowledge is power, guard it well.", author: "Blood Ravens Chapter Motto" },
  { text: "Innocence proves nothing.", author: "Inquisitorial Maxim" },
  { text: "Hope is the first step on the road to disappointment.", author: "Thought for the Day" },
  { text: "Only in death does duty end.", author: "Imperial Proverb" },
  { text: "An open mind is like a fortress with its gates unbarred and unguarded.", author: "Thought for the Day" },
  { text: "Blessed is the mind too small for doubt.", author: "Thought for the Day" },
  { text: "There is no such thing as innocence, only degrees of guilt.", author: "Inquisitorial Maxim" },
  { text: "Pain is an illusion of the senses, despair is an illusion of the mind.", author: "Thought for the Day" },
  { text: "Success is commemorated; failure merely remembered.", author: "Thought for the Day" },
  { text: "The reward of tolerance is treachery.", author: "Thought for the Day" },
  { text: "Faith is your shield.", author: "Imperial Creed" },
  { text: "Burn the heretic. Kill the mutant. Purge the unclean.", author: "Ecclesiarchy Catechism" },
  { text: "A small mind is a tidy mind.", author: "Thought for the Day" },
  { text: "To admit defeat is to blaspheme against the Emperor.", author: "Thought for the Day" },
  { text: "Courage and honour!", author: "Ultramarines Battle Cry" },
  { text: "Carry the Emperor's will as your torch, with it destroy the shadows.", author: "Thought for the Day" },
  { text: "The universe is a big place and, whatever happens, you will not be missed.", author: "Thought for the Day" },
  { text: "A warrior's faith in his commander is his best armour and his strongest weapon.", author: "Tactica Imperium" },
  { text: "It is better to die for the Emperor than to live for yourself.", author: "Imperial Proverb" },
  { text: "The strength of the Emperor is Humanity, and the strength of Humanity is the Emperor.", author: "Ecclesiarchy Doctrine" },
  { text: "Do not ask 'Why kill the alien?', rather ask 'Why not?'", author: "Thought for the Day" },
  { text: "Thought begets Heresy; Heresy begets Retribution.", author: "Thought for the Day" },
  { text: "For those who seek perfection there can be no rest this side of the grave.", author: "Thought for the Day" },
  { text: "The wise learn from the deaths of others.", author: "Thought for the Day" },
  { text: "A suspicious mind is a healthy mind.", author: "Thought for the Day" },
  { text: "Walk softly, and carry a big gun.", author: "Commissar Holt" },
  { text: "My armour is contempt. My shield is disgust. My sword is hatred. In the Emperor's name, let none survive.", author: "Litany of Hate" },
];

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
  xpEarned: number;
  statGains?: Record<string, number>;
}

function getRandomQuote() {
  return W40K_QUOTES[Math.floor(Math.random() * W40K_QUOTES.length)];
}

function getLevelTitle(level: number): string {
  if (level <= 3) return 'Initiate';
  if (level <= 6) return 'Acolyte';
  if (level <= 10) return 'Operative';
  if (level <= 15) return 'Agent';
  if (level <= 20) return 'Throne Agent';
  if (level <= 30) return 'Inquisitorial Envoy';
  return 'Lord Inquisitor';
}

export function LevelUpModal({ open, onClose, newLevel, xpEarned, statGains }: LevelUpModalProps) {
  const [quote, setQuote] = useState(getRandomQuote);

  useEffect(() => {
    if (open) {
      setQuote(getRandomQuote());
    }
  }, [open]);

  const title = getLevelTitle(newLevel);

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="text-center space-y-4 py-2">
        {/* Aquila decoration */}
        <div className="text-imperial-gold text-4xl font-gothic tracking-widest">
          +++
        </div>

        {/* Level up announcement */}
        <div>
          <div className="text-xs text-parchment-dark uppercase tracking-[0.3em] mb-1">Promotion Authorized</div>
          <h2 className="text-3xl font-gothic text-imperial-gold">
            Level {newLevel}
          </h2>
          <div className="text-sm text-parchment mt-1">
            Rank: <span className="text-imperial-gold">{title}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-4">
          <div className="flex-1 h-px bg-imperial-gold/30" />
          <span className="text-imperial-gold text-xs">+++ THOUGHT FOR THE DAY +++</span>
          <div className="flex-1 h-px bg-imperial-gold/30" />
        </div>

        {/* W40K Quote */}
        <div className="px-6">
          <p className="text-parchment italic text-sm leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="text-parchment-dark text-xs mt-2">
            &mdash; {quote.author}
          </p>
        </div>

        {/* Rewards summary */}
        <div className="bg-void-black/50 border border-imperial-gold/20 rounded-sm p-3 mx-4">
          <div className="text-xs text-parchment-dark uppercase tracking-wider mb-2">Rewards Granted</div>
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-parchment">+{xpEarned} <span className="text-imperial-gold">XP</span></span>
            <span className="text-parchment">+2 <span className="text-imperial-gold">Stat Points</span></span>
            <span className="text-parchment">+1 <span className="text-imperial-gold">Skill Point</span></span>
          </div>
          {statGains && Object.keys(statGains).length > 0 && (
            <div className="flex justify-center gap-3 mt-2 text-xs text-system-green-dim">
              {Object.entries(statGains).map(([stat, gain]) => (
                <span key={stat}>+{gain} {stat}</span>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="px-8 py-2 bg-imperial-gold/20 border border-imperial-gold/50 text-imperial-gold rounded-sm hover:bg-imperial-gold/30 transition-colors font-gothic text-sm tracking-wider"
        >
          FOR THE EMPEROR
        </button>

        {/* Bottom decoration */}
        <div className="text-imperial-gold/40 text-xs tracking-[0.5em]">
          IMPERIUM OF MAN
        </div>
      </div>
    </Modal>
  );
}
