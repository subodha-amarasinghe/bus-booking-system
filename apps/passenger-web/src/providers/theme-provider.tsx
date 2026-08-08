'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  applyResolvedTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
  cyclePreference: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSystemSnapshot(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  const systemIsDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    setPreferenceState(readStoredTheme());
    setReady(true);
  }, []);

  const resolved: ResolvedTheme =
    preference === 'system'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : preference;

  useEffect(() => {
    if (!ready) return;
    applyResolvedTheme(resolved);
  }, [ready, resolved]);

  const setPreference = useCallback((theme: ThemePreference) => {
    setPreferenceState(theme);
    storeTheme(theme);
    applyResolvedTheme(resolveTheme(theme));
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((current) => {
      const next: ThemePreference =
        current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
      storeTheme(next);
      applyResolvedTheme(resolveTheme(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, cyclePreference }),
    [preference, resolved, setPreference, cyclePreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
