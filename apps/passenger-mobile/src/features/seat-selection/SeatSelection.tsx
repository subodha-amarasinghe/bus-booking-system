import {
  useBookingDraft,
  useBookingDraftStore,
  useRemainingSeconds,
  useSeatMap,
  useSeatMapSocket,
} from '@bus-booking/passenger-core';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  SeatGrid,
  SeatGridSkeleton,
  SeatLegend,
} from '../../components/SeatGrid';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  AlertBanner,
  ErrorState,
  LoadingBlock,
} from '../../components/ui/Feedback';
import { Screen } from '../../components/ui/Screen';
import type { PassengerSession } from '../../lib/auth-context';
import { formatCountdown, formatDateTime, formatMoney } from '../../lib/format';
import { passengerApi } from '../../lib/passenger-api';
import {
  createSeatSocket,
  SEAT_SOCKET_URL,
  useWsToken,
} from '../../lib/seat-socket-factory';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const SOCKET_LABEL = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Reconnecting…',
  error: 'Offline',
} as const;

const SOCKET_COLOR = {
  connecting: colors.amber700,
  connected: colors.emerald700,
  disconnected: colors.amber700,
  error: colors.rose700,
} as const;

export function SeatSelection({
  tripId,
  session,
  fare,
  currency,
  departureAt,
}: {
  tripId: string;
  session: PassengerSession;
  fare: number;
  currency: string;
  departureAt?: string;
}) {
  const router = useRouter();
  const [lockError, setLockError] = useState('');

  const seatMap = useSeatMap(passengerApi, tripId);
  const draft = useBookingDraft(passengerApi);
  const remaining = useRemainingSeconds(draft.expiresAt);
  const wsToken = useWsToken(true);

  const socketStatus = useSeatMapSocket({
    url: SEAT_SOCKET_URL,
    tripId,
    accessToken: wsToken.data?.token ?? null,
    createSocket: createSeatSocket,
  });

  // `draft` is rebuilt every render, so depend on the stable store action.
  const { startTrip } = draft;
  useEffect(() => {
    startTrip(tripId);
  }, [startTrip, tripId]);

  /**
   * Abandoning the screen must give the seats back — otherwise they stay locked
   * for the remainder of the TTL and nobody else can book them. Read the store
   * imperatively so this only runs on real unmount.
   */
  useEffect(
    () => () => {
      const state = useBookingDraftStore.getState();
      const locks = Object.entries(state.lockTokens).map(
        ([seatNo, lockToken]) => ({ seatNo, lockToken }),
      );
      if (state.tripId && locks.length > 0) {
        void passengerApi
          .releaseSeats({ tripId: state.tripId, locks })
          .catch(() => undefined);
        state.reset();
      }
    },
    [],
  );

  const held = Object.keys(draft.lockTokens).length > 0;
  const expired = held && remaining <= 0;
  const total = draft.selectedSeats.length * fare;

  if (seatMap.isPending) {
    return (
      <Screen>
        <Card>
          <SeatGridSkeleton />
        </Card>
        <LoadingBlock label="Loading the seat map…" />
      </Screen>
    );
  }

  if (seatMap.isError || !seatMap.data) {
    return (
      <Screen>
        <ErrorState
          message={
            seatMap.error instanceof Error
              ? seatMap.error.message
              : 'Could not load the seat map for this trip.'
          }
          onRetry={() => void seatMap.refetch()}
        />
      </Screen>
    );
  }

  async function hold() {
    setLockError('');
    try {
      await draft.lockSeats({ userId: session.userId });
    } catch (error) {
      setLockError(
        error instanceof Error
          ? error.message
          : 'Could not hold those seats. Someone may have taken them.',
      );
      void seatMap.refetch();
    }
  }

  function startOver() {
    draft.reset();
    draft.startTrip(tripId);
    setLockError('');
    void seatMap.refetch();
  }

  return (
    <>
      <Screen>
        {departureAt ? (
          <View style={styles.tripMeta}>
            <Ionicons color={colors.slate400} name="calendar-outline" size={14} />
            <Text style={styles.tripMetaText}>
              Departs {formatDateTime(departureAt)}
            </Text>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: SOCKET_COLOR[socketStatus] },
              ]}
            />
            <Text
              style={[styles.statusText, { color: SOCKET_COLOR[socketStatus] }]}
            >
              {SOCKET_LABEL[socketStatus]}
            </Text>
          </View>
          <Text style={styles.fareHint}>
            {formatMoney(fare, currency)} per seat
          </Text>
        </View>

        {expired ? (
          <AlertBanner>
            Your seat hold expired. Pick your seats again.
          </AlertBanner>
        ) : lockError ? (
          <AlertBanner>{lockError}</AlertBanner>
        ) : null}

        <Card style={styles.mapCard}>
          <View style={styles.driverRow}>
            <Text style={styles.driverText}>Front of bus</Text>
          </View>

          <SeatGrid
            columns={seatMap.data.columns}
            frozen={held && !expired}
            onToggle={draft.toggleSeat}
            seats={seatMap.data.seats}
            selectedSeats={draft.selectedSeats}
          />

          <View style={styles.legendWrap}>
            <SeatLegend />
          </View>
        </Card>

        <Text style={styles.helpText}>
          {held && !expired
            ? 'Your seats are held. Continue to enter passenger details.'
            : 'Tap the seats you want, then hold them to continue.'}
        </Text>
      </Screen>

      <View style={styles.bar}>
        <View style={styles.barInfo}>
          <Text style={styles.barSeats} numberOfLines={1}>
            {draft.selectedSeats.length > 0
              ? draft.selectedSeats.join(', ')
              : 'No seats selected'}
          </Text>
          <Text style={styles.barTotal}>
            {held && !expired
              ? `Held · ${formatCountdown(remaining)} left`
              : formatMoney(total, currency)}
          </Text>
        </View>

        {expired ? (
          <Button icon="refresh" label="Start over" onPress={startOver} />
        ) : held ? (
          <Button
            icon="arrow-forward"
            label="Continue"
            onPress={() =>
              router.push({
                pathname: '/trips/[tripId]/booking',
                params: { tripId, fare: String(fare), currency },
              })
            }
          />
        ) : (
          <Button
            disabled={draft.selectedSeats.length === 0}
            icon="lock-closed-outline"
            label="Hold seats"
            loading={draft.lockMutation.isPending}
            onPress={() => void hold()}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tripMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tripMetaText: { fontSize: fontSize.xs, color: colors.slate500 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.full,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fontSize.xs, fontWeight: '700' },
  fareHint: { fontSize: fontSize.xs, color: colors.slate500 },
  mapCard: { gap: spacing.lg, paddingHorizontal: spacing.md },
  driverRow: { alignItems: 'center' },
  driverText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.slate400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  legendWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.slate500,
    textAlign: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  barInfo: { flex: 1, gap: 2 },
  barSeats: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate900,
  },
  barTotal: { fontSize: fontSize.xs, color: colors.slate500 },
});
