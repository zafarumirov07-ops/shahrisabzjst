import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mavzuga (yorug' / qorong'u / yuqori kontrast) qarab o'zgaradigan ranglar
        page: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        green: 'var(--green)',
        navy: { DEFAULT: '#05233f', 2: '#0a3c63', 3: '#0d5478' },
        sky: { DEFAULT: '#38bdf8', soft: '#e0f4fe' },
        leaf: { DEFAULT: '#4ade80', deep: '#16a34a' },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        ios: '1.5rem',
        'ios-lg': '2.25rem',
      },
      boxShadow: {
        ios: '0 1px 2px rgba(5,35,63,.05), 0 8px 24px rgba(5,35,63,.07)',
        'ios-lg': '0 2px 6px rgba(5,35,63,.06), 0 22px 48px rgba(5,35,63,.14)',
        glow: '0 10px 40px rgba(74,222,128,.35)',
      },
      letterSpacing: {
        tighter2: '-0.025em',
      },
    },
  },
  plugins: [typography],
};

export default config;
