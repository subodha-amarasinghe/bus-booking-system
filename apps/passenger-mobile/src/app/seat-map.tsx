import { useCallback, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { io } from 'socket.io-client';
import {
  useBookingDraftStore,
  useRemainingSeconds,
  useSeatMapSocket,
  type SeatSocketFactory,
} from '@bus-booking/passenger-core';

const FALLBACK_TRIP_ID = '00000000-0000-4000-8000-000000000001';
const BOOKING_WS_URL = `${
  process.env.EXPO_PUBLIC_BOOKING_WS_URL ?? 'http://localhost:3020'
}`.replace(/\/+$/, '') + '/seats';

const createSeatSocket: SeatSocketFactory = (url, options) =>
  io(url, {
    ...options,
    transports: [...options.transports] as ('websocket' | 'polling')[],
  });

const SEATS = Array.from({ length: 16 }, (_, index) => ({
  seatNo: `${Math.floor(index / 4) + 1}${String.fromCharCode(65 + (index % 4))}`,
  row: Math.floor(index / 4),
  column: index % 4,
}));

export default function SeatMapScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === 'string' ? params.tripId : FALLBACK_TRIP_ID;
  const [liveStatuses, setLiveStatuses] = useState<
    Record<string, 'LOCKED' | 'BOOKED'>
  >({});
  const selectedSeats = useBookingDraftStore((state) => state.selectedSeats);
  const expiresAt = useBookingDraftStore((state) => state.expiresAt);
  const startTrip = useBookingDraftStore((state) => state.startTrip);
  const toggleSeat = useBookingDraftStore((state) => state.toggleSeat);
  const reset = useBookingDraftStore((state) => state.reset);
  const seconds = useRemainingSeconds(expiresAt);

  useEffect(() => {
    startTrip(tripId);
  }, [startTrip, tripId]);

  const onSeatLocked = useCallback(
    ({ seatNo }: { seatNo: string }) =>
      setLiveStatuses((current) => ({ ...current, [seatNo]: 'LOCKED' })),
    [],
  );
  const onSeatReleased = useCallback(
    ({ seatNo }: { seatNo: string }) =>
      setLiveStatuses((current) => {
        const next = { ...current };
        delete next[seatNo];
        return next;
      }),
    [],
  );
  const onSeatBooked = useCallback(
    ({ seatNo }: { seatNo: string }) =>
      setLiveStatuses((current) => ({ ...current, [seatNo]: 'BOOKED' })),
    [],
  );
  const socketStatus = useSeatMapSocket({
    url: BOOKING_WS_URL,
    tripId,
    createSocket: createSeatSocket,
    onSeatLocked,
    onSeatReleased,
    onSeatBooked,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live seat map</Text>
      <Text style={styles.status}>Socket: {socketStatus}</Text>
      <Text style={styles.timer}>
        {expiresAt ? `Locks expire in ${seconds}s` : 'No active seat locks'}
      </Text>
      <Svg width="100%" height={330} viewBox="0 0 280 330">
        {SEATS.map((seat) => {
          const x = 20 + seat.column * 65 + (seat.column > 1 ? 15 : 0);
          const y = 25 + seat.row * 70;
          const liveStatus = liveStatuses[seat.seatNo];
          const selected = selectedSeats.includes(seat.seatNo);
          const fill =
            liveStatus === 'BOOKED'
              ? '#dc3545'
              : liveStatus === 'LOCKED'
                ? '#f0ad4e'
                : selected
                  ? '#0b5fff'
                  : '#44a66c';
          return (
            <G key={seat.seatNo}>
              <Rect
                x={x}
                y={y}
                width={48}
                height={48}
                rx={8}
                fill={fill}
                onPress={() => {
                  if (!liveStatus) toggleSeat(seat.seatNo);
                }}
              />
              <SvgText
                x={x + 24}
                y={y + 30}
                fill="#fff"
                fontSize={13}
                fontWeight="600"
                textAnchor="middle"
                onPress={() => {
                  if (!liveStatus) toggleSeat(seat.seatNo);
                }}
              >
                {seat.seatNo}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Text style={styles.selection}>
        Selected: {selectedSeats.join(', ') || 'none'}
      </Text>
      <Button
        title="Clear selection"
        onPress={() => {
          reset();
          startTrip(tripId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
    color: '#0b3d5c',
  },
  timer: {
    color: '#556',
    marginBottom: 8,
  },
  selection: {
    color: '#223',
    marginBottom: 12,
  },
});
