// Nexus Design Tokens
// Exported from Figma Day 1 — all components use these values exclusively.
// Never use ad-hoc Tailwind color/spacing values — always reference tokens.

export const colors = {
  // Brand
  brand: {
    primary:   '#6D5FFD',  // Electric violet — CTAs, progress fills, active states
    secondary: '#38BDF8',  // Sky blue — secondary accents, links
    accent:    '#A78BFA',  // Soft violet — hover states, badges, highlights
  },

  // Backgrounds (dark-first)
  bg: {
    base:      '#0D0D12',  // Near-black — page background
    surface:   '#16161F',  // Card / panel background
    elevated:  '#1E1E2E',  // Modal, dropdown, elevated cards
    overlay:   '#252535',  // Hover state backgrounds
  },

  // Text
  text: {
    primary:   '#F0EFFB',  // Almost-white — headings, primary labels
    secondary: '#A8A6C0',  // Muted — supporting text, placeholders
    disabled:  '#4A4A6A',  // Disabled labels
    inverse:   '#0D0D12',  // For text on light/brand backgrounds
  },

  // Semantic
  semantic: {
    success:   '#34D399',  // Green — pass state, correct answers
    warning:   '#FBBF24',  // Amber — partial credit, caution
    error:     '#F87171',  // Red — fail state, wrong answers
    info:      '#38BDF8',  // Blue — informational callouts
  },

  // Borders
  border: {
    default:   '#2A2A40',  // Default card/input borders
    focus:     '#6D5FFD',  // Focus ring
    subtle:    '#1E1E2E',  // Dividers, subtle separators
  },

  // Badge tiers
  badge: {
    bronze:    '#CD7F32',
    silver:    '#A8A9AD',
    gold:      '#FFD700',
    diamond:   '#B9F2FF',
  },
} as const;

export const spacing = {
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  2:    '8px',
  3:    '12px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  8:    '32px',
  10:   '40px',
  12:   '48px',
  16:   '64px',
  20:   '80px',
  24:   '96px',
} as const;

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  full: '9999px',
} as const;

export const font = {
  family: {
    display: "'Inter', system-ui, sans-serif",
    body:    "'Inter', system-ui, sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
  },
  size: {
    xs:   '11px',
    sm:   '13px',
    base: '15px',
    md:   '17px',
    lg:   '20px',
    xl:   '24px',
    '2xl': '30px',
    '3xl': '38px',
    '4xl': '48px',
  },
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
  },
  lineHeight: {
    tight:   '1.2',
    normal:  '1.5',
    relaxed: '1.7',
  },
} as const;

export const shadow = {
  card:   '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(109,95,253,0.06)',
  modal:  '0 24px 64px rgba(0,0,0,0.6)',
  glow:   '0 0 24px rgba(109,95,253,0.35)',
  badge:  '0 0 32px rgba(109,95,253,0.5)',
} as const;

export const transition = {
  fast:   '120ms ease',
  normal: '200ms ease',
  slow:   '350ms ease',
} as const;
