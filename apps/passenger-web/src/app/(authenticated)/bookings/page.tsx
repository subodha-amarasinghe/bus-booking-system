import { BookingStatus, type Booking } from '@bus-booking/shared-types';
import { Armchair, CalendarDays, Search, Ticket, UserRound } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CancelBookingButton } from '../../../features/my-bookings/cancel-booking-button';
import { getPassengerSession } from '../../../lib/auth';
import { getMyBookings } from '../../../lib/bookings';
import { buildLoginHref, formatDateTime, formatMoney } from '../../../lib/format';
import { EmptyState } from '../../../shared/components/EmptyState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';

export const metadata = { title: 'My bookings · Bus Booking' };

const CANCELLABLE: readonly BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.LOCKED,
];

function BookingCard({
  booking,
  userId,
}: {
  booking: Booking;
  userId: string;
}) {
  return (
    <li className="ui-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
            <Armchair aria-hidden="true" className="h-5 w-5 text-brand-600" />
            Seat {booking.seatNo}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">{booking.id}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={booking.status} />
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(booking.fareAmount, booking.currency)}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <UserRound aria-hidden="true" className="h-4 w-4" />
            Passenger
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
            {booking.passengerName}
            <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
              · {booking.passengerPhone}
            </span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {booking.confirmedAt ? 'Confirmed' : 'Created'}
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
            {formatDateTime(booking.confirmedAt ?? booking.createdAt)}
          </dd>
        </div>
      </dl>

      {CANCELLABLE.includes(booking.status) && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <CancelBookingButton
            bookingId={booking.id}
            seatNo={booking.seatNo}
            userId={userId}
          />
        </div>
      )}
    </li>
  );
}

export default async function BookingsPage() {
  const session = await getPassengerSession();
  if (!session) redirect(buildLoginHref('/bookings'));

  const bookings = await getMyBookings();
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link className="ui-btn-secondary min-h-[44px]" href="/search">
            <Search aria-hidden="true" className="h-4 w-4" />
            Book another trip
          </Link>
        }
        subtitle={
          sorted.length
            ? `${sorted.length} booking${sorted.length === 1 ? '' : 's'} on your account`
            : 'Your tickets appear here as soon as a booking is confirmed.'
        }
        title="My bookings"
      />

      {sorted.length === 0 ? (
        <EmptyState
          action={
            <Link className="ui-btn-primary min-h-[44px]" href="/search">
              <Search aria-hidden="true" className="h-4 w-4" />
              Find a bus
            </Link>
          }
          description="Once you confirm a seat, the ticket details show up here with its status and fare."
          icon={Ticket}
          title="No bookings yet"
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking.id}
              userId={session.userId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
