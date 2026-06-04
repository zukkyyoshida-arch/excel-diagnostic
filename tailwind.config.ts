import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#d9e4f3',
          200: '#b3c9e8',
          300: '#8caedd',
          400: '#6693d2',
          500: '#4078c7',
          600: '#2e5aa8',
          700: '#1f3a6b',
          800: '#152a4d',
          900: '#0f1a2f',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        stone: {
          400: '#a1a1aa',
          500: '#78716c',
          700: '#44403c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
