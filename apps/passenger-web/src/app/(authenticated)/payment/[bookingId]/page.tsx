import { Armchair, Ticket } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PayNowCard } from '../../../../features/payment/pay-now-card';
import { getPassengerSession } from '../../../../lib/auth';
import { getBookingById } from '../../../../lib/bookings';
import {
  buildLoginHref,
  formatDateTime,
  formatMoney,
  pathWithSearch,
} from '../../../../lib/format';
import { AlertBanner } from '../../../../shared/components/AlertBanner';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

export const metadata = { title: 'Payment · Bus Booking' };

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: { bookingId: string };
  searchParams: {
    amount?: string;
    currency?: string;
    seats?: string;
    status?: string;
    session_id?: string;
  };
}) {
  const session = await getPassengerSession();
  if (!session) {
    redirect(
      buildLoginHref(pathWithSearch(`/payment/${params.bookingId}`, searchParams)),
    );
  }

  const booking = await getBookingById(params.bookingId);
  const checkoutStatus = searchParams.status?.toLowerCase();

  const requestedAmount = Number(searchParams.amount);
  const bookingFare =
    booking?.fareAmount !== undefined && booking.fareAmount > 0
      ? booking.fareAmount
      : undefined;
  const amount =
    Number.isFinite(requestedAmount) && requestedAmount > 0
      ? requestedAmount
      : bookingFare;
  const currency = searchParams.currency ?? booking?.currency ?? 'LKR';
  const seats = searchParams.seats?.split(',').filter(Boolean) ?? [];

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        backHref="/bookings"
        backLabel="My bookings"
        subtitle="Complete payment to lock in your seats for good."
        title="Payment"
      />

      {checkoutStatus === 'success' && (
        <AlertBanner tone="success">
          Payment submitted. Stripe is confirming your charge — this page will
          show as paid once the webhook lands. You can return to My bookings.
          {searchParams.session_id ? (
            <>
              {' '}
              Session <span className="font-mono text-xs">{searchParams.session_id}</span>
            </>
          ) : null}
        </AlertBanner>
      )}
      {checkoutStatus === 'cancelled' && (
        <AlertBanner>
          Checkout was cancelled. You can try again whenever you are ready.
        </AlertBanner>
      )}

      <section className="ui-card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Booking reference
            </p>
            <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{params.bookingId}</p>
          </div>
          {booking && <StatusBadge status={booking.status} />}
        </div>

        <dl className="grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Seat{seats.length > 1 ? 's' : ''}</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
              <Armchair aria-hidden="true" className="h-4 w-4 text-brand-600" />
              {seats.length ? seats.join(', ') : booking?.seatNo ?? '—'}
            </dd>
          </div>
          {booking && (
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Booked</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100">
                {formatDateTime(booking.createdAt)}
              </dd>
            </div>
          )}
          {amount !== undefined && (
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Total</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(amount, currency)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {checkoutStatus === 'success' ? (
        <section className="ui-card space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="ui-btn-primary min-h-[48px] w-full sm:w-auto" href="/bookings">
              <Ticket aria-hidden="true" className="h-4 w-4" />
              View my bookings
            </Link>
            <Link className="ui-btn-ghost min-h-[48px] w-full sm:w-auto" href="/search">
              Book another trip
            </Link>
          </div>
        </section>
      ) : amount === undefined ? (
        <EmptyState
          action={
            <Link className="ui-btn-primary min-h-[44px]" href="/bookings">
              <Ticket aria-hidden="true" className="h-4 w-4" />
              Go to my bookings
            </Link>
          }
          description="We could not work out the amount for this booking. Open it again from My bookings."
          icon={Ticket}
          title="Payment details unavailable"
        />
      ) : (
        <>
          <PayNowCard
            amount={amount}
            bookingId={params.bookingId}
            currency={currency}
            userId={session.userId}
          />
          {!booking && (
            <AlertBanner>
              We could not load this booking from your account, so the amount
              shown comes from your last checkout step.
            </AlertBanner>
          )}
        </>
      )}
    </div>
  );
}
