import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-void-black relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-warp-blue/20 via-void-black to-void-black" />
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI0M5QTg0QyIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 text-center space-y-12">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-gothic font-bold text-imperial-gold tracking-wider">
            WARHAMMER LEVELING
          </h1>
          <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-imperial-gold to-transparent mx-auto" />
          <p className="text-parchment-dark text-lg tracking-widest uppercase font-light">
            The Imperium Demands Your Discipline
          </p>
        </div>

        {/* Menu */}
        <nav className="flex flex-col items-center space-y-4">
          <Link
            href="/create-character"
            className="w-72 py-3 px-8 text-center text-lg font-gothic tracking-wider
                       border border-imperial-gold/50 text-imperial-gold
                       hover:bg-imperial-gold/10 hover:border-imperial-gold hover:glow-gold
                       transition-all duration-300 uppercase"
          >
            New Game
          </Link>
          <Link
            href="/game/dashboard"
            className="w-72 py-3 px-8 text-center text-lg font-gothic tracking-wider
                       border border-parchment-dark/30 text-parchment-dark
                       hover:bg-parchment/5 hover:border-parchment-dark/50
                       transition-all duration-300 uppercase"
          >
            Continue
          </Link>
          <Link
            href="/load-game"
            className="w-72 py-3 px-8 text-center text-lg font-gothic tracking-wider
                       border border-parchment-dark/30 text-parchment-dark
                       hover:bg-parchment/5 hover:border-parchment-dark/50
                       transition-all duration-300 uppercase"
          >
            Load Game
          </Link>
        </nav>

        {/* System message */}
        <div className="mt-16">
          <p className="text-system font-mono text-sm opacity-70">
            [SYSTEM] Initializing... Operator compliance monitoring active.
          </p>
        </div>
      </div>
    </main>
  );
}
