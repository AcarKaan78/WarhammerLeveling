'use client';

import { useEffect } from 'react';
import { useGameContext } from '@/context/game-context';
import { InventoryGrid } from '@/components/game/inventory-grid';
import { Loading } from '@/components/ui/loading';

export default function InventoryPage() {
  const { gameState, loading, characterId, saveName, setCharacterId } = useGameContext();

  useEffect(() => {
    if (!characterId) {
      fetch(`/api/character?save=${saveName}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.id) setCharacterId(data.id); })
        .catch(() => {});
    }
  }, [characterId, saveName, setCharacterId]);

  if (loading || !gameState) return <Loading text="Loading inventory..." />;

  return (
    <div className="max-w-3xl">
      <h2 className="font-gothic text-imperial-gold text-xl mb-4">Inventory</h2>
      <InventoryGrid />
    </div>
  );
}
