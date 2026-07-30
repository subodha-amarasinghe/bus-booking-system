import { Armchair, Ticket } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PayNowCard } from '../../../../features/payment/pay-now-card';
import { getPassengerSession } from '../../../../lib/auth';
import { getBookingById } from '../../../../lib/bookings';
import { formatDateTime, formatMoney } from '../../../../lib/format';
import { AlertBanner } from '../../../../shared/components/AlertBanner';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

export const metadata = { title: 'Payment · Bus Booking' };

/** Only same-origin or explicit https checkout URLs are embedded. */
function safeCheckoutUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: { bookingId: string };
  searchParams: { checkoutUrl?: string; amount?: string; currency?: string; seats?: string };
}) {
  const session = await getPassengerSession();
  if (!session) redirect(`/login?next=/payment/${params.bookingId}`);

  const booking = await getBookingById(params.bookingId);
  const checkoutUrl = safeCheckoutUrl(searchParams.checkoutUrl);

  const requestedAmount = Number(searchParams.amount);
  const amount =
    Number.isFinite(requestedAmount) && requestedAmount > 0
      ? requestedAmount
      : booking?.fareAmount;
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

      <section className="ui-card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Booking reference
            </p>
            <p className="font-mono text-sm text-slate-700">{params.bookingId}</p>
          </div>
          {booking && <StatusBadge status={booking.status} />}
        </div>

        <dl className="grid gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Seat{seats.length > 1 ? 's' : ''}</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Armchair aria-hidden="true" className="h-4 w-4 text-brand-600" />
              {seats.length ? seats.join(', ') : booking?.seatNo ?? '—'}
            </dd>
          </div>
          {booking && (
            <div>
              <dt className="text-slate-500">Booked</dt>
              <dd className="font-semibold text-slate-900">
                {formatDateTime(booking.createdAt)}
              </dd>
            </div>
          )}
          {amount !== undefined && (
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(amount, currency)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {checkoutUrl ? (
        <section className="ui-card space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Secure checkout
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <iframe
              allow="payment"
              className="h-[520px] w-full"
              src={checkoutUrl}
              title="Secure hosted payment checkout"
            />
          </div>
          <p className="text-xs text-slate-500">
            Payment is handled by our provider in the frame above.
          </p>
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
