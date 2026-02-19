import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Psyker',
  description: 'A grimdark CRPG gamification system — track daily tasks, earn XP, shape your destiny.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-void-black text-parchment min-h-screen antialiased font-body">
        {children}
      </body>
    </html>
  );
}
