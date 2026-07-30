'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Armchair, LayoutGrid, Save, ShieldCheck } from 'lucide-react';
import {
  SaveSeatLayoutRequestSchema,
  UserRole,
  type Bus,
  type SaveSeatLayoutRequest,
  type SeatLayout,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { errorMessage, getJson, postJson, queryKeys } from '../../lib/client-api';

type SeatDraft = SaveSeatLayoutRequest['seats'][number];
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
  AISLE: 'Aisle',
  DISABLED: 'Blocked',
};

/** Mirrors the seeded coaches: outer columns are windows, inner ones aisles. */
function buildSeats(rows: number, columns: number): SeatDraft[] {
  const seats: SeatDraft[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const isWindow = column === 0 || column === columns - 1;
      seats.push({
        seatNo: `${row + 1}${String.fromCharCode(65 + column)}`,
        row,
        column,
        type: isWindow ? 'WINDOW' : 'AISLE',
        isAvailable: true,
      });
    }
  }
  return seats;
}

function nextType(type: SeatType): SeatType {
  return SEAT_CYCLE[(SEAT_CYCLE.indexOf(type) + 1) % SEAT_CYCLE.length];
}

function SeatMappingEditor() {
  const [busId, setBusId] = useState('');
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(4);
  const [seats, setSeats] = useState<SeatDraft[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const busesQuery = useQuery({
    queryKey: queryKeys.buses,
    queryFn: () => getJson<Bus[]>('/api/buses'),
  });

  const buses = useMemo(() => busesQuery.data ?? [], [busesQuery.data]);
  const selectedBus = buses.find((bus) => bus.id === busId);

  const saveLayout = useMutation({
    mutationFn: (payload: SaveSeatLayoutRequest) =>
      postJson<SeatLayout>('/api/seats/layout', payload),
    onSuccess: () => setSavedAt(new Date().toLocaleTimeString()),
  });

  const bookableSeats = seats.filter((seat) => seat.type !== 'DISABLED').length;

  function regenerate() {
    setSavedAt(null);
    setFormError(null);
    setSeats(buildSeats(rows, columns));
  }

  function cycleSeat(seatNo: string) {
    setSavedAt(null);
    setSeats((current) =>
      current.map((seat) =>
        seat.seatNo === seatNo
          ? {
              ...seat,
              type: nextType(seat.type),
              isAvailable: nextType(seat.type) !== 'DISABLED',
            }
          : seat,
      ),
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
      setFormError('Pick a bus and generate the grid before saving.');
      return;
    }
    setFormError(null);
    saveLayout.mutate(parsed.data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <SectionCard
        title="Layout settings"
        description="Pick a bus, size the grid, then fine-tune each seat."
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
                onChange={(event) => {
                  setBusId(event.target.value);
                  setSeats([]);
                  setSavedAt(null);
                }}
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rows" htmlFor="rows">
              <input
                id="rows"
                type="number"
                min={1}
                max={30}
                className="ui-input"
                value={rows}
                onChange={(event) =>
                  setRows(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </Field>
            <Field label="Columns" htmlFor="columns">
              <input
                id="columns"
                type="number"
                min={1}
                max={8}
                className="ui-input"
                value={columns}
                onChange={(event) =>
                  setColumns(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </Field>
          </div>

          <button
            type="button"
            className="ui-btn-secondary w-full"
            onClick={regenerate}
            disabled={!busId}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            {seats.length > 0 ? 'Regenerate grid' : 'Generate grid'}
          </button>
          {seats.length > 0 ? (
            <p className="text-xs text-slate-400">
              Regenerating resets every seat back to the default 2+2 pattern.
            </p>
          ) : null}

          <dl className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Seats drawn</dt>
              <dd className="font-medium text-slate-900">{seats.length}</dd>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <dt className="text-slate-500">Bookable</dt>
              <dd className="font-medium text-slate-900">{bookableSeats}</dd>
            </div>
          </dl>

          {selectedBus && seats.length > 0 && bookableSeats !== selectedBus.capacity ? (
            <p className="text-xs text-amber-600">
              Heads up: this bus is registered with {selectedBus.capacity} seats
              but the map has {bookableSeats} bookable.
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
        title="Seat grid"
        description="Click a seat to cycle through standard, window, aisle and blocked."
        icon={Armchair}
      >
        {seats.length === 0 ? (
          <EmptyState
            icon={Armchair}
            title={busId ? 'No grid yet' : 'Choose a bus to begin'}
            description={
              busId
                ? 'Set the rows and columns, then generate the grid to start editing.'
                : 'Seat maps belong to a bus — pick one on the left and generate its grid.'
            }
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {SEAT_CYCLE.map((type) => (
                <span
                  key={type}
                  className={clsx(
                    'ui-badge border',
                    SEAT_STYLES[type],
                    'pointer-events-none',
                  )}
                >
                  {SEAT_LABELS[type]}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div
                className="grid min-w-fit gap-2"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(3rem, 1fr))`,
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
                  >
                    {seat.seatNo}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Front of the bus is the top row. Blocked seats are saved as
              unavailable and cannot be booked.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
}

export function SeatMappingPage() {
  return (
    <>
      <PageHeader
        title="Seat mapping"
        description="Draw the seat layout passengers see when they book. Saving replaces the current map for that bus."
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
