const LOCALE = 'en-GB';

export function formatMoney(amount: number, currency = 'LKR'): string {
  return `${currency} ${amount.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(value: Date | string): string {
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(value: Date | string): string {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

/** `mm:ss` for seat-hold countdowns. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(from: Date | string, to?: Date | string): string {
  if (!to) return '';
  const minutes = Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 60_000,
  );
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/** ISO `yyyy-mm-dd` in local time, for `<input type="date">` values. */
export function toDateInputValue(value: Date = new Date()): string {
  const offsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function shiftDateInputValue(value: string, days: number): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return toDateInputValue();
  parsed.setDate(parsed.getDate() + days);
  return toDateInputValue(parsed);
}

/** Guards `?next=` redirects so only in-app paths (with optional query) are followed. */
export function safeInternalPath(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

/** Builds `/login?next=…` preserving path + query for post-auth return. */
export function buildLoginHref(returnTo: string): string {
  return `/login?next=${encodeURIComponent(safeInternalPath(returnTo, '/'))}`;
}

/** Reconstructs pathname + search from App Router `searchParams`. */
export function pathWithSearch(
  pathname: string,
  searchParams?: Record<string, string | string[] | undefined>,
): string {
  if (!searchParams) return pathname;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else {
      query.set(key, value);
    }
  }
  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}
