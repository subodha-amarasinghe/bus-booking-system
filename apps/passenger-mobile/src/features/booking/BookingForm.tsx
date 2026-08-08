import {
  useBookingDraft,
  useRemainingSeconds,
} from '@bus-booking/passenger-core';
import { ConfirmBookingRequestSchema } from '@bus-booking/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AlertBanner, EmptyState } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { Screen, SectionTitle } from '../../components/ui/Screen';
import type { PassengerSession } from '../../lib/auth-context';
import { formatCountdown, formatMoney } from '../../lib/format';
import { passengerApi } from '../../lib/passenger-api';
import { usePassengerProfile } from '../../lib/profile';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const PassengerDetailsSchema = ConfirmBookingRequestSchema.pick({
  passengerName: true,
  passengerPhone: true,
});

type PassengerDetails = {
  passengerName: string;
  passengerPhone: string;
};

export function BookingForm({
  tripId,
  session,
  fare,
  currency,
}: {
  tripId: string;
  session: PassengerSession;
  fare: number;
  currency: string;
}) {
  const router = useRouter();
  const draft = useBookingDraft(passengerApi);
  const remaining = useRemainingSeconds(draft.expiresAt);
  const profile = usePassengerProfile(session.userId);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PassengerDetails>({
    resolver: zodResolver(PassengerDetailsSchema),
    // Prefilled from the account so the common case is a single tap.
    values: {
      passengerName: profile.data?.name ?? '',
      passengerPhone: profile.data?.phone ?? session.phone ?? '',
    },
  });

  const heldSeats = Object.keys(draft.lockTokens);
  const expired = remaining <= 0;

  if (heldSeats.length === 0 || draft.tripId !== tripId) {
    return (
      <Screen>
        <EmptyState
          actionLabel="Back to seat map"
          body="Your seat hold is no longer active. Choose your seats again."
          icon="time-outline"
          onAction={() => router.replace({
            pathname: '/trips/[tripId]',
            params: { tripId, fare: String(fare), currency },
          })}
          title="No seats held"
        />
      </Screen>
    );
  }

  const submit = handleSubmit(async (values) => {
    try {
      const bookings = await draft.confirm({
        userId: session.userId,
        passengerName: values.passengerName,
        passengerPhone: values.passengerPhone,
      });

      const first = bookings[0];
      const bookedTotal = bookings.reduce(
        (sum, booking) => sum + booking.fareAmount,
        0,
      );
      const total =
        bookedTotal > 0 ? bookedTotal : fare * bookings.length;

      router.replace({
        pathname: '/payment/[bookingId]',
        params: {
          bookingId: first.bookingId,
          amount: String(total),
          currency: first.currency || currency,
          seats: bookings.map((booking) => booking.seatNo).join(','),
        },
      });
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Could not confirm your booking. Please try again.',
      });
    }
  });

  return (
    <Screen>
      <SectionTitle
        subtitle="These details go on the ticket."
        title="Passenger details"
      />

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Seats</Text>
          <Text style={styles.summaryValue}>{heldSeats.join(', ')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(heldSeats.length * fare, currency)}
          </Text>
        </View>
        <View
          style={[styles.holdRow, expired ? styles.holdExpired : styles.holdOk]}
        >
          <Ionicons
            color={expired ? colors.rose700 : colors.emerald700}
            name={expired ? 'alert-circle' : 'time-outline'}
            size={16}
          />
          <Text
            style={[
              styles.holdText,
              { color: expired ? colors.rose700 : colors.emerald700 },
            ]}
          >
            {expired
              ? 'Hold expired'
              : `Held for ${formatCountdown(remaining)}`}
          </Text>
        </View>
      </Card>

      {expired ? (
        <>
          <AlertBanner>
            Your hold expired before checkout. Pick your seats again.
          </AlertBanner>
          <Button
            fullWidth
            icon="arrow-back"
            label="Back to seat map"
            onPress={() =>
              router.replace({
                pathname: '/trips/[tripId]',
                params: { tripId, fare: String(fare), currency },
              })
            }
          />
        </>
      ) : (
        <Card style={styles.form}>
          {errors.root?.message ? (
            <AlertBanner>{errors.root.message}</AlertBanner>
          ) : null}

          <Controller
            control={control}
            name="passengerName"
            render={({ field }) => (
              <Input
                autoCapitalize="words"
                error={errors.passengerName?.message}
                label="Passenger name"
                onChangeText={field.onChange}
                placeholder="Nimal Perera"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="passengerPhone"
            render={({ field }) => (
              <Input
                error={errors.passengerPhone?.message}
                hint="We text booking updates to this number."
                keyboardType="phone-pad"
                label="Contact number"
                onChangeText={field.onChange}
                placeholder="0771111111"
                value={field.value}
              />
            )}
          />

          <Button
            fullWidth
            icon="checkmark-circle-outline"
            label={`Confirm ${heldSeats.length} seat${
              heldSeats.length === 1 ? '' : 's'
            }`}
            loading={isSubmitting}
            onPress={() => void submit()}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.slate500 },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate900,
  },
  holdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  holdOk: { backgroundColor: colors.emerald50 },
  holdExpired: { backgroundColor: colors.rose50 },
  holdText: { fontSize: fontSize.sm, fontWeight: '700' },
  form: { gap: spacing.lg },
});
