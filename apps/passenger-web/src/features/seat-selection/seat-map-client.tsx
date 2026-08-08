'use client';

import {
  type SeatSocketFactory,
  useBookingDraft,
  useBookingDraftStore,
  useRemainingSeconds,
  useSeatMap,
  useSeatMapSocket,
} from '@bus-booking/passenger-core';
import clsx from 'clsx';
import { ArrowRight, Clock, LockKeyhole, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { formatCountdown, formatMoney } from '../../lib/format';
import { passengerApi } from '../../lib/passenger-api';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';
import {
  SeatGrid,
  SeatGridSkeleton,
  SeatLegend,
} from '../../shared/components/seat-grid';

const createSocket: SeatSocketFactory = (url, options) =>
  io(url, {
    ...options,
    transports: [...options.transports],
    auth: options.auth ? { ...options.auth } : undefined,
  }) as never;

const LIVE_LABELS: Record<string, string> = {
  connecting: 'Connecting to live updates…',
  connected: 'Live seat updates on',
  disconnected: 'Live updates paused',
  error: 'Live updates unavailable',
};

export function SeatMapClient({
  tripId,
  userId,
  fareAmount,
  currency = 'LKR',
  bookingHref,
}: {
  tripId: string;
  userId: string;
  fareAmount?: number;
  currency?: string;
  /** Passenger-details URL with trip context query preserved. */
  bookingHref?: string;
}) {
  const seatMap = useSeatMap(passengerApi, tripId);
  const draft = useBookingDraft(passengerApi);
  const startTrip = draft.startTrip;
  const remaining = useRemainingSeconds(draft.expiresAt);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const continueHref =
    bookingHref ??
    (fareAmount === undefined
      ? `/trips/${tripId}/booking`
      : `/trips/${tripId}/booking?fare=${fareAmount}&currency=${currency}`);

  useEffect(() => {
    startTrip(tripId);
    void fetch('/api/ws-token', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setWsToken(body?.token ?? null))
      .catch(() => setWsToken(null));
  }, [startTrip, tripId]);

  const socketStatus = useSeatMapSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3020'}/seats`,
    tripId,
    accessToken: wsToken,
    createSocket,
  });

  // Leaving the seat map abandons the hold, except when the passenger is
  // moving forward — the booking step needs those lock tokens to confirm.
  const continuingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (continuingRef.current) return;
      const current = useBookingDraftStore.getState();
      if (current.tripId !== tripId || !Object.keys(current.lockTokens).length) return;
      const body = JSON.stringify({
        tripId,
        locks: Object.entries(current.lockTokens).map(([seatNo, lockToken]) => ({
          seatNo: Number(seatNo),
          lockToken,
        })),
      });
      navigator.sendBeacon(
        '/api/bookings/release-seat',
        new Blob([body], { type: 'application/json' }),
      );
    };
  }, [tripId]);

  const heldSeats = Object.keys(draft.lockTokens);
  const hasHold = heldSeats.length > 0;
  const holdExpired = hasHold && remaining === 0;
  const urgent = hasHold && remaining > 0 && remaining < 60;

  async function lockSelected() {
    setError('');
    try {
      await draft.lockSeats({ userId });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Those seats could not be held. Someone may have taken them.',
      );
    }
  }

  function startOver() {
    setError('');
    draft.reset();
    startTrip(tripId);
    void seatMap.refetch();
  }

  if (seatMap.isLoading) {
    return (
      <div className="ui-card space-y-4">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <SeatGridSkeleton />
      </div>
    );
  }

  if (seatMap.isError || !seatMap.data) {
    return (
      <div className="ui-card space-y-4">
        <AlertBanner>
          {seatMap.error instanceof Error
            ? seatMap.error.message
            : 'The live seat map could not be loaded.'}
        </AlertBanner>
        <button
          className="ui-btn-secondary min-h-[44px]"
          onClick={() => void seatMap.refetch()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const total =
    fareAmount === undefined
      ? undefined
      : fareAmount * draft.selectedSeats.length;

  return (
    <div className="space-y-4">
      <section className="ui-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeatLegend />
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span
              aria-hidden="true"
              className={clsx(
                'h-2 w-2 rounded-full',
                socketStatus === 'connected'
                  ? 'bg-emerald-500'
                  : socketStatus === 'connecting'
                    ? 'bg-amber-400'
                    : 'bg-slate-300',
              )}
            />
            {LIVE_LABELS[socketStatus]}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3 sm:p-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Front of bus
          </p>
          <SeatGrid
            columns={seatMap.data.columns}
            locked={hasHold}
            onToggle={draft.toggleSeat}
            seats={seatMap.data.seats}
            selectedSeats={draft.selectedSeats}
          />
        </div>

        {holdExpired && (
          <AlertBanner>
            Your seat hold expired. Pick your seats again to continue.
          </AlertBanner>
        )}

        {error && <AlertBanner>{error}</AlertBanner>}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {hasHold
            ? 'Held seats are released automatically if you leave this page.'
            : 'Hold your seats to reserve them while you enter passenger details.'}
        </p>
      </section>

      {/* Compact enough that it never hides more than one row of seats. */}
      <section className="ui-card sticky bottom-4 z-20 flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {draft.selectedSeats.length
              ? `${draft.selectedSeats.length} seat${draft.selectedSeats.length === 1 ? '' : 's'}`
              : 'No seats selected'}
          </p>
          {draft.selectedSeats.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {draft.selectedSeats.map((seatNo) => (
                <li className="ui-badge bg-brand-600 text-white" key={seatNo}>
                  {seatNo}
                </li>
              ))}
            </ul>
          )}
          {total !== undefined && total > 0 && (
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {formatMoney(total, currency)}
            </span>
          )}
          {hasHold && !holdExpired && (
            <span
              aria-label={`${remaining} seconds left to confirm`}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums',
                urgent
                  ? 'bg-rose-100 text-rose-700 dark:text-rose-200'
                  : 'bg-amber-100 text-amber-800 dark:text-amber-200',
              )}
              role="status"
            >
              <Clock aria-hidden="true" className="h-4 w-4" />
              {formatCountdown(remaining)}
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {holdExpired ? (
            <button
              className="ui-btn-primary min-h-[48px] w-full sm:w-auto"
              onClick={startOver}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Start over
            </button>
          ) : hasHold ? (
            <Link
              className="ui-btn-primary min-h-[48px] w-full sm:w-auto"
              href={continueHref}
              onClick={() => {
                continuingRef.current = true;
              }}
            >
              Continue to passenger details
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <button
                className="ui-btn-secondary min-h-[48px] w-full sm:w-auto"
                disabled={
                  !draft.selectedSeats.length || draft.lockMutation.isPending
                }
                onClick={lockSelected}
                type="button"
              >
                {draft.lockMutation.isPending ? (
                  <Spinner />
                ) : (
                  <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                )}
                {draft.lockMutation.isPending ? 'Holding…' : 'Hold these seats'}
              </button>
              <button
                className="ui-btn-primary min-h-[48px] w-full sm:w-auto"
                disabled
                type="button"
              >
                Continue
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
