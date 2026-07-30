'use client';

import { CancellationRequestSchema } from '@bus-booking/shared-types';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';

export function CancelBookingButton({
  bookingId,
  userId,
  seatNo,
}: {
  bookingId: string;
  userId: string;
  seatNo: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function cancel() {
    setError('');
    const payload = CancellationRequestSchema.safeParse({
      bookingId,
      userId,
      reason: 'Cancelled by passenger',
    });
    if (!payload.success) {
      setError('This booking cannot be cancelled from here.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/cancellations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message ?? 'The cancellation could not be submitted.');
        setPending(false);
        return;
      }
      setConfirming(false);
      setPending(false);
      router.refresh();
    } catch {
      setError('We could not reach the cancellation service.');
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-2">
        <button
          className="ui-btn-ghost min-h-[44px] text-rose-700 hover:bg-rose-50"
          onClick={() => setConfirming(true)}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Cancel booking
        </button>
        {error && <AlertBanner>{error}</AlertBanner>}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <p className="text-sm font-medium text-rose-800">
        Cancel seat {seatNo}? Refunds follow the fare rules for this trip.
      </p>
      {error && <AlertBanner>{error}</AlertBanner>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="ui-btn-danger min-h-[44px]"
          disabled={pending}
          onClick={cancel}
          type="button"
        >
          {pending ? <Spinner /> : null}
          {pending ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <button
          className="ui-btn-ghost min-h-[44px]"
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Keep booking
        </button>
      </div>
    </div>
  );
}
