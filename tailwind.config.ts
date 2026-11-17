import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mavzuga (yorug' / qorong'u / yuqori kontrast) qarab o'zgaradigan ranglar (iOS tizim ranglari)
        page: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        green: 'var(--green)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          '"Segoe UI"',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        ios: '1.25rem',
        'ios-lg': '1.75rem',
      },
      boxShadow: {
        ios: '0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.06)',
        'ios-lg': '0 2px 6px rgba(0,0,0,.05), 0 18px 40px rgba(0,0,0,.10)',
      },
      letterSpacing: {
        tighter2: '-0.022em',
      },
    },
  },
  plugins: [typography],
};

export default config;
