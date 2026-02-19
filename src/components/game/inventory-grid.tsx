'use client';

import { useState } from 'react';
import { useGameContext } from '@/context/game-context';
import { ItemCard } from '@/components/ui/item-card';
import { Modal } from '@/components/ui/modal';
import { StatBar } from '@/components/ui/stat-bar';
import { Loading } from '@/components/ui/loading';
import { formatRarity } from '@/lib/formatters';

type ViewMode = 'all' | 'equipped' | 'weapons' | 'armor' | 'consumables';

export function InventoryGrid() {
  const { gameState, loading, characterId, saveName, refresh } = useGameContext();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedItem, setSelectedItem] = useState<{ instanceId: number; itemId: string; name: string; quantity: number; condition: number; equipped: boolean; slot: string | null } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (loading || !gameState) return <Loading text="Loading inventory..." />;
  const { inventory } = gameState;

  const filterItems = () => {
    switch (viewMode) {
      case 'equipped': return inventory.items.filter(i => i.equipped);
      case 'weapons': return inventory.items.filter(i => i.itemId.includes('weapon') || i.name.toLowerCase().includes('sword') || i.name.toLowerCase().includes('pistol'));
      case 'armor': return inventory.items.filter(i => i.name.toLowerCase().includes('armor') || i.name.toLowerCase().includes('vest') || i.name.toLowerCase().includes('carapace'));
      case 'consumables': return inventory.items.filter(i => !i.equipped);
      default: return inventory.items;
    }
  };

  const handleAction = async (action: string, instanceId: number) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, instanceId, characterId, saveName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setActionFeedback(`${action} successful`);
      setSelectedItem(null);
      await refresh();
      setTimeout(() => setActionFeedback(null), 2000);
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const filteredItems = filterItems();

  return (
    <div className="space-y-4">
      {/* Encumbrance */}
      <div className="bg-panel border border-panel-light rounded-sm p-3">
        <StatBar
          label="Encumbrance"
          current={inventory.encumbrance.current}
          max={inventory.encumbrance.max}
          color={inventory.encumbrance.overloaded ? 'bg-blood' : 'bg-imperial-gold'}
          size="sm"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['all', 'equipped', 'weapons', 'armor', 'consumables'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs rounded-sm border transition-colors capitalize
              ${viewMode === mode
                ? 'border-imperial-gold/40 bg-imperial-gold/10 text-imperial-gold'
                : 'border-panel-light text-parchment-dark hover:text-parchment'
              }
            `}
          >
            {mode}
          </button>
        ))}
      </div>

      {actionFeedback && (
        <div className="text-xs text-system-green font-mono">{actionFeedback}</div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredItems.map(item => (
          <ItemCard
            key={item.instanceId}
            item={item as never}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-parchment-dark text-sm text-center py-8">No items found.</div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal open={true} onClose={() => setSelectedItem(null)} title={selectedItem.name} size="sm">
          <div className="space-y-3">
            <div className="text-xs text-parchment-dark">Condition: {selectedItem.condition}%</div>
            <div className="text-xs text-parchment-dark">Quantity: {selectedItem.quantity}</div>
            <div className="flex gap-2">
              {!selectedItem.equipped && (
                <button
                  onClick={() => handleAction('equip', selectedItem.instanceId)}
                  className="px-3 py-1 text-xs border border-imperial-gold/40 text-imperial-gold rounded-sm hover:bg-imperial-gold/10"
                >
                  Equip
                </button>
              )}
              {selectedItem.equipped && (
                <button
                  onClick={() => handleAction('unequip', selectedItem.instanceId)}
                  className="px-3 py-1 text-xs border border-panel-light text-parchment-dark rounded-sm hover:text-parchment"
                >
                  Unequip
                </button>
              )}
              <button
                onClick={() => handleAction('use', selectedItem.instanceId)}
                className="px-3 py-1 text-xs border border-sanity-stable/40 text-sanity-stable rounded-sm hover:bg-sanity-stable/10"
              >
                Use
              </button>
              <button
                onClick={() => handleAction('sell', selectedItem.instanceId)}
                className="px-3 py-1 text-xs border border-blood/40 text-blood rounded-sm hover:bg-blood/10"
              >
                Sell
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
