'use client';

import {
  SaveSeatLayoutRequestSchema,
  UserRole,
  type Bus,
  type SaveSeatLayoutRequest,
  type SeatLayout,
} from '@bus-booking/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Armchair,
  BusFront,
  LayoutGrid,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import {
  errorMessage,
  getJson,
  postJson,
  queryKeys,
} from '../../lib/client-api';
import {
  DEFAULT_LAYOUT_CONFIGURATION,
  LAYOUT_PRESETS,
  buildConfiguredSeats,
  configurationFromPreset,
  inferLayoutConfiguration,
  layoutCapacity,
  layoutColumns,
  layoutRows,
  type LayoutConfiguration,
  type LayoutPresetId,
  type SeatDraft,
} from './layout-presets';

type SeatType = SeatDraft['type'];

const SEAT_CYCLE: SeatType[] = ['STANDARD', 'WINDOW', 'AISLE', 'DISABLED'];

const SEAT_STYLES: Record<SeatType, string> = {
  STANDARD: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
  WINDOW: 'border-brand-300 bg-brand-50 text-brand-700 hover:border-brand-400',
  AISLE: 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400',
  DISABLED:
    'border-slate-200 bg-slate-100 text-slate-400 line-through hover:border-slate-300',
};

const SEAT_LABELS: Record<SeatType, string> = {
  STANDARD: 'Standard',
  WINDOW: 'Window',
  AISLE: 'Aisle seat',
  DISABLED: 'Blocked',
};

function nextType(type: SeatType): SeatType {
  return SEAT_CYCLE[(SEAT_CYCLE.indexOf(type) + 1) % SEAT_CYCLE.length];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value || minimum));
}

function SeatMappingEditor() {
  const queryClient = useQueryClient();
  const [busId, setBusId] = useState('');
  const [configuration, setConfiguration] = useState<LayoutConfiguration>({
    ...DEFAULT_LAYOUT_CONFIGURATION,
  });
  const [rows, setRows] = useState(layoutRows(DEFAULT_LAYOUT_CONFIGURATION));
  const [columns, setColumns] = useState(
    layoutColumns(DEFAULT_LAYOUT_CONFIGURATION),
  );
  const [seats, setSeats] = useState<SeatDraft[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const busesQuery = useQuery({
    queryKey: queryKeys.buses,
    queryFn: () => getJson<Bus[]>('/api/buses'),
  });
  const layoutQuery = useQuery({
    queryKey: ['seat-layout', busId],
    queryFn: () =>
      getJson<SeatLayout | null>(
        `/api/seats/layout?busId=${encodeURIComponent(busId)}`,
      ),
    enabled: Boolean(busId),
    retry: false,
  });

  const buses = useMemo(() => busesQuery.data ?? [], [busesQuery.data]);
  const selectedBus = buses.find((bus) => bus.id === busId);

  useEffect(() => {
    const layout = layoutQuery.data;
    if (!layout) return;
    setRows(layout.rows);
    setColumns(layout.columns);
    setSeats(layout.seats);
    setConfiguration(inferLayoutConfiguration(layout));
    setFormError(null);
  }, [layoutQuery.data]);

  const saveLayout = useMutation({
    mutationFn: (payload: SaveSeatLayoutRequest) =>
      postJson<SeatLayout>('/api/seats/layout', payload),
    onSuccess: (layout) => {
      setSavedAt(new Date().toLocaleTimeString());
      queryClient.setQueryData(['seat-layout', layout.busId], layout);
    },
  });

  const bookableSeats = seats.filter(
    (seat) => seat.type !== 'DISABLED' && seat.isAvailable,
  ).length;
  const configuredCapacity = layoutCapacity(configuration);

  function generate(nextConfiguration = configuration) {
    setSavedAt(null);
    setFormError(null);
    setConfiguration(nextConfiguration);
    setRows(layoutRows(nextConfiguration));
    setColumns(layoutColumns(nextConfiguration));
    setSeats(buildConfiguredSeats(nextConfiguration));
  }

  function applyPreset(preset: Exclude<LayoutPresetId, 'CUSTOM'>) {
    const next = configurationFromPreset(preset);
    if (busId) {
      generate(next);
      return;
    }
    setConfiguration(next);
    setRows(layoutRows(next));
    setColumns(layoutColumns(next));
  }

  function updateConfiguration(
    patch: Partial<Omit<LayoutConfiguration, 'preset'>>,
  ) {
    setConfiguration((current) => ({
      ...current,
      ...patch,
      preset: 'CUSTOM',
    }));
    setSavedAt(null);
  }

  function cycleSeat(seatNo: number) {
    setSavedAt(null);
    setSeats((current) =>
      current.map((seat) => {
        if (seat.seatNo !== seatNo) return seat;
        const type = nextType(seat.type);
        return { ...seat, type, isAvailable: type !== 'DISABLED' };
      }),
    );
  }

  function save() {
    setSavedAt(null);
    const parsed = SaveSeatLayoutRequestSchema.safeParse({
      busId,
      rows,
      columns,
      seats,
    });
    if (!parsed.success) {
      setFormError('Pick a bus and generate a valid layout before saving.');
      return;
    }
    setFormError(null);
    saveLayout.mutate(parsed.data);
  }

  function selectBus(nextBusId: string) {
    setBusId(nextBusId);
    setRows(layoutRows(configuration));
    setColumns(layoutColumns(configuration));
    setSeats(nextBusId ? buildConfiguredSeats(configuration) : []);
    setSavedAt(null);
    setFormError(null);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Choose a layout"
        description="Start with a Sri Lankan intercity coach pattern, then adjust it for the vehicle."
        icon={Sparkles}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {LAYOUT_PRESETS.map((preset) => {
            const selected = configuration.preset === preset.id;
            const capacity = layoutCapacity(preset.configuration);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => applyPreset(preset.id)}
                className={clsx(
                  'rounded-2xl border p-4 text-left transition',
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {preset.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {preset.description}
                    </p>
                  </div>
                  <span className="ui-badge shrink-0 bg-brand-100 text-brand-700">
                    {preset.shortName}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Default map</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {capacity} seats
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">uide</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">
                      {preset.capacityGuide}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-400">{preset.usage}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <SectionCard
          title="Layout configuration"
          description="Set the row pattern and rear bench before generating."
          icon={LayoutGrid}
          className="h-fit"
        >
          <div className="space-y-4">
            <Field
              label="Bus"
              htmlFor="busId"
              hint={
                selectedBus
                  ? `Registered capacity: ${selectedBus.capacity} seats.`
                  : 'Seat maps are saved per bus.'
              }
            >
              {busesQuery.isPending ? (
                <LoadingBlock label="Loading buses…" className="py-6" />
              ) : busesQuery.isError ? (
                <ErrorAlert message={errorMessage(busesQuery.error)} />
              ) : (
                <select
                  id="busId"
                  className="ui-select"
                  value={busId}
                  onChange={(event) => selectBus(event.target.value)}
                >
                  <option value="">Select a bus…</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.plateNumber} — {bus.name ?? 'Unnamed bus'}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {layoutQuery.isFetching ? (
              <LoadingBlock label="Loading saved map…" className="py-4" />
            ) : null}
            {layoutQuery.isError ? (
              <p className="text-xs text-amber-600">
                The saved map could not be loaded. You can still generate a new
                one.
              </p>
            ) : null}

            <Field
              label="Regular rows"
              htmlFor="regularRows"
              hint="The rear bench is added as one extra row."
            >
              <input
                id="regularRows"
                type="number"
                min={1}
                max={20}
                className="ui-input"
                value={configuration.regularRows}
                onChange={(event) =>
                  updateConfiguration({
                    regularRows: clamp(Number(event.target.value), 1, 20),
                  })
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Driver side" htmlFor="leftSeats" hint="Seats / row">
                <input
                  id="leftSeats"
                  type="number"
                  min={1}
                  max={3}
                  className="ui-input"
                  value={configuration.leftSeats}
                  onChange={(event) =>
                    updateConfiguration({
                      leftSeats: clamp(Number(event.target.value), 1, 3),
                    })
                  }
                />
              </Field>
              <Field label="Door side" htmlFor="rightSeats" hint="Seats / row">
                <input
                  id="rightSeats"
                  type="number"
                  min={1}
                  max={3}
                  className="ui-input"
                  value={configuration.rightSeats}
                  onChange={(event) =>
                    updateConfiguration({
                      rightSeats: clamp(Number(event.target.value), 1, 3),
                    })
                  }
                />
              </Field>
            </div>

            <Field
              label="Rear bench"
              htmlFor="rearSeats"
              hint="A solid final row without a centre aisle."
            >
              <input
                id="rearSeats"
                type="number"
                min={1}
                max={8}
                className="ui-input"
                value={configuration.rearSeats}
                onChange={(event) =>
                  updateConfiguration({
                    rearSeats: clamp(Number(event.target.value), 1, 8),
                  })
                }
              />
            </Field>

            <dl className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Pattern</dt>
                <dd className="font-medium text-slate-900">
                  {configuration.leftSeats} × {configuration.rightSeats}
                </dd>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <dt className="text-slate-500">Generated capacity</dt>
                <dd className="font-medium text-slate-900">
                  {configuredCapacity}
                </dd>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <dt className="text-slate-500">Bookable in preview</dt>
                <dd className="font-medium text-slate-900">{bookableSeats}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="ui-btn-secondary w-full"
              onClick={() => generate()}
              disabled={!busId}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              {seats.length > 0 ? 'Regenerate layout' : 'Generate layout'}
            </button>
            {seats.length > 0 ? (
              <p className="text-xs text-slate-400">
                Regenerating applies these settings and resets individual seat
                changes.
              </p>
            ) : null}

            {selectedBus &&
            seats.length > 0 &&
            bookableSeats !== selectedBus.capacity ? (
              <p className="text-xs text-amber-600">
                This bus is registered with {selectedBus.capacity} seats, but
                the map has {bookableSeats} bookable. Block seats or adjust the
                rows until they match.
              </p>
            ) : null}

            {formError ? <ErrorAlert message={formError} /> : null}
            {saveLayout.isError ? (
              <ErrorAlert message={errorMessage(saveLayout.error)} />
            ) : null}
            {savedAt ? (
              <SuccessAlert message={`Seat map saved at ${savedAt}.`} />
            ) : null}

            <button
              type="button"
              className="ui-btn-primary w-full"
              onClick={save}
              disabled={saveLayout.isPending || seats.length === 0 || !busId}
            >
              {saveLayout.isPending ? (
                <Spinner />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {saveLayout.isPending ? 'Saving…' : 'Save seat map'}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Passenger preview"
          description="The blank column is the centre aisle. The rear bench spans it."
          icon={Armchair}
        >
          {seats.length === 0 ? (
            <EmptyState
              icon={Armchair}
              title={busId ? 'No layout generated' : 'Choose a bus to begin'}
              description={
                busId
                  ? 'Choose a preset or adjust the configuration, then generate the passenger seat map.'
                  : 'Seat maps belong to a bus — pick one in the configuration panel first.'
              }
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {SEAT_CYCLE.map((type) => (
                  <span
                    key={type}
                    className={clsx(
                      'ui-badge pointer-events-none border',
                      SEAT_STYLES[type],
                    )}
                  >
                    {SEAT_LABELS[type]}
                  </span>
                ))}
              </div>

              <div className="overflow-x-auto rounded-2xl bg-slate-50 p-4 sm:p-6">
                <div className="mx-auto min-w-fit">
                  <div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <BusFront className="h-4 w-4" aria-hidden />
                    Front of bus
                  </div>
                  <div
                    className="grid min-w-fit gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, minmax(3rem, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, auto)`,
                    }}
                  >
                    {seats.map((seat) => (
                      <button
                        key={seat.seatNo}
                        type="button"
                        onClick={() => cycleSeat(seat.seatNo)}
                        aria-label={`Seat ${seat.seatNo}: ${SEAT_LABELS[seat.type]}`}
                        className={clsx(
                          'rounded-lg border px-2 py-3 text-xs font-semibold transition',
                          SEAT_STYLES[seat.type],
                        )}
                        style={{
                          gridColumnStart: seat.column + 1,
                          gridRowStart: seat.row + 1,
                        }}
                      >
                        {seat.seatNo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Click any seat to cycle through standard, window, aisle-side and
                blocked. Blocked seats are unavailable to passengers.
              </p>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function SeatMappingPage() {
  return (
    <>
      <PageHeader
        title="Seat layout configuration"
        description="Configure standard 2×3 and luxury 2×2 coaches, including the solid rear bench passengers see when booking."
        icon={Armchair}
      />
      <RequireRole
        allowed={[UserRole.ADMIN_STAFF]}
        fallback={
          <EmptyState
            icon={ShieldCheck}
            title="Admin staff only"
            description="Seat maps change what passengers can book, so only admin staff can edit them."
          />
        }
      >
        <SeatMappingEditor />
      </RequireRole>
    </>
  );
}
