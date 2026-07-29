'use client';

import {
  type SeatSocketFactory,
  useBookingDraft,
  useBookingDraftStore,
  useRemainingSeconds,
  useSeatMap,
  useSeatMapSocket,
} from '@bus-booking/passenger-core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { passengerApi } from '../../lib/passenger-api';
import { SeatGrid } from '../../shared/components/seat-grid';

const createSocket: SeatSocketFactory = (url, options) =>
  io(url, {
    ...options,
    transports: [...options.transports],
    auth: options.auth ? { ...options.auth } : undefined,
  }) as never;

export function SeatMapClient({
  tripId,
  userId,
}: {
  tripId: string;
  userId: string;
}) {
  const seatMap = useSeatMap(passengerApi, tripId);
  const draft = useBookingDraft(passengerApi);
  const startTrip = draft.startTrip;
  const remaining = useRemainingSeconds(draft.expiresAt);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    startTrip(tripId);
    void fetch('/api/ws-token', { method: 'POST' })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => setWsToken(body?.token ?? null));
  }, [startTrip, tripId]);

  const socketStatus = useSeatMapSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3020'}/seats`,
    tripId,
    accessToken: wsToken,
    createSocket,
  });

  useEffect(() => {
    return () => {
      const current = useBookingDraftStore.getState();
      if (current.tripId !== tripId || !Object.keys(current.lockTokens).length) return;
      const body = JSON.stringify({
        tripId,
        locks: Object.entries(current.lockTokens).map(([seatNo, lockToken]) => ({
          seatNo,
          lockToken,
        })),
      });
      navigator.sendBeacon(
        '/api/bookings/release-seat',
        new Blob([body], { type: 'application/json' }),
      );
    };
  }, [tripId]);

  async function lockSelected() {
    setMessage('');
    try {
      await draft.lockSeats({ userId });
      setMessage('Seats locked. WebSocket updates remain the source of truth.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to lock seats');
    }
  }

  if (seatMap.isLoading) return <div className="card">Loading live seat map…</div>;
  if (!seatMap.data) {
    return <div className="card error">The seat map endpoint returned no data.</div>;
  }

  return (
    <section className="card stack">
      <div className="toolbar">
        <strong>Select one or more seats</strong>
        <span className="muted">Live: {socketStatus}</span>
      </div>
      <SeatGrid
        columns={seatMap.data.columns}
        seats={seatMap.data.seats}
        selectedSeats={draft.selectedSeats}
        locked={Object.keys(draft.lockTokens).length > 0}
        onToggle={draft.toggleSeat}
      />
      <div className="toolbar">
        <span>{draft.selectedSeats.length} selected</span>
        {draft.expiresAt && <strong>{remaining}s remaining</strong>}
      </div>
      {message && <p className={draft.lockMutation.isError ? 'error' : 'muted'}>{message}</p>}
      {Object.keys(draft.lockTokens).length ? (
        <Link className="button" href={`/trips/${tripId}/booking`}>Continue booking</Link>
      ) : (
        <button disabled={!draft.selectedSeats.length || draft.lockMutation.isPending} onClick={lockSelected}>
          {draft.lockMutation.isPending ? 'Locking…' : 'Lock selected seats'}
        </button>
      )}
    </section>
  );
}
