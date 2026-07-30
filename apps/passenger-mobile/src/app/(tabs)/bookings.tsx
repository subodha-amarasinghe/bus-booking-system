import { useMyBookings } from '@bus-booking/passenger-core';
import type { Booking } from '@bus-booking/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '../../components/AuthGate';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '../../components/ui/Feedback';
import { Screen, SectionTitle } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { PassengerSession } from '../../lib/auth-context';
import { useCancelBooking } from '../../lib/bookings';
import { formatDateTime, formatMoney } from '../../lib/format';
import { passengerApi } from '../../lib/passenger-api';
import { colors, fontSize, spacing } from '../../theme/tokens';

const CANCELLABLE = new Set(['CONFIRMED', 'LOCKED']);

function BookingRow({
  booking,
  onPay,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onPay: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.seatBlock}>
          <Text style={styles.seatLabel}>Seat</Text>
          <Text style={styles.seatNo}>{booking.seatNo}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons color={colors.slate400} name="person-outline" size={14} />
          <Text style={styles.detailText}>{booking.passengerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons color={colors.slate400} name="call-outline" size={14} />
          <Text style={styles.detailText}>{booking.passengerPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons color={colors.slate400} name="calendar-outline" size={14} />
          <Text style={styles.detailText}>
            Booked {formatDateTime(booking.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.fare}>
          {formatMoney(booking.fareAmount, booking.currency)}
        </Text>
        <View style={styles.actions}>
          {booking.status === 'LOCKED' ? (
            <Button
              label="Pay"
              onPress={onPay}
              style={styles.action}
              variant="primary"
            />
          ) : null}
          {CANCELLABLE.has(booking.status) ? (
            <Button
              label="Cancel"
              loading={cancelling}
              onPress={onCancel}
              style={styles.action}
              variant="danger"
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function BookingsList({ session }: { session: PassengerSession }) {
  const router = useRouter();
  const bookings = useMyBookings(passengerApi);
  const cancel = useCancelBooking();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function confirmCancel(booking: Booking) {
    Alert.alert(
      'Cancel this booking?',
      `Seat ${booking.seatNo} will be released. Refunds follow the cancellation policy.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => {
            setPendingId(booking.id);
            cancel.mutate(
              { bookingId: booking.id, userId: session.userId },
              {
                onError: (error) =>
                  Alert.alert(
                    'Could not cancel',
                    error instanceof Error
                      ? error.message
                      : 'Please try again in a moment.',
                  ),
                onSettled: () => setPendingId(null),
              },
            );
          },
        },
      ],
    );
  }

  if (bookings.isPending) {
    return (
      <Screen>
        <LoadingBlock label="Loading your tickets…" />
      </Screen>
    );
  }

  if (bookings.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            bookings.error instanceof Error
              ? bookings.error.message
              : 'Could not load your bookings.'
          }
          onRetry={() => void bookings.refetch()}
        />
      </Screen>
    );
  }

  const items = bookings.data ?? [];

  return (
    <Screen
      onRefresh={() => void bookings.refetch()}
      refreshing={bookings.isFetching}
    >
      <SectionTitle
        subtitle={`${items.length} booking${items.length === 1 ? '' : 's'}`}
        title="My bookings"
      />

      {items.length === 0 ? (
        <EmptyState
          actionLabel="Find a bus"
          body="Once you book a seat it will show up here."
          icon="ticket-outline"
          onAction={() => router.replace('/')}
          title="No bookings yet"
        />
      ) : (
        items.map((booking) => (
          <BookingRow
            booking={booking}
            cancelling={pendingId === booking.id}
            key={booking.id}
            onCancel={() => confirmCancel(booking)}
            onPay={() =>
              router.push({
                pathname: '/payment/[bookingId]',
                params: {
                  bookingId: booking.id,
                  amount: String(booking.fareAmount),
                  currency: booking.currency,
                  seats: booking.seatNo,
                },
              })
            }
          />
        ))
      )}
    </Screen>
  );
}

export default function BookingsScreen() {
  return (
    <AuthGate message="Sign in to see the tickets on your account.">
      {(session) => <BookingsList session={session} />}
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  seatBlock: { gap: 2 },
  seatLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.slate400,
  },
  seatNo: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.slate900,
  },
  details: { gap: spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: fontSize.sm, color: colors.slate600 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  fare: { fontSize: fontSize.lg, fontWeight: '700', color: colors.slate900 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { paddingHorizontal: spacing.lg },
});
