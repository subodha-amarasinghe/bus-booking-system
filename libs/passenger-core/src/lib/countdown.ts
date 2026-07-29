import { useEffect, useState } from 'react';

export type ExpiryValue = Date | string | number | null | undefined;

export function remainingSeconds(
  expiresAt: ExpiryValue,
  now: number | Date = Date.now(),
): number {
  if (expiresAt === null || expiresAt === undefined) {
    return 0;
  }
  const expiryMs =
    expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  const nowMs = now instanceof Date ? now.getTime() : now;
  if (!Number.isFinite(expiryMs)) {
    return 0;
  }
  return Math.max(0, Math.ceil((expiryMs - nowMs) / 1000));
}

export function useRemainingSeconds(
  expiresAt: ExpiryValue,
  intervalMs = 1000,
): number {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));

  useEffect(() => {
    const update = () => setSeconds(remainingSeconds(expiresAt));
    update();
    if (remainingSeconds(expiresAt) === 0) {
      return;
    }
    const timer = setInterval(update, intervalMs);
    return () => clearInterval(timer);
  }, [expiresAt, intervalMs]);

  return seconds;
}
