'use client';

import { useBookingDraft } from '@bus-booking/passenger-core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { passengerApi } from '../../lib/passenger-api';

export function BookingForm({
  tripId,
  userId,
}: {
  tripId: string;
  userId: string;
}) {
  const router = useRouter();
  const draft = useBookingDraft(passengerApi);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [error, setError] = useState('');

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const bookings = await draft.confirm({
        userId,
        passengerName,
        passengerPhone,
      });
      const first = bookings[0];
      router.push(first ? `/payment/${first.bookingId}` : '/bookings');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Confirmation failed');
    }
  }

  if (draft.tripId !== tripId || !draft.selectedSeats.length) {
    return <div className="card error">Your seat draft is empty or belongs to another trip.</div>;
  }

  return (
    <form className="card" onSubmit={confirm}>
      <p><strong>Seats:</strong> {draft.selectedSeats.join(', ')}</p>
      <label>Passenger name<input required value={passengerName} onChange={(event) => setPassengerName(event.target.value)} /></label>
      <label>Passenger phone<input required value={passengerPhone} onChange={(event) => setPassengerPhone(event.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <button disabled={draft.confirmMutation.isPending}>
        {draft.confirmMutation.isPending ? 'Confirming…' : 'Confirm booking'}
      </button>
    </form>
  );
}
