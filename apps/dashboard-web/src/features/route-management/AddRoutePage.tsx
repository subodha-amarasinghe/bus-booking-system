'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CreateRouteRequestSchema,
  UserRole,
  type Location,
  type OsmPathResponse,
  type Route,
} from '@bus-booking/shared-types';
import { ArrowLeft, MapPinned, Plus, Route as RouteIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ErrorAlert } from '../../components/Alerts';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { errorMessage, postJson, queryKeys } from '../../lib/client-api';
import { RouteMap } from './RouteMap';

type FormValues = z.infer<typeof CreateRouteRequestSchema>;

export function AddRoutePage() {
  const router = useRouter();
  const locationsQuery = useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => postJson<Location[]>('/api/routes/locations/list', {}),
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateRouteRequestSchema),
    defaultValues: {
      routeNumber: '',
      originLocationId: '',
      destinationLocationId: '',
    },
  });

  const locations = locationsQuery.data ?? [];
  const routeNumber = watch('routeNumber');
  const originId = watch('originLocationId');
  const destinationId = watch('destinationLocationId');
  const origin = useMemo(
    () => locations.find((location) => location.id === originId),
    [locations, originId],
  );
  const destination = useMemo(
    () => locations.find((location) => location.id === destinationId),
    [destinationId, locations],
  );

  const preview = useMutation({
    mutationFn: () => {
      if (!origin || !destination) {
        throw new Error('Choose both locations before previewing the route.');
      }
      return postJson<OsmPathResponse>('/api/routes/osm-path', {
        routeNumber,
        originLat: origin.latitude,
        originLng: origin.longitude,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
      });
    },
  });
  const resetPreview = preview.reset;
  useEffect(() => {
    resetPreview();
  }, [destinationId, originId, resetPreview, routeNumber]);

  const createRoute = useMutation({
    mutationFn: (values: FormValues) => postJson<Route>('/api/routes', values),
    onSuccess: () => router.push('/dashboard/routes'),
  });

  return (
    <RequireRole allowed={[UserRole.ADMIN_STAFF]}>
      <div className="space-y-6">
        <PageHeader
          title="Add bus route"
          description="Choose the official Sri Lankan route number and endpoints, then confirm the road path on the map."
          icon={RouteIcon}
        />
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
          href="/dashboard/routes"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to routes
        </Link>

        <div className="grid gap-6 xl:grid-cols-[23rem_minmax(0,1fr)]">
          <SectionCard
            className="h-fit"
            title="Route details"
            description="The name, distance and duration are calculated automatically."
            icon={Plus}
          >
            {locationsQuery.isPending ? (
              <LoadingBlock label="Loading locations…" />
            ) : locationsQuery.isError ? (
              <ErrorAlert message={errorMessage(locationsQuery.error)} />
            ) : (
              <form
                className="space-y-4"
                onSubmit={handleSubmit((values) => createRoute.mutate(values))}
              >
                <Field
                  label="Sri Lankan bus route number"
                  htmlFor="routeNumber"
                  hint="Examples: 1, 138, 138/1"
                  error={
                    errors.routeNumber
                      ? 'Enter a valid route number, such as 138 or 138/1.'
                      : undefined
                  }
                >
                  <input
                    className="ui-input"
                    id="routeNumber"
                    placeholder="138"
                    {...register('routeNumber')}
                  />
                </Field>
                <Field
                  label="From location"
                  htmlFor="originLocationId"
                  error={
                    errors.originLocationId
                      ? 'Choose the route origin.'
                      : undefined
                  }
                >
                  <select
                    className="ui-select"
                    id="originLocationId"
                    {...register('originLocationId')}
                  >
                    <option value="">Select origin…</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="To location"
                  htmlFor="destinationLocationId"
                  error={
                    errors.destinationLocationId
                      ? 'Choose a different destination.'
                      : undefined
                  }
                >
                  <select
                    className="ui-select"
                    id="destinationLocationId"
                    {...register('destinationLocationId')}
                  >
                    <option value="">Select destination…</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  className="ui-btn-secondary w-full"
                  disabled={
                    !routeNumber ||
                    !origin ||
                    !destination ||
                    origin.id === destination.id ||
                    preview.isPending
                  }
                  onClick={() => preview.mutate()}
                  type="button"
                >
                  {preview.isPending ? (
                    <Spinner />
                  ) : (
                    <MapPinned className="h-4 w-4" />
                  )}
                  {preview.isPending ? 'Calculating…' : 'Preview road route'}
                </button>
                {preview.isError ? (
                  <ErrorAlert message={errorMessage(preview.error)} />
                ) : null}
                {createRoute.isError ? (
                  <ErrorAlert message={errorMessage(createRoute.error)} />
                ) : null}
                <button
                  className="ui-btn-primary w-full"
                  disabled={!preview.data || createRoute.isPending}
                  type="submit"
                >
                  {createRoute.isPending ? (
                    <Spinner />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {createRoute.isPending ? 'Saving…' : 'Save route'}
                </button>
              </form>
            )}
          </SectionCard>

          <SectionCard
            title="Street map preview"
            description={
              preview.data
                ? `${preview.data.distanceKm} km · about ${preview.data.durationMin} minutes`
                : 'Select both locations and preview the route.'
            }
            icon={MapPinned}
          >
            <RouteMap coordinates={preview.data?.coordinates ?? []} />
            <div className="mt-3 flex items-center gap-5 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                Origin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                Destination
              </span>
            </div>
          </SectionCard>
        </div>
      </div>
    </RequireRole>
  );
}
