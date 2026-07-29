import type { SeatMapSeat } from '@bus-booking/shared-types';

export function SeatGrid({
  columns,
  seats,
  selectedSeats,
  locked,
  onToggle,
}: {
  columns: number;
  seats: SeatMapSeat[];
  selectedSeats: string[];
  locked: boolean;
  onToggle(seatNo: string): void;
}) {
  return (
    <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(52px, 1fr))` }}>
      {seats.map((seat) => {
        const selected = selectedSeats.includes(seat.seatNo);
        const unavailable = seat.status !== 'AVAILABLE' && !selected;
        return (
          <button
            className={`seat${selected ? ' selected' : ''}${unavailable ? ' unavailable' : ''}`}
            disabled={unavailable || locked}
            key={seat.seatNo}
            onClick={() => onToggle(seat.seatNo)}
            type="button"
          >
            {seat.seatNo}
          </button>
        );
      })}
    </div>
  );
}
