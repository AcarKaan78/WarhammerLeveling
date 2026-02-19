'use client';

import type { InventoryItem } from '@/domain/models';
import { formatRarity } from '@/lib/formatters';
import { COLORS } from '@/lib/constants';

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
  compact?: boolean;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-parchment-dark/30',
  uncommon: 'border-sanity-stable/40',
  rare: 'border-blue-500/40',
  very_rare: 'border-corruption-glow/40',
  legendary: 'border-imperial-gold/60',
};

export function ItemCard({ item, onClick, compact = false }: ItemCardProps) {
  const borderClass = RARITY_BORDER[item.item.rarity] ?? 'border-panel-light';
  const conditionPct = item.conditionMax > 0 ? (item.condition / item.conditionMax) * 100 : 100;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 p-2 border ${borderClass} rounded-sm bg-panel hover:bg-panel-light transition-colors w-full text-left`}
      >
        <span className="text-parchment text-sm truncate flex-1">{item.item.name}</span>
        {item.quantity > 1 && <span className="text-xs text-parchment-dark">x{item.quantity}</span>}
        {item.equipped && <span className="text-xs text-imperial-gold">[E]</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`p-3 border ${borderClass} rounded-sm bg-panel hover:bg-panel-light transition-colors w-full text-left`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-parchment font-semibold text-sm">{item.item.name}</span>
          {item.equipped && <span className="text-xs text-imperial-gold ml-2">[Equipped]</span>}
        </div>
        {item.quantity > 1 && <span className="text-xs text-parchment-dark">x{item.quantity}</span>}
      </div>

      <div className="text-xs text-parchment-dark mt-1">{item.item.description}</div>

      <div className="flex gap-3 mt-2 text-xs">
        <span className="text-parchment-dark">{formatRarity(item.item.rarity)}</span>
        <span className="text-parchment-dark">{item.item.weight}kg</span>
        {conditionPct < 100 && (
          <span className={conditionPct < 30 ? 'text-blood' : 'text-parchment-dark'}>
            {Math.round(conditionPct)}% condition
          </span>
        )}
      </div>
    </button>
  );
}
