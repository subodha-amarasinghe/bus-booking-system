'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { Bus as BusIcon, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  CreateBusRequestSchema,
  UserRole,
  type Bus,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { errorMessage, getJson, postJson, queryKeys } from '../../lib/client-api';
import { formatDate, shortId } from '../../lib/format';

/** Operator id is assigned server-side, so staff only fill the basics. */
const BusFormSchema = CreateBusRequestSchema.pick({
  plateNumber: true,
  name: true,
  capacity: true,
});
type BusFormValues = z.infer<typeof BusFormSchema>;

export function BusSetupPage() {
  const queryClient = useQueryClient();
  const [savedPlate, setSavedPlate] = useState<string | null>(null);

  const busesQuery = useQuery({
    queryKey: queryKeys.buses,
    queryFn: () => getJson<Bus[]>('/api/buses'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusFormValues>({
    resolver: zodResolver(BusFormSchema),
    defaultValues: { plateNumber: '', name: '', capacity: 40 },
  });

  const createBus = useMutation({
    mutationFn: (values: BusFormValues) =>
      postJson<Bus>('/api/buses', {
        ...values,
        name: values.name?.trim() ? values.name.trim() : undefined,
      }),
    onSuccess: async (bus) => {
      setSavedPlate(bus.plateNumber);
      reset({ plateNumber: '', name: '', capacity: 40 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.buses });
    },
  });

  const buses = busesQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Buses"
        description="Register the vehicles in your fleet. Every trip and seat map is attached to a bus."
        icon={BusIcon}
        actions={
          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() => busesQuery.refetch()}
            disabled={busesQuery.isFetching}
          >
            {busesQuery.isFetching ? (
              <Spinner />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SectionCard
          title="Fleet"
          description={
            buses.length > 0
              ? `${buses.length} bus${buses.length === 1 ? '' : 'es'} registered.`
              : 'Buses you register appear here.'
          }
        >
          {busesQuery.isPending ? (
            <LoadingBlock label="Loading the fleet…" />
          ) : busesQuery.isError ? (
            <ErrorAlert message={errorMessage(busesQuery.error)} />
          ) : buses.length === 0 ? (
            <EmptyState
              icon={BusIcon}
              title="No buses yet"
              description="Add your first bus using the form, then draw its seat layout under Seat Mapping."
            />
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th scope="col">Bus</th>
                    <th scope="col">Plate</th>
                    <th scope="col">Seats</th>
                    <th scope="col">Status</th>
                    <th scope="col">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buses.map((bus) => (
                    <tr key={bus.id}>
                      <td>
                        <span className="font-medium text-slate-900">
                          {bus.name ?? 'Unnamed bus'}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {shortId(bus.id)}
                        </span>
                      </td>
                      <td className="font-mono text-xs uppercase text-slate-600">
                        {bus.plateNumber}
                      </td>
                      <td>{bus.capacity}</td>
                      <td>
                        <StatusBadge
                          status={bus.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </td>
                      <td className="whitespace-nowrap text-slate-500">
                        {formatDate(bus.createdAt)}
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
            <SectionCard title="Add a bus" className="h-fit">
              <EmptyState
                icon={ShieldCheck}
                title="Admin staff only"
                description="You can review the fleet here, but registering a new bus needs an admin account."
              />
            </SectionCard>
          }
        >
          <SectionCard
            title="Add a bus"
            description="Admin staff only."
            icon={Plus}
            className="h-fit"
          >
            <form
              className="space-y-4"
              onSubmit={handleSubmit((values) => {
                setSavedPlate(null);
                createBus.mutate(values);
              })}
            >
              <Field
                label="Plate number"
                htmlFor="plateNumber"
                hint="For example NA-1234."
                error={
                  errors.plateNumber ? 'Enter the vehicle plate number.' : undefined
                }
              >
                <input
                  id="plateNumber"
                  className="ui-input uppercase"
                  autoComplete="off"
                  {...register('plateNumber')}
                />
              </Field>

              <Field
                label="Display name"
                htmlFor="name"
                hint="Optional — shown to staff, e.g. Express Liner 1."
              >
                <input id="name" className="ui-input" {...register('name')} />
              </Field>

              <Field
                label="Seat capacity"
                htmlFor="capacity"
                error={
                  errors.capacity ? 'Enter a seat count above zero.' : undefined
                }
              >
                <input
                  id="capacity"
                  type="number"
                  min={1}
                  className="ui-input"
                  {...register('capacity', { valueAsNumber: true })}
                />
              </Field>

              {createBus.isError ? (
                <ErrorAlert message={errorMessage(createBus.error)} />
              ) : null}
              {savedPlate ? (
                <SuccessAlert message={`Bus ${savedPlate} was added to the fleet.`} />
              ) : null}

              <button
                type="submit"
                className="ui-btn-primary w-full"
                disabled={createBus.isPending}
              >
                {createBus.isPending ? <Spinner /> : <Plus className="h-4 w-4" aria-hidden />}
                {createBus.isPending ? 'Saving…' : 'Add bus'}
              </button>
            </form>
          </SectionCard>
        </RequireRole>
      </div>
    </>
  );
}
