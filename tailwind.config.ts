import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Imperial theme
        'imperial-gold': '#C9A84C',
        'imperial-gold-dark': '#8B6914',
        'parchment': '#D4C5A9',
        'parchment-dark': '#A89B7B',
        // Blood and combat
        'blood': '#8B0000',
        'blood-bright': '#CC0000',
        // Corruption / Warp
        'warp-purple': '#6B0099',
        'warp-blue': '#1A0A3E',
        'corruption-glow': '#9B30FF',
        // Sanity
        'sanity-stable': '#4CAF50',
        'sanity-stressed': '#FFC107',
        'sanity-disturbed': '#FF9800',
        'sanity-breaking': '#FF5722',
        'sanity-shattered': '#B71C1C',
        // Backgrounds
        'void-black': '#0A0A0F',
        'dark-slate': '#1A1A2E',
        'panel': '#16213E',
        'panel-light': '#1A2744',
        // System green (The System's messages)
        'system-green': '#00FF41',
        'system-green-dim': '#00CC33',
        // Faction colors
        'faction-imperial': '#C9A84C',
        'faction-mechanicus': '#CC4400',
        'faction-ecclesiarchy': '#FFD700',
        'faction-underworld': '#555555',
        'faction-chaos': '#8B0000',
        'faction-inquisition': '#C0C0C0',
        'faction-psykana': '#6B0099',
      },
      fontFamily: {
        'gothic': ['"Cinzel"', 'serif'],
        'body': ['"Inter"', 'sans-serif'],
        'mono': ['"Fira Code"', 'monospace'],
      },
      animation: {
        'text-flicker': 'textFlicker 0.3s ease-in-out',
        'screen-glitch': 'screenGlitch 0.15s ease-in-out',
        'corruption-pulse': 'corruptionPulse 3s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
        'typewriter-cursor': 'cursorBlink 1s step-end infinite',
      },
      keyframes: {
        textFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        screenGlitch: {
          '0%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-2px, 1px)' },
          '50%': { transform: 'translate(2px, -1px)' },
          '75%': { transform: 'translate(-1px, -1px)' },
          '100%': { transform: 'translate(0)' },
        },
        corruptionPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(107, 0, 153, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(107, 0, 153, 0.6)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
