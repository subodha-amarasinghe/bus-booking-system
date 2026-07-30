import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '../../components/AuthGate';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AlertBanner, EmptyState } from '../../components/ui/Feedback';
import { Screen, SectionTitle } from '../../components/ui/Screen';
import type { PassengerSession } from '../../lib/auth-context';
import { usePayOnline } from '../../lib/bookings';
import { formatMoney } from '../../lib/format';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

function PaymentPanel({
  bookingId,
  session,
  amount,
  currency,
  seats,
}: {
  bookingId: string;
  session: PassengerSession;
  amount: number;
  currency: string;
  seats?: string;
}) {
  const router = useRouter();
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const pay = usePayOnline();

  if (!Number.isFinite(amount) || amount <= 0) {
    return (
      <Screen>
        <EmptyState
          actionLabel="View my bookings"
          body="We could not work out the amount for this booking."
          icon="card-outline"
          onAction={() => router.replace('/bookings')}
          title="Nothing to pay"
        />
      </Screen>
    );
  }

  async function submit() {
    setError('');
    try {
      const payment = await pay.mutateAsync({
        bookingId,
        userId: session.userId,
        amount,
        currency,
      });
      if (payment.status === 'FAILED') {
        setError(payment.failureReason ?? 'The payment was declined.');
        return;
      }
      setPaid(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The payment could not be processed.',
      );
    }
  }

  if (paid) {
    return (
      <Screen>
        <View style={styles.successIcon}>
          <Ionicons
            color={colors.emerald700}
            name="checkmark-circle"
            size={44}
          />
        </View>
        <SectionTitle
          subtitle={`${formatMoney(amount, currency)} paid. Your ticket is ready.`}
          title="Payment complete"
        />
        <Button
          fullWidth
          icon="ticket-outline"
          label="View my bookings"
          onPress={() => router.replace('/bookings')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle
        subtitle="Review your booking, then pay to secure the seat."
        title="Complete payment"
      />

      <Card style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>Booking</Text>
          <Text style={styles.mono}>{bookingId.slice(0, 8)}…</Text>
        </View>
        {seats ? (
          <View style={styles.row}>
            <Text style={styles.label}>Seats</Text>
            <Text style={styles.value}>{seats.split(',').join(', ')}</Text>
          </View>
        ) : null}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Amount due</Text>
          <Text style={styles.totalValue}>{formatMoney(amount, currency)}</Text>
        </View>
      </Card>

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <Card style={styles.payCard}>
        <View style={styles.payHeader}>
          <Ionicons color={colors.brand600} name="card-outline" size={20} />
          <Text style={styles.payTitle}>Pay online</Text>
        </View>
        <Text style={styles.payBody}>
          Your card is charged through the secure payment service. Seats stay
          held until the payment clears.
        </Text>
        <Button
          fullWidth
          icon="lock-closed-outline"
          label={`Pay ${formatMoney(amount, currency)}`}
          loading={pay.isPending}
          onPress={() => void submit()}
        />
      </Card>

      <Button
        fullWidth
        label="Pay later"
        onPress={() => router.replace('/bookings')}
        variant="ghost"
      />
    </Screen>
  );
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    amount?: string;
    currency?: string;
    seats?: string;
  }>();

  if (!params.bookingId) {
    return (
      <Screen>
        <EmptyState
          body="Open the booking from My bookings and try again."
          icon="alert-circle-outline"
          title="Booking not found"
        />
      </Screen>
    );
  }

  return (
    <AuthGate message="Sign in to pay for this booking.">
      {(session) => (
        <PaymentPanel
          amount={Number(params.amount)}
          bookingId={params.bookingId as string}
          currency={params.currency ?? 'LKR'}
          seats={params.seats}
          session={session}
        />
      )}
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { fontSize: fontSize.sm, color: colors.slate500 },
  value: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate900,
  },
  mono: { fontSize: fontSize.xs, color: colors.slate600 },
  totalRow: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.slate600,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.slate900,
  },
  payCard: { gap: spacing.md },
  payHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  payTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate900,
  },
  payBody: { fontSize: fontSize.sm, color: colors.slate500, lineHeight: 20 },
  successIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emerald50,
    borderRadius: radius.full,
  },
});
