'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameProvider } from '@/context/game-context';
import { ThemeProvider } from '@/context/theme-context';
import { ScreenGlitch } from '@/components/effects/screen-glitch';
import { WarpCorruption } from '@/components/effects/warp-corruption';
import { useGameContext } from '@/context/game-context';

const NAV_ITEMS = [
  { href: '/game/dashboard', label: 'Dashboard' },
  { href: '/game/tasks', label: 'Tasks' },
  { href: '/game/story', label: 'Story' },
  { href: '/game/combat', label: 'Combat' },
  { href: '/game/character', label: 'Character' },
  { href: '/game/inventory', label: 'Inventory' },
  { href: '/game/relationships', label: 'NPCs' },
  { href: '/game/factions', label: 'Factions' },
  { href: '/game/journal', label: 'Journal' },
  { href: '/game/psychic', label: 'Psychic' },
  { href: '/game/achievements', label: 'Achievements' },
];

function GameSidebar() {
  const pathname = usePathname();
  const { gameState } = useGameContext();

  return (
    <aside className="w-48 bg-dark-slate border-r border-panel-light flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-panel-light">
        <Link href="/" className="font-gothic text-imperial-gold text-sm tracking-wider hover:text-imperial-gold-dark">
          WARHAMMER LEVELING
        </Link>
      </div>

      {gameState && (
        <div className="p-3 border-b border-panel-light text-xs">
          <div className="text-parchment font-semibold truncate">{gameState.character.name}</div>
          <div className="text-parchment-dark">Lv.{gameState.character.level}</div>
          <div className="text-imperial-gold">{gameState.character.thrones} Thrones</div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 text-xs transition-colors
                ${isActive
                  ? 'text-imperial-gold bg-imperial-gold/5 border-r-2 border-imperial-gold'
                  : 'text-parchment-dark hover:text-parchment hover:bg-panel-light/30'
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-panel-light space-y-2">
        <Link href="/game/housing" className="block text-xs text-parchment-dark hover:text-parchment transition-colors">
          Housing
        </Link>
        <Link href="/" className="block text-xs text-blood/60 hover:text-blood transition-colors">
          Return to Menu
        </Link>
      </div>
    </aside>
  );
}

function GameLayoutInner({ children }: { children: React.ReactNode }) {
  const { gameState } = useGameContext();
  const sanityState = gameState?.character.sanityState ?? 'stable';

  return (
    <ThemeProvider>
      <ScreenGlitch sanityState={sanityState}>
        <WarpCorruption>
          <div className="flex min-h-screen bg-void-black">
            <GameSidebar />
            <main className="flex-1 p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </WarpCorruption>
      </ScreenGlitch>
    </ThemeProvider>
  );
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <GameLayoutInner>{children}</GameLayoutInner>
    </GameProvider>
  );
}
