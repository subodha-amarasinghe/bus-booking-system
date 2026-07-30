/**
 * API responses arrive as JSON, so date fields typed as `Date` in
 * `@bus-booking/shared-types` are ISO strings at runtime.
 */
type DateLike = Date | string | null | undefined;

export function formatDateTime(value: DateLike): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: DateLike): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(amount: number, currency = 'LKR'): string {
  return `${currency} ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in local time. */
export function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
