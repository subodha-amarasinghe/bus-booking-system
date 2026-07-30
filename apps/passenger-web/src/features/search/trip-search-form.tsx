'use client';

import { SearchTripsRequestSchema } from '@bus-booking/shared-types';
import { ArrowLeftRight, CalendarDays, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
}: {
  locations: LocationOption[];
  defaults?: TripSearchDefaults;
  submitLabel?: string;
}) {
  const router = useRouter();
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
    router.push(`/search?${params.toString()}`);
  }

  const noLocations = locations.length === 0;

  return (
    <form
      action="/search"
      className="space-y-4"
      method="get"
      onSubmit={submit}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ui-label" htmlFor="originLocationId">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4 text-brand-600" />
              Travelling from
            </span>
          </label>
          <select
            className="ui-select min-h-[48px]"
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

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="ui-label" htmlFor="destinationLocationId">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-brand-600" />
                Travelling to
              </span>
            </label>
            <button
              className="mb-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              onClick={swap}
              type="button"
            >
              <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
              Swap
            </button>
          </div>
          <select
            className="ui-select min-h-[48px]"
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

      <div>
        <label className="ui-label" htmlFor="departureDate">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-4 w-4 text-brand-600" />
            Travel date
          </span>
        </label>
        <input
          className="ui-input min-h-[48px]"
          id="departureDate"
          name="departureDate"
          onChange={(event) => setDepartureDate(event.target.value)}
          type="date"
          value={departureDate}
        />
      </div>

      {error && <AlertBanner>{error}</AlertBanner>}
      {noLocations && (
        <AlertBanner>
          Locations could not be loaded. Start the API gateway and run{' '}
          <code className="font-mono">pnpm db:seed</code>, then refresh.
        </AlertBanner>
      )}

      <button className="ui-btn-primary min-h-[48px] w-full" type="submit">
        <Search aria-hidden="true" className="h-[18px] w-[18px]" />
        {submitLabel}
      </button>
    </form>
  );
}
