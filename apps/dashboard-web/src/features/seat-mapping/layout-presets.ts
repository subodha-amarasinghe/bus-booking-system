import type { SaveSeatLayoutRequest } from '@bus-booking/shared-types';

export type SeatDraft = SaveSeatLayoutRequest['seats'][number];
export type LayoutPresetId = 'STANDARD_2_X_3' | 'LUXURY_2_X_2' | 'CUSTOM';

export interface LayoutConfiguration {
  preset: LayoutPresetId;
  regularRows: number;
  leftSeats: number;
  rightSeats: number;
  rearSeats: number;
}

export interface LayoutPreset {
  id: Exclude<LayoutPresetId, 'CUSTOM'>;
  name: string;
  shortName: string;
  description: string;
  usage: string;
  capacityGuide: string;
  configuration: LayoutConfiguration;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'STANDARD_2_X_3',
    name: 'Layout A — Standard intercity',
    shortName: '2 × 3',
    description: 'Two seats on the driver side and three on the door side.',
    usage: 'Standard, non-AC and semi-luxury intercity buses',
    capacityGuide: 'Typically 54–59 seats',
    configuration: {
      preset: 'STANDARD_2_X_3',
      regularRows: 10,
      leftSeats: 2,
      rightSeats: 3,
      rearSeats: 6,
    },
  },
  {
    id: 'LUXURY_2_X_2',
    name: 'Layout B — Luxury coach',
    shortName: '2 × 2',
    description: 'Two seats on each side with a wider centre aisle.',
    usage: 'Luxury, super-luxury, highway and overnight coaches',
    capacityGuide: 'Typically 41–53 seats',
    configuration: {
      preset: 'LUXURY_2_X_2',
      regularRows: 11,
      leftSeats: 2,
      rightSeats: 2,
      rearSeats: 5,
    },
  },
];

export const DEFAULT_LAYOUT_CONFIGURATION = LAYOUT_PRESETS[1].configuration;

export function layoutCapacity(configuration: LayoutConfiguration): number {
  return (
    configuration.regularRows *
      (configuration.leftSeats + configuration.rightSeats) +
    configuration.rearSeats
  );
}

export function layoutRows(configuration: LayoutConfiguration): number {
  return configuration.regularRows + 1;
}

/**
 * `columns` counts physical slots, including the aisle. Seat coordinates skip
 * that slot on regular rows; the rear bench deliberately fills it.
 */
export function layoutColumns(configuration: LayoutConfiguration): number {
  return Math.max(
    configuration.leftSeats + 1 + configuration.rightSeats,
    configuration.rearSeats,
  );
}

function seatType(
  ordinal: number,
  seatsInRow: number,
  isRearBench: boolean,
  leftSeats: number,
): SeatDraft['type'] {
  if (ordinal === 0 || ordinal === seatsInRow - 1) return 'WINDOW';
  if (!isRearBench && (ordinal === leftSeats - 1 || ordinal === leftSeats)) {
    return 'AISLE';
  }
  return 'STANDARD';
}

export function buildConfiguredSeats(
  configuration: LayoutConfiguration,
): SeatDraft[] {
  const capacity = layoutCapacity(configuration);
  if (capacity > 59) {
    throw new Error('A seat map cannot have more than 59 seats.');
  }

  const seats: SeatDraft[] = [];
  const regularSeatCount = configuration.leftSeats + configuration.rightSeats;
  let seatNo = 1;

  for (let row = 0; row < configuration.regularRows; row += 1) {
    for (let ordinal = 0; ordinal < regularSeatCount; ordinal += 1) {
      const onRight = ordinal >= configuration.leftSeats;
      const column = onRight ? ordinal + 1 : ordinal;
      seats.push({
        seatNo,
        row,
        column,
        type: seatType(
          ordinal,
          regularSeatCount,
          false,
          configuration.leftSeats,
        ),
        isAvailable: true,
      });
      seatNo += 1;
    }
  }

  const rearRow = configuration.regularRows;
  const rearOffset = Math.floor(
    (layoutColumns(configuration) - configuration.rearSeats) / 2,
  );
  for (let ordinal = 0; ordinal < configuration.rearSeats; ordinal += 1) {
    seats.push({
      seatNo,
      row: rearRow,
      column: rearOffset + ordinal,
      type: seatType(ordinal, configuration.rearSeats, true, 0),
      isAvailable: true,
    });
    seatNo += 1;
  }

  return seats;
}

export function configurationFromPreset(
  preset: Exclude<LayoutPresetId, 'CUSTOM'>,
): LayoutConfiguration {
  const found = LAYOUT_PRESETS.find((candidate) => candidate.id === preset);
  return { ...(found ?? LAYOUT_PRESETS[1]).configuration };
}

/** Best-effort inference lets saved maps reopen in the configurator. */
export function inferLayoutConfiguration(
  layout: Pick<SaveSeatLayoutRequest, 'rows' | 'columns' | 'seats'>,
): LayoutConfiguration {
  const regularRow = layout.seats
    .filter((seat) => seat.row === 0)
    .sort((a, b) => a.column - b.column);
  const rearSeats = layout.seats.filter(
    (seat) => seat.row === layout.rows - 1,
  ).length;
  const gapAt = regularRow.findIndex(
    (seat, index) =>
      index > 0 && seat.column - regularRow[index - 1].column > 1,
  );
  const leftSeats =
    gapAt > 0 ? gapAt : Math.max(1, Math.floor(regularRow.length / 2));
  const rightSeats = Math.max(1, regularRow.length - leftSeats);
  const preset =
    leftSeats === 2 && rightSeats === 3
      ? 'STANDARD_2_X_3'
      : leftSeats === 2 && rightSeats === 2
        ? 'LUXURY_2_X_2'
        : 'CUSTOM';

  return {
    preset,
    regularRows: Math.max(1, layout.rows - 1),
    leftSeats,
    rightSeats,
    rearSeats: Math.max(1, rearSeats),
  };
}
