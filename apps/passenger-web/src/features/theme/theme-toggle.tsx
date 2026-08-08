'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../providers/theme-provider';
import type { ThemePreference } from '../../lib/theme';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      aria-label="Colour theme"
      className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-800/80"
      role="group"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            aria-label={`${label} theme`}
            aria-pressed={active}
            className={
              active
                ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                : 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            }
            key={value}
            onClick={() => setPreference(value)}
            title={label}
            type="button"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
