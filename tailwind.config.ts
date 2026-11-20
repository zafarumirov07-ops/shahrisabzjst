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
        // Brend ranglari ham o'zgaruvchi: Ta'lim sifati saytida indigo/oltin bo'ladi (globals.css)
        navy: {
          DEFAULT: 'rgb(var(--navy-rgb) / <alpha-value>)',
          2: 'rgb(var(--navy-2-rgb) / <alpha-value>)',
          3: 'rgb(var(--navy-3-rgb) / <alpha-value>)',
        },
        sky: { DEFAULT: 'rgb(var(--sky-rgb) / <alpha-value>)', soft: 'var(--sky-soft)' },
        leaf: { DEFAULT: 'rgb(var(--leaf-rgb) / <alpha-value>)', deep: 'rgb(var(--leaf-deep-rgb) / <alpha-value>)' },
        ink: 'var(--ink)',
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
        glow: '0 10px 40px var(--glow)',
      },
      letterSpacing: {
        tighter2: '-0.025em',
      },
    },
  },
  plugins: [typography],
};

export default config;
