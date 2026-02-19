'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SaveCharacter {
  id: number;
  name: string;
  level: number;
  origin: string;
  background: string;
  difficulty: string;
  lastPlayed: string;
}

interface SaveEntry {
  name: string;
  character?: SaveCharacter;
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function LoadGamePage() {
  const router = useRouter();
  const [saves, setSaves] = useState<SaveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/save');
      if (!res.ok) throw new Error('Failed to load saves');
      const data = await res.json();
      setSaves(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaves();
  }, []);

  const handleLoad = async (saveName: string) => {
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch', name: saveName }),
      });
      router.push('/game/dashboard');
    } catch {
      setError('Failed to load save');
    }
  };

  const handleDelete = async (saveName: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/save?name=${encodeURIComponent(saveName)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete save');
      setDeleteTarget(null);
      await fetchSaves();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-gothic text-imperial-gold tracking-wider mb-2">Load Game</h1>
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-imperial-gold to-transparent mx-auto" />
        </div>

        {loading && (
          <div className="text-center text-parchment-dark py-12">
            <p className="font-mono text-sm">[SYSTEM] Scanning save data...</p>
          </div>
        )}

        {error && (
          <div className="text-blood text-sm text-center mb-4">{error}</div>
        )}

        {!loading && saves.length === 0 && (
          <div className="text-center py-12">
            <p className="text-parchment-dark text-lg mb-4">No saved games found.</p>
            <Link href="/create-character"
              className="inline-block px-6 py-3 border border-imperial-gold text-imperial-gold font-gothic tracking-wider hover:bg-imperial-gold/10 transition-colors uppercase">
              New Game
            </Link>
          </div>
        )}

        {!loading && saves.length > 0 && (
          <div className="space-y-3">
            {saves.map(save => (
              <div key={save.name}
                className="bg-dark-slate border border-panel-light rounded-sm p-4 hover:border-imperial-gold/40 transition-colors">
                {save.character ? (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-gothic text-imperial-gold">{save.character.name}</h2>
                        <span className="text-xs text-parchment-dark bg-panel-light/30 px-2 py-0.5 rounded-sm">
                          Level {save.character.level}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-parchment-dark">
                        <span>{formatLabel(save.character.origin)}</span>
                        <span>{formatLabel(save.character.background)}</span>
                        <span className="capitalize">{save.character.difficulty}</span>
                      </div>
                      <div className="text-xs text-parchment-dark/60 mt-1">
                        Last played: {formatDate(save.character.lastPlayed)}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleLoad(save.name)}
                        className="px-4 py-2 text-sm border border-imperial-gold text-imperial-gold rounded-sm hover:bg-imperial-gold/10 transition-colors">
                        Load
                      </button>
                      <button onClick={() => setDeleteTarget(save.name)}
                        className="px-3 py-2 text-sm border border-blood/40 text-blood/70 rounded-sm hover:bg-blood/10 hover:border-blood transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm text-parchment-dark">{save.name}</h2>
                      <p className="text-xs text-parchment-dark/50">Empty save — no character created</p>
                    </div>
                    <button onClick={() => setDeleteTarget(save.name)}
                      className="px-3 py-2 text-sm border border-blood/40 text-blood/70 rounded-sm hover:bg-blood/10 hover:border-blood transition-colors">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-void-black/80 flex items-center justify-center z-50">
            <div className="bg-dark-slate border border-blood/50 rounded-sm p-6 max-w-sm w-full mx-4">
              <h3 className="font-gothic text-blood text-lg mb-3">Delete Save</h3>
              <p className="text-sm text-parchment mb-1">
                Are you sure you want to delete <strong className="text-imperial-gold">{deleteTarget}</strong>?
              </p>
              <p className="text-xs text-parchment-dark mb-6">
                This action cannot be undone. All character data will be permanently lost.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="px-4 py-2 text-sm border border-panel-light text-parchment-dark rounded-sm hover:text-parchment transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteTarget)} disabled={deleting}
                  className="px-4 py-2 text-sm border border-blood text-blood rounded-sm hover:bg-blood/10 transition-colors disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back to menu */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-parchment-dark hover:text-parchment transition-colors">
            Back to Main Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
