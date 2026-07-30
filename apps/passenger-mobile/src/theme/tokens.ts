/**
 * Mirrors the Tailwind tokens in `apps/passenger-web/tailwind.config.js` so the
 * two passenger clients stay visually identical. Keep the palettes in sync.
 */
export const colors = {
  brand50: '#eff6ff',
  brand100: '#dbeafe',
  brand200: '#bfdbfe',
  brand500: '#3b82f6',
  brand600: '#2563eb',
  brand700: '#1d4ed8',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',

  emerald50: '#ecfdf5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald700: '#047857',
  emerald800: '#065f46',

  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber300: '#fcd34d',
  amber700: '#b45309',
  amber800: '#92400e',

  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose600: '#e11d48',
  rose700: '#be123c',

  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;

/** Tailwind's `shadow-soft`, expressed for both platforms. */
export const shadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

/** Minimum comfortable tap target, matching the web app's `min-h-[44px]`. */
export const HIT_SLOP_MIN = 44;
