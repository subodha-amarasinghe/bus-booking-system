'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import type { z } from 'zod';
import { MapPin, Plus, ShieldCheck, Waypoints } from 'lucide-react';
import {
  CreateLocationRequestSchema,
  CreateRouteRequestSchema,
  UserRole,
  type Location,
  type Route,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { errorMessage, postJson, queryKeys } from '../../lib/client-api';

type LocationFormValues = z.infer<typeof CreateLocationRequestSchema>;
type RouteFormValues = z.infer<typeof CreateRouteRequestSchema>;

/** Empty optional number inputs must become `undefined`, not `NaN`. */
const optionalNumber = {
  setValueAs: (value: string) =>
    value === '' ? undefined : Number(value),
} as const;

type Tab = 'locations' | 'routes';

function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => postJson<Location[]>('/api/routes/locations/list', {}),
  });
}

function LocationsTab() {
  const queryClient = useQueryClient();
  const [savedName, setSavedName] = useState<string | null>(null);
  const locationsQuery = useLocations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(CreateLocationRequestSchema),
  });

  const createLocation = useMutation({
    mutationFn: (values: LocationFormValues) =>
      postJson<Location>('/api/routes/locations', values),
    onSuccess: async (location) => {
      setSavedName(location.name);
      reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.locations });
    },
  });

  const locations = locationsQuery.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <SectionCard
        title="Stops"
        description={
          locations.length > 0
            ? `${locations.length} stop${locations.length === 1 ? '' : 's'} available for routes.`
            : 'Stops are the endpoints you can build routes from.'
        }
        icon={MapPin}
      >
        {locationsQuery.isPending ? (
          <LoadingBlock label="Loading stops…" />
        ) : locationsQuery.isError ? (
          <ErrorAlert message={errorMessage(locationsQuery.error)} />
        ) : locations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No stops yet"
            description="Add a stop with its coordinates — routes and trips are built on top of them."
          />
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Stop</th>
                  <th scope="col">Code</th>
                  <th scope="col">City</th>
                  <th scope="col">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((location) => (
                  <tr key={location.id}>
                    <td className="font-medium text-slate-900">
                      {location.name}
                    </td>
                    <td className="font-mono text-xs uppercase text-slate-500">
                      {location.code ?? '—'}
                    </td>
                    <td>{location.city ?? '—'}</td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {location.latitude.toFixed(4)},{' '}
                      {location.longitude.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <RequireRole
        allowed={[UserRole.ADMIN_STAFF]}
        fallback={
          <SectionCard title="Add a stop" className="h-fit">
            <EmptyState
              icon={ShieldCheck}
              title="Admin staff only"
              description="You can browse stops here; adding new ones needs an admin account."
            />
          </SectionCard>
        }
      >
        <SectionCard
          title="Add a stop"
          description="Admin staff only."
          icon={Plus}
          className="h-fit"
        >
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setSavedName(null);
              createLocation.mutate(values);
            })}
          >
            <Field
              label="Name"
              htmlFor="locationName"
              error={errors.name ? 'Give the stop a name.' : undefined}
            >
              <input
                id="locationName"
                className="ui-input"
                placeholder="Colombo Fort"
                {...register('name')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Code" htmlFor="locationCode" hint="Optional.">
                <input
                  id="locationCode"
                  className="ui-input uppercase"
                  placeholder="CMB"
                  {...register('code')}
                />
              </Field>
              <Field label="City" htmlFor="locationCity" hint="Optional.">
                <input
                  id="locationCity"
                  className="ui-input"
                  placeholder="Colombo"
                  {...register('city')}
                />
              </Field>
            </div>

            <Field label="District" htmlFor="locationDistrict" hint="Optional.">
              <input
                id="locationDistrict"
                className="ui-input"
                placeholder="Colombo"
                {...register('district')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Latitude"
                htmlFor="latitude"
                error={errors.latitude ? 'Enter a latitude.' : undefined}
              >
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  className="ui-input"
                  placeholder="6.9344"
                  {...register('latitude', { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="Longitude"
                htmlFor="longitude"
                error={errors.longitude ? 'Enter a longitude.' : undefined}
              >
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  className="ui-input"
                  placeholder="79.8428"
                  {...register('longitude', { valueAsNumber: true })}
                />
              </Field>
            </div>

            {createLocation.isError ? (
              <ErrorAlert message={errorMessage(createLocation.error)} />
            ) : null}
            {savedName ? (
              <SuccessAlert message={`${savedName} is now available as a stop.`} />
            ) : null}

            <button
              type="submit"
              className="ui-btn-primary w-full"
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? (
                <Spinner />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {createLocation.isPending ? 'Saving…' : 'Add stop'}
            </button>
          </form>
        </SectionCard>
      </RequireRole>
    </div>
  );
}

function RoutesTab() {
  const queryClient = useQueryClient();
  const [savedName, setSavedName] = useState<string | null>(null);
  const locationsQuery = useLocations();

  const routesQuery = useQuery({
    queryKey: queryKeys.routes,
    queryFn: () => postJson<Route[]>('/api/routes/list', {}),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(CreateRouteRequestSchema),
  });

  const createRoute = useMutation({
    mutationFn: (values: RouteFormValues) =>
      postJson<Route>('/api/routes', values),
    onSuccess: async (route) => {
      setSavedName(route.name);
      reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.routes });
    },
  });

  const locations = locationsQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const locationName = (id: string) =>
    locations.find((location) => location.id === id)?.name ?? 'Unknown stop';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <SectionCard
        title="Routes"
        description={
          routes.length > 0
            ? `${routes.length} route${routes.length === 1 ? '' : 's'} ready for scheduling.`
            : 'Routes connect two stops and are what trips are scheduled against.'
        }
        icon={Waypoints}
      >
        {routesQuery.isPending ? (
          <LoadingBlock label="Loading routes…" />
        ) : routesQuery.isError ? (
          <ErrorAlert message={errorMessage(routesQuery.error)} />
        ) : routes.length === 0 ? (
          <EmptyState
            icon={Waypoints}
            title="No routes yet"
            description="Create a route between two stops, then schedule trips on it."
          />
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col">Distance</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="font-medium text-slate-900">{route.name}</td>
                    <td>{locationName(route.originLocationId)}</td>
                    <td>{locationName(route.destinationLocationId)}</td>
                    <td className="whitespace-nowrap">
                      {route.distanceKm != null ? `${route.distanceKm} km` : '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      {route.estimatedDurationMin != null
                        ? `${Math.floor(route.estimatedDurationMin / 60)}h ${
                            route.estimatedDurationMin % 60
                          }m`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <RequireRole
        allowed={[UserRole.ADMIN_STAFF]}
        fallback={
          <SectionCard title="Add a route" className="h-fit">
            <EmptyState
              icon={ShieldCheck}
              title="Admin staff only"
              description="You can browse routes here; creating them needs an admin account."
            />
          </SectionCard>
        }
      >
        <SectionCard
          title="Add a route"
          description="Admin staff only."
          icon={Plus}
          className="h-fit"
        >
          {locationsQuery.isPending ? (
            <LoadingBlock label="Loading stops…" />
          ) : locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Add stops first"
              description="A route needs an origin and a destination, so create at least two stops."
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => {
                setSavedName(null);
                createRoute.mutate(values);
              })}
            >
              <Field
                label="Route name"
                htmlFor="routeName"
                error={errors.name ? 'Give the route a name.' : undefined}
              >
                <input
                  id="routeName"
                  className="ui-input"
                  placeholder="Colombo → Kandy"
                  {...register('name')}
                />
              </Field>

              <Field
                label="From"
                htmlFor="originLocationId"
                error={errors.originLocationId ? 'Choose an origin stop.' : undefined}
              >
                <select
                  id="originLocationId"
                  className="ui-select"
                  defaultValue=""
                  {...register('originLocationId')}
                >
                  <option value="" disabled>
                    Select a stop…
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="To"
                htmlFor="destinationLocationId"
                error={
                  errors.destinationLocationId
                    ? 'Choose a destination stop.'
                    : undefined
                }
              >
                <select
                  id="destinationLocationId"
                  className="ui-select"
                  defaultValue=""
                  {...register('destinationLocationId')}
                >
                  <option value="" disabled>
                    Select a stop…
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Distance (km)"
                  htmlFor="distanceKm"
                  hint="Optional."
                  error={errors.distanceKm ? 'Use a positive number.' : undefined}
                >
                  <input
                    id="distanceKm"
                    type="number"
                    step="any"
                    min={0}
                    className="ui-input"
                    {...register('distanceKm', optionalNumber)}
                  />
                </Field>
                <Field
                  label="Duration (min)"
                  htmlFor="estimatedDurationMin"
                  hint="Optional."
                  error={
                    errors.estimatedDurationMin
                      ? 'Use whole minutes.'
                      : undefined
                  }
                >
                  <input
                    id="estimatedDurationMin"
                    type="number"
                    min={0}
                    className="ui-input"
                    {...register('estimatedDurationMin', optionalNumber)}
                  />
                </Field>
              </div>

              {createRoute.isError ? (
                <ErrorAlert message={errorMessage(createRoute.error)} />
              ) : null}
              {savedName ? (
                <SuccessAlert message={`Route “${savedName}” was created.`} />
              ) : null}

              <button
                type="submit"
                className="ui-btn-primary w-full"
                disabled={createRoute.isPending}
              >
                {createRoute.isPending ? (
                  <Spinner />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                {createRoute.isPending ? 'Saving…' : 'Add route'}
              </button>
            </form>
          )}
        </SectionCard>
      </RequireRole>
    </div>
  );
}

export function RouteManagementPage() {
  const [tab, setTab] = useState<Tab>('locations');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'locations', label: 'Locations' },
    { id: 'routes', label: 'Routes' },
  ];

  return (
    <>
      <PageHeader
        title="Routes"
        description="Stops come first, then the routes that connect them. Trips are scheduled against routes."
        icon={Waypoints}
      />

      <div
        role="tablist"
        aria-label="Route management sections"
        className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              tab === item.id
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'locations' ? <LocationsTab /> : <RoutesTab />}
    </>
  );
}
