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
      },
    },
  },
  plugins: [],
};

export default config;
