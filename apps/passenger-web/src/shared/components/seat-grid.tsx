import type { SeatMapSeat } from '@bus-booking/shared-types';

const SEAT_LABELS: Record<string, string> = {
  AVAILABLE: 'available',
  LOCKED: 'held by another passenger',
  BOOKED: 'already booked',
  UNAVAILABLE: 'unavailable',
};

function seatClassName(seat: SeatMapSeat, selected: boolean): string {
  if (selected) return 'seat-selected';
  switch (seat.status) {
    case 'AVAILABLE':
      return 'seat-available';
    case 'LOCKED':
      return 'seat-locked';
    case 'BOOKED':
      return 'seat-booked';
    default:
      return 'seat-unavailable';
  }
}

/**
 * Groups the flat list without discarding coordinates. Configured layouts skip
 * one column for the aisle on regular rows, while the rear bench fills it.
 */
function toRows(
  seats: SeatMapSeat[],
): Array<{ rowNumber: number; seats: SeatMapSeat[] }> {
  const rows = new Map<number, SeatMapSeat[]>();
  for (const seat of seats) {
    const row = rows.get(seat.row);
    if (row) row.push(seat);
    else rows.set(seat.row, [seat]);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rowNumber, row]) => ({
      rowNumber,
      seats: [...row].sort((a, b) => a.column - b.column),
    }));
}

export function SeatGrid({
  columns,
  seats,
  selectedSeats,
  locked,
  onToggle,
}: {
  columns: number;
  seats: SeatMapSeat[];
  selectedSeats: number[];
  locked: boolean;
  onToggle(seatNo: number): void;
}) {
  const rows = toRows(seats);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="mx-auto flex w-fit flex-col gap-2">
        {rows.map(({ rowNumber, seats: row }) => (
          <div className="flex items-center gap-2" key={rowNumber}>
            <span className="w-5 shrink-0 text-right text-xs font-medium text-slate-400 dark:text-slate-500">
              {rowNumber + 1}
            </span>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(3rem, 1fr))`,
              }}
            >
              {row.map((seat) => {
                const selected = selectedSeats.includes(seat.seatNo);
                const unavailable = seat.status !== 'AVAILABLE' && !selected;
                return (
                  <button
                    key={seat.seatNo}
                    aria-label={`Seat ${seat.seatNo}, ${
                      selected
                        ? 'selected'
                        : (SEAT_LABELS[seat.status] ?? 'unavailable')
                    }`}
                    aria-pressed={selected}
                    className={seatClassName(seat, selected)}
                    disabled={unavailable || locked}
                    onClick={() => onToggle(seat.seatNo)}
                    style={{ gridColumnStart: seat.column + 1 }}
                    type="button"
                  >
                    {seat.seatNo}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LEGEND: ReadonlyArray<{ label: string; className: string }> = [
  { label: 'Available', className: 'border-emerald-300 bg-emerald-50' },
  { label: 'Selected', className: 'border-brand-600 bg-brand-600' },
  { label: 'Locked', className: 'border-amber-300 bg-amber-50 dark:bg-amber-950/70' },
  { label: 'Booked', className: 'border-slate-200 dark:border-slate-700 bg-slate-100' },
];

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {LEGEND.map((item) => (
        <li
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
          key={item.label}
        >
          <span
            aria-hidden="true"
            className={`h-4 w-4 rounded-md border-2 ${item.className}`}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function SeatGridSkeleton({
  rows = 8,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div aria-busy="true" className="mx-auto w-fit space-y-2" role="status">
      <span className="sr-only">Loading the live seat map…</span>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="flex gap-2" key={rowIndex}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span
              className="h-12 w-12 animate-pulse rounded-xl bg-slate-200"
              key={columnIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
