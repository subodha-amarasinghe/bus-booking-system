'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ConfirmBookingRequestSchema,
  type ConfirmBookingRequest,
} from '@bus-booking/shared-types';
import {
  useBookingDraft,
  useRemainingSeconds,
} from '@bus-booking/passenger-core';
import clsx from 'clsx';
import { Armchair, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatCountdown, formatMoney } from '../../lib/format';
import { passengerApi } from '../../lib/passenger-api';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { EmptyState } from '../../shared/components/EmptyState';
import { Spinner } from '../../shared/components/LoadingBlock';

/** Only the two fields the passenger types; the rest comes from the draft. */
const PassengerDetailsSchema = ConfirmBookingRequestSchema.pick({
  passengerName: true,
  passengerPhone: true,
});

type PassengerDetails = Pick<
  ConfirmBookingRequest,
  'passengerName' | 'passengerPhone'
>;

export function BookingForm({
  tripId,
  userId,
  defaultName = '',
  defaultPhone = '',
  fareAmount,
  currency = 'LKR',
}: {
  tripId: string;
  userId: string;
  defaultName?: string;
  defaultPhone?: string;
  fareAmount?: number;
  currency?: string;
}) {
  const router = useRouter();
  const draft = useBookingDraft(passengerApi);
  const remaining = useRemainingSeconds(draft.expiresAt);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PassengerDetails>({
    resolver: zodResolver(PassengerDetailsSchema),
    defaultValues: {
      passengerName: defaultName,
      passengerPhone: defaultPhone,
    },
  });

  const heldSeats = Object.keys(draft.lockTokens);
  const draftReady =
    draft.tripId === tripId && draft.selectedSeats.length > 0 && heldSeats.length > 0;
  const holdExpired = draftReady && remaining === 0;
  const urgent = remaining > 0 && remaining < 60;

  async function confirm(values: PassengerDetails) {
    setError('');
    try {
      const bookings = await draft.confirm({ userId, ...values });
      const first = bookings[0];
      if (!first) {
        router.push('/bookings');
        return;
      }
      const payable = bookings.reduce(
        (sum, booking) => sum + booking.fareAmount,
        0,
      );
      const params = new URLSearchParams({
        amount: String(payable),
        currency: first.currency,
        seats: bookings.map((booking) => booking.seatNo).join(','),
      });
      router.push(`/payment/${first.bookingId}?${params.toString()}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'We could not confirm this booking. Please try again.',
      );
    }
  }

  if (!draftReady) {
    return (
      <EmptyState
        action={
          <Link className="ui-btn-primary min-h-[44px]" href={`/trips/${tripId}`}>
            Choose seats
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        }
        description="Select and hold your seats first — holds expire after a few minutes of inactivity."
        icon={Armchair}
        title="No seats are being held"
      />
    );
  }

  const total =
    fareAmount === undefined ? undefined : fareAmount * draft.selectedSeats.length;

  return (
    <div className="space-y-4">
      <section className="ui-card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your seats
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {draft.selectedSeats.map((seatNo) => (
            <li className="ui-badge bg-brand-600 text-white" key={seatNo}>
              {seatNo}
            </li>
          ))}
        </ul>
        {total !== undefined && (
          <dl className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <dt className="text-slate-500">
              {draft.selectedSeats.length} × {formatMoney(fareAmount ?? 0, currency)}
            </dt>
            <dd className="text-lg font-bold text-slate-900">
              {formatMoney(total, currency)}
            </dd>
          </dl>
        )}
        <div
          className={clsx(
            'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
            holdExpired || urgent
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-amber-200 bg-amber-50 text-amber-800',
          )}
          role="status"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Clock aria-hidden="true" className="h-4 w-4" />
            {holdExpired ? 'Seat hold expired' : 'Time left to confirm'}
          </span>
          <span className="font-mono text-lg font-bold tabular-nums">
            {formatCountdown(remaining)}
          </span>
        </div>
      </section>

      {holdExpired ? (
        <div className="ui-card space-y-3">
          <AlertBanner>
            Your hold expired, so these seats are back on sale. Pick them again to
            continue.
          </AlertBanner>
          <Link className="ui-btn-primary min-h-[48px] w-full" href={`/trips/${tripId}`}>
            Back to seat map
          </Link>
        </div>
      ) : (
        <form className="ui-card space-y-4" onSubmit={handleSubmit(confirm)}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Passenger details
          </h2>

          <div>
            <label className="ui-label" htmlFor="passengerName">
              Passenger name
            </label>
            <input
              autoComplete="name"
              className="ui-input min-h-[48px]"
              id="passengerName"
              {...register('passengerName')}
            />
            {errors.passengerName && (
              <p className="mt-1 text-xs text-rose-600">
                Enter the name of the travelling passenger.
              </p>
            )}
          </div>

          <div>
            <label className="ui-label" htmlFor="passengerPhone">
              Contact number
            </label>
            <input
              autoComplete="tel"
              className="ui-input min-h-[48px]"
              id="passengerPhone"
              inputMode="tel"
              placeholder="07XXXXXXXX"
              {...register('passengerPhone')}
            />
            {errors.passengerPhone && (
              <p className="mt-1 text-xs text-rose-600">
                Enter a contact number for trip updates.
              </p>
            )}
          </div>

          {error && <AlertBanner>{error}</AlertBanner>}

          <button
            className="ui-btn-primary min-h-[48px] w-full"
            disabled={isSubmitting || draft.confirmMutation.isPending}
            type="submit"
          >
            {isSubmitting || draft.confirmMutation.isPending ? <Spinner /> : null}
            {isSubmitting || draft.confirmMutation.isPending
              ? 'Confirming…'
              : 'Confirm and continue to payment'}
          </button>
          <p className="text-xs text-slate-500">
            One booking is created per seat. You pay on the next step.
          </p>
        </form>
      )}
    </div>
  );
}
