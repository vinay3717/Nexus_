import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './design/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent:    'var(--color-brand-accent)',
        },
        bg: {
          base:     'var(--color-bg-base)',
          surface:  'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
          overlay:  'var(--color-bg-overlay)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled:  'var(--color-text-disabled)',
        },
        semantic: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error:   'var(--color-error)',
        },
        border: {
          default: 'var(--color-border-default)',
          focus:   'var(--color-border-focus)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '20px',
      },
      animation: {
        'spin-fast': 'spin 0.6s linear infinite',
        'float':     'float 3s ease-in-out infinite',
        'fade-in':   'fadeIn 200ms ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
