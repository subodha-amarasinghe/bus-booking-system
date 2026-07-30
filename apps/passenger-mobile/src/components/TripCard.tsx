import type { Trip } from '@bus-booking/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration, formatMoney, formatTime } from '../lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../theme/tokens';
import { StatusBadge } from './ui/StatusBadge';

export function TripCard({
  trip,
  routeLabel,
  onPress,
}: {
  trip: Trip;
  routeLabel: string;
  onPress: () => void;
}) {
  const duration = formatDuration(trip.departureAt, trip.arrivalAt);
  const soldOut = trip.availableSeats === 0;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={soldOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        soldOut && styles.soldOut,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.times}>
          <Text style={styles.time}>{formatTime(trip.departureAt)}</Text>
          {trip.arrivalAt ? (
            <>
              <Ionicons color={colors.slate400} name="arrow-forward" size={14} />
              <Text style={styles.time}>{formatTime(trip.arrivalAt)}</Text>
            </>
          ) : null}
        </View>
        <StatusBadge status={trip.status} />
      </View>

      <Text numberOfLines={1} style={styles.route}>
        {routeLabel}
      </Text>

      <View style={styles.meta}>
        {duration ? (
          <View style={styles.metaItem}>
            <Ionicons color={colors.slate400} name="time-outline" size={14} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons color={colors.slate400} name="people-outline" size={14} />
          <Text style={styles.metaText}>
            {trip.availableSeats === undefined
              ? 'Seats available'
              : `${trip.availableSeats} seats left`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.fare}>
          {formatMoney(trip.fareAmount, trip.currency)}
        </Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            {soldOut ? 'Sold out' : 'Select seats'}
          </Text>
          {!soldOut ? (
            <Ionicons color={colors.brand700} name="chevron-forward" size={16} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
    ...shadow,
  },
  pressed: { borderColor: colors.brand500 },
  soldOut: { opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  times: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  time: { fontSize: fontSize.lg, fontWeight: '700', color: colors.slate900 },
  route: { fontSize: fontSize.sm, color: colors.slate600, fontWeight: '500' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: fontSize.xs, color: colors.slate500 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  fare: { fontSize: fontSize.lg, fontWeight: '700', color: colors.slate900 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ctaText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand700 },
});
