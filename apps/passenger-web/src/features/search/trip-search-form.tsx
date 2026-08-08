'use client';

import { SearchTripsRequestSchema } from '@bus-booking/shared-types';
import clsx from 'clsx';
import { ArrowLeftRight, CalendarDays, MapPin, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LocationOption } from '../../lib/locations';
import { toDateInputValue } from '../../lib/format';
import { AlertBanner } from '../../shared/components/AlertBanner';

export interface TripSearchDefaults {
  readonly originLocationId?: string;
  readonly destinationLocationId?: string;
  readonly departureDate?: string;
}

function optionLabel(location: LocationOption): string {
  return location.code ? `${location.name} (${location.code})` : location.name;
}

/**
 * Native GET form so the page still works without JavaScript; the submit
 * handler adds client-side validation and a soft navigation when JS is on.
 */
export function TripSearchForm({
  locations,
  defaults,
  submitLabel = 'Search buses',
  compact = false,
}: {
  locations: LocationOption[];
  defaults?: TripSearchDefaults;
  submitLabel?: string;
  /** Desktop: single-row refine bar with shorter controls (search results page). */
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [origin, setOrigin] = useState(defaults?.originLocationId ?? '');
  const [destination, setDestination] = useState(
    defaults?.destinationLocationId ?? '',
  );
  const [departureDate, setDepartureDate] = useState(
    defaults?.departureDate ?? toDateInputValue(),
  );
  const [error, setError] = useState('');

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!origin || !destination) {
      setError('Choose where you are travelling from and to.');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination must be different.');
      return;
    }

    const parsed = SearchTripsRequestSchema.safeParse({
      originLocationId: origin,
      destinationLocationId: destination,
      departureDate: departureDate || undefined,
    });
    if (!parsed.success) {
      setError('That travel date is not valid.');
      return;
    }

    const params = new URLSearchParams({
      originLocationId: origin,
      destinationLocationId: destination,
    });
    if (departureDate) params.set('departureDate', departureDate);
    const href = `/search?${params.toString()}`;
    // Refining on the results page should not stack identical search entries.
    if (pathname === '/search') {
      router.replace(href);
    } else {
      router.push(href);
    }
  }

  const noLocations = locations.length === 0;
  const fieldHeight = compact ? 'min-h-[44px] lg:min-h-[40px]' : 'min-h-[48px]';
  const labelClass = clsx(
    'ui-label',
    compact && 'lg:mb-1 lg:text-xs',
  );

  return (
    <form
      action="/search"
      className={clsx(
        compact ? 'space-y-3 lg:space-y-0' : 'space-y-4',
        compact && 'lg:flex lg:items-end lg:gap-3',
      )}
      method="get"
      onSubmit={submit}
      noValidate
    >
      <div
        className={clsx(
          'grid gap-4 sm:grid-cols-2',
          compact && 'gap-3 lg:flex lg:min-w-0 lg:flex-1 lg:gap-3',
        )}
      >
        <div className={clsx(compact && 'lg:min-w-0 lg:flex-1')}>
          <label className={labelClass} htmlFor="originLocationId">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4 text-brand-600" />
              Travelling from
            </span>
          </label>
          <select
            className={clsx('ui-select', fieldHeight)}
            disabled={noLocations}
            id="originLocationId"
            name="originLocationId"
            onChange={(event) => setOrigin(event.target.value)}
            value={origin}
          >
            <option value="">Select origin</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {optionLabel(location)}
              </option>
            ))}
          </select>
        </div>

        <div className={clsx(compact && 'lg:min-w-0 lg:flex-1')}>
          <div className="flex items-center justify-between gap-2">
            <label className={labelClass} htmlFor="destinationLocationId">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-brand-600" />
                Travelling to
              </span>
            </label>
            <button
              className={clsx(
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:bg-brand-950 dark:text-brand-300',
                compact ? 'mb-1' : 'mb-1.5',
              )}
              onClick={swap}
              type="button"
            >
              <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
              Swap
            </button>
          </div>
          <select
            className={clsx('ui-select', fieldHeight)}
            disabled={noLocations}
            id="destinationLocationId"
            name="destinationLocationId"
            onChange={(event) => setDestination(event.target.value)}
            value={destination}
          >
            <option value="">Select destination</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {optionLabel(location)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={clsx(compact && 'lg:w-44 lg:shrink-0')}>
        <label className={labelClass} htmlFor="departureDate">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand-600" />
            Travel date
          </span>
        </label>
        <input
          className={clsx('ui-input', fieldHeight)}
          id="departureDate"
          name="departureDate"
          onChange={(event) => setDepartureDate(event.target.value)}
          type="date"
          value={departureDate}
        />
      </div>

      {(error || noLocations) && (
        <div className={clsx(compact && 'w-full lg:basis-full')}>
          {error && <AlertBanner>{error}</AlertBanner>}
          {noLocations && (
            <AlertBanner>
              Locations could not be loaded. Start the API gateway and run{' '}
              <code className="font-mono">pnpm db:seed</code>, then refresh.
            </AlertBanner>
          )}
        </div>
      )}

      <button
        className={clsx(
          'ui-btn-primary w-full',
          compact
            ? 'min-h-[44px] lg:min-h-[40px] lg:w-auto lg:shrink-0 lg:px-5'
            : 'min-h-[48px]',
        )}
        type="submit"
      >
        <Search aria-hidden="true" className="h-[18px] w-[18px]" />
        {submitLabel}
      </button>
    </form>
  );
}
