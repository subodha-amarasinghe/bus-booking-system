'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { CalendarClock, Plus, Search, ShieldCheck } from 'lucide-react';
import {
  CreateTripRequestSchema,
  UserRole,
  type Bus,
  type Route,
  type Trip,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  errorMessage,
  getJson,
  postJson,
  queryKeys,
} from '../../lib/client-api';
import { formatDateTime, formatMoney } from '../../lib/format';

/**
 * `datetime-local` gives strings and the shared schema coerces dates, so the
 * two timestamp fields are overridden here and converted on submit.
 */
const TripFormSchema = CreateTripRequestSchema.extend({
  departureAt: z.string().min(1),
  arrivalAt: z.string().optional(),
  currency: z.string().min(1),
});
type TripFormValues = z.infer<typeof TripFormSchema>;

interface TripFilters {
  routeId: string;
  departureDate: string;
}

const EMPTY_FILTERS: TripFilters = { routeId: '', departureDate: '' };

export function TripsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TripFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<TripFilters>(EMPTY_FILTERS);
  const [savedTrip, setSavedTrip] = useState<string | null>(null);

  const busesQuery = useQuery({
    queryKey: queryKeys.buses,
    queryFn: () => getJson<Bus[]>('/api/buses'),
  });
  const routesQuery = useQuery({
    queryKey: queryKeys.routes,
    queryFn: () => postJson<Route[]>('/api/routes/list', {}),
  });
  const tripsQuery = useQuery({
    queryKey: queryKeys.trips(filters),
    queryFn: () =>
      postJson<Trip[]>('/api/trips/search', {
        ...(filters.routeId ? { routeId: filters.routeId } : {}),
        ...(filters.departureDate
          ? { departureDate: filters.departureDate }
          : {}),
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(TripFormSchema),
    defaultValues: { currency: 'LKR', fareAmount: 0 },
  });

  const createTrip = useMutation({
    mutationFn: (values: TripFormValues) =>
      postJson<Trip>('/api/trips', {
        busId: values.busId,
        routeId: values.routeId,
        departureAt: new Date(values.departureAt).toISOString(),
        arrivalAt: values.arrivalAt
          ? new Date(values.arrivalAt).toISOString()
          : undefined,
        fareAmount: values.fareAmount,
        currency: values.currency,
      }),
    onSuccess: async (trip) => {
      setSavedTrip(formatDateTime(trip.departureAt));
      reset({ currency: 'LKR', fareAmount: 0 });
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const buses = busesQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const trips = tripsQuery.data ?? [];
  const hasFilters = Boolean(filters.routeId || filters.departureDate);

  const busLabel = (id: string) => {
    const bus = buses.find((item) => item.id === id);
    return bus ? `${bus.plateNumber}` : 'Unknown bus';
  };
  const routeLabel = (id: string) =>
    routes.find((item) => item.id === id)?.name ?? 'Unknown route';

  return (
    <>
      <PageHeader
        title="Trips"
        description="Schedule departures for a bus on a route and set the fare passengers pay."
        icon={CalendarClock}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <SectionCard
            title="Find trips"
            description="Leave the filters empty to list every scheduled trip."
            icon={Search}
          >
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                setFilters(draftFilters);
              }}
            >
              <Field label="Route" htmlFor="filterRoute">
                <select
                  id="filterRoute"
                  className="ui-select"
                  value={draftFilters.routeId}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      routeId: event.target.value,
                    }))
                  }
                >
                  <option value="">All routes</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Departure date" htmlFor="filterDate">
                <input
                  id="filterDate"
                  type="date"
                  className="ui-input"
                  value={draftFilters.departureDate}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      departureDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="flex gap-2">
                <button type="submit" className="ui-btn-primary">
                  <Search className="h-4 w-4" aria-hidden />
                  Search
                </button>
                {hasFilters ? (
                  <button
                    type="button"
                    className="ui-btn-ghost"
                    onClick={() => {
                      setDraftFilters(EMPTY_FILTERS);
                      setFilters(EMPTY_FILTERS);
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Scheduled trips"
            description={
              trips.length > 0
                ? `${trips.length} trip${trips.length === 1 ? '' : 's'} found.`
                : 'Trips matching your filters appear here.'
            }
            icon={CalendarClock}
          >
            {tripsQuery.isPending ? (
              <LoadingBlock label="Loading trips…" />
            ) : tripsQuery.isError ? (
              <ErrorAlert message={errorMessage(tripsQuery.error)} />
            ) : trips.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={hasFilters ? 'No trips match those filters' : 'No trips yet'}
                description={
                  hasFilters
                    ? 'Try a different route or date, or clear the filters to see everything.'
                    : 'Schedule your first departure using the form on the right.'
                }
              />
            ) : (
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th scope="col">Departure</th>
                      <th scope="col">Arrival</th>
                      <th scope="col">Route</th>
                      <th scope="col">Bus</th>
                      <th scope="col">Fare</th>
                      <th scope="col">Seats left</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="whitespace-nowrap font-medium text-slate-900">
                          {formatDateTime(trip.departureAt)}
                        </td>
                        <td className="whitespace-nowrap text-slate-500">
                          {formatDateTime(trip.arrivalAt)}
                        </td>
                        <td>{routeLabel(trip.routeId)}</td>
                        <td className="font-mono text-xs uppercase text-slate-600">
                          {busLabel(trip.busId)}
                        </td>
                        <td className="whitespace-nowrap">
                          {formatMoney(trip.fareAmount, trip.currency)}
                        </td>
                        <td>{trip.availableSeats ?? '—'}</td>
                        <td>
                          <StatusBadge status={trip.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <RequireRole
          allowed={[UserRole.ADMIN_STAFF]}
          fallback={
            <SectionCard title="Schedule a trip" className="h-fit">
              <EmptyState
                icon={ShieldCheck}
                title="Admin staff only"
                description="You can search and review trips, but scheduling one needs an admin account."
              />
            </SectionCard>
          }
        >
          <SectionCard
            title="Schedule a trip"
            description="Admin staff only."
            icon={Plus}
            className="h-fit"
          >
            {busesQuery.isPending || routesQuery.isPending ? (
              <LoadingBlock label="Loading buses and routes…" />
            ) : buses.length === 0 || routes.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Set up a bus and a route first"
                description="A trip needs a registered bus and a route between two stops."
              />
            ) : (
              <form
                className="space-y-4"
                onSubmit={handleSubmit((values) => {
                  setSavedTrip(null);
                  createTrip.mutate(values);
                })}
              >
                <Field
                  label="Bus"
                  htmlFor="tripBus"
                  error={errors.busId ? 'Choose the bus running this trip.' : undefined}
                >
                  <select
                    id="tripBus"
                    className="ui-select"
                    defaultValue=""
                    {...register('busId')}
                  >
                    <option value="" disabled>
                      Select a bus…
                    </option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plateNumber} — {bus.name ?? 'Unnamed bus'}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Route"
                  htmlFor="tripRoute"
                  error={errors.routeId ? 'Choose the route.' : undefined}
                >
                  <select
                    id="tripRoute"
                    className="ui-select"
                    defaultValue=""
                    {...register('routeId')}
                  >
                    <option value="" disabled>
                      Select a route…
                    </option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Departs"
                  htmlFor="departureAt"
                  error={
                    errors.departureAt ? 'Pick a departure date and time.' : undefined
                  }
                >
                  <input
                    id="departureAt"
                    type="datetime-local"
                    className="ui-input"
                    {...register('departureAt')}
                  />
                </Field>

                <Field
                  label="Arrives"
                  htmlFor="arrivalAt"
                  hint="Optional — leave empty if the arrival time is not fixed."
                >
                  <input
                    id="arrivalAt"
                    type="datetime-local"
                    className="ui-input"
                    {...register('arrivalAt')}
                  />
                </Field>

                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                  <Field
                    label="Fare"
                    htmlFor="fareAmount"
                    error={errors.fareAmount ? 'Enter the fare per seat.' : undefined}
                  >
                    <input
                      id="fareAmount"
                      type="number"
                      min={0}
                      step="any"
                      className="ui-input"
                      {...register('fareAmount', { valueAsNumber: true })}
                    />
                  </Field>
                  <Field
                    label="Currency"
                    htmlFor="currency"
                    error={errors.currency ? 'Required.' : undefined}
                  >
                    <input
                      id="currency"
                      className="ui-input uppercase"
                      {...register('currency')}
                    />
                  </Field>
                </div>

                {createTrip.isError ? (
                  <ErrorAlert message={errorMessage(createTrip.error)} />
                ) : null}
                {savedTrip ? (
                  <SuccessAlert message={`Trip scheduled for ${savedTrip}.`} />
                ) : null}

                <button
                  type="submit"
                  className="ui-btn-primary w-full"
                  disabled={createTrip.isPending}
                >
                  {createTrip.isPending ? (
                    <Spinner />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden />
                  )}
                  {createTrip.isPending ? 'Scheduling…' : 'Schedule trip'}
                </button>
              </form>
            )}
          </SectionCard>
        </RequireRole>
      </div>
    </>
  );
}
