import type { SeatMapSeat } from '@bus-booking/shared-types';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

type SeatVisual = 'available' | 'selected' | 'locked' | 'booked' | 'unavailable';

const SEAT_STYLE: Record<SeatVisual, { bg: string; border: string; fg: string }> =
  {
    available: {
      bg: colors.emerald50,
      border: colors.emerald300,
      fg: colors.emerald800,
    },
    selected: { bg: colors.brand600, border: colors.brand600, fg: colors.white },
    locked: { bg: colors.amber50, border: colors.amber300, fg: colors.amber700 },
    booked: { bg: colors.slate100, border: colors.slate200, fg: colors.slate400 },
    unavailable: {
      bg: colors.slate100,
      border: colors.slate200,
      fg: colors.slate400,
    },
  };

function visualFor(seat: SeatMapSeat, selected: boolean): SeatVisual {
  if (selected) return 'selected';
  if (seat.status === 'AVAILABLE') return 'available';
  if (seat.status === 'LOCKED') return 'locked';
  if (seat.status === 'BOOKED') return 'booked';
  return 'unavailable';
}

export function SeatGrid({
  seats,
  columns,
  selectedSeats,
  onToggle,
  frozen = false,
}: {
  seats: SeatMapSeat[];
  columns: number;
  selectedSeats: string[];
  onToggle: (seatNo: string) => void;
  /** Once seats are held, the selection is fixed until release or expiry. */
  frozen?: boolean;
}) {
  const rows = useMemo(() => {
    const byRow = new Map<number, SeatMapSeat[]>();
    for (const seat of seats) {
      const row = byRow.get(seat.row) ?? [];
      row.push(seat);
      byRow.set(seat.row, row);
    }
    return [...byRow.entries()]
      .sort(([a], [b]) => a - b)
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((a, b) => a.column - b.column),
      }));
  }, [seats]);

  // Aisle down the middle, the way coach seating actually reads.
  const aisleAfter = Math.floor(columns / 2) - 1;

  return (
    <View style={styles.grid}>
      {rows.map(({ row, seats: rowSeats }) => (
        <View key={row} style={styles.row}>
          {rowSeats.map((seat) => {
            const selected = selectedSeats.includes(seat.seatNo);
            const visual = visualFor(seat, selected);
            const tone = SEAT_STYLE[visual];
            const selectable =
              seat.status === 'AVAILABLE' && (!frozen || selected);

            return (
              <View key={seat.seatNo} style={styles.seatSlot}>
                <Pressable
                  accessibilityLabel={`Seat ${seat.seatNo}, ${visual}`}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                    disabled: !selectable,
                  }}
                  disabled={!selectable}
                  onPress={() => onToggle(seat.seatNo)}
                  style={[
                    styles.seat,
                    { backgroundColor: tone.bg, borderColor: tone.border },
                  ]}
                >
                  <Text style={[styles.seatLabel, { color: tone.fg }]}>
                    {seat.seatNo}
                  </Text>
                </Pressable>
                {seat.column === aisleAfter ? (
                  <View style={styles.aisle} />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function SeatLegend() {
  const items: { visual: SeatVisual; label: string }[] = [
    { visual: 'available', label: 'Available' },
    { visual: 'selected', label: 'Selected' },
    { visual: 'locked', label: 'Held' },
    { visual: 'booked', label: 'Booked' },
  ];

  return (
    <View style={styles.legend}>
      {items.map((item) => {
        const tone = SEAT_STYLE[item.visual];
        return (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: tone.bg, borderColor: tone.border },
              ]}
            />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SeatGridSkeleton({ rows = 8, columns = 4 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: columns }, (_, column) => (
            <View key={column} style={styles.seatSlot}>
              <View style={[styles.seat, styles.seatSkeleton]} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm, alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  seatSlot: { flexDirection: 'row', alignItems: 'center' },
  seat: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: radius.md,
  },
  seatSkeleton: {
    backgroundColor: colors.slate100,
    borderColor: colors.slate200,
  },
  seatLabel: { fontSize: fontSize.sm, fontWeight: '700' },
  aisle: { width: spacing.xl },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSwatch: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 4,
  },
  legendLabel: { fontSize: fontSize.xs, color: colors.slate500 },
});
