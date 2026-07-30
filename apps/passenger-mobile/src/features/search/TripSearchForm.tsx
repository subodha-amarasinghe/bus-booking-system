import type { Location } from '@bus-booking/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateStrip } from '../../components/DateStrip';
import { Button } from '../../components/ui/Button';
import { AlertBanner } from '../../components/ui/Feedback';
import { SelectField } from '../../components/ui/SelectField';
import { toDateKey } from '../../lib/format';
import { colors, radius, spacing } from '../../theme/tokens';

export interface TripSearchValues {
  originLocationId: string;
  destinationLocationId: string;
  departureDate: string;
}

export function TripSearchForm({
  locations,
  initial,
  onSubmit,
  submitLabel = 'Search buses',
}: {
  locations: Location[];
  initial?: Partial<TripSearchValues>;
  onSubmit: (values: TripSearchValues) => void;
  submitLabel?: string;
}) {
  const [origin, setOrigin] = useState(initial?.originLocationId ?? null);
  const [destination, setDestination] = useState(
    initial?.destinationLocationId ?? null,
  );
  const [dateKey, setDateKey] = useState(
    initial?.departureDate ?? toDateKey(),
  );
  const [error, setError] = useState('');

  const options = locations.map((location) => ({
    value: location.id,
    label: location.name,
    hint: location.city,
  }));

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function submit() {
    if (!origin || !destination) {
      setError('Choose where you are travelling from and to.');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination must be different.');
      return;
    }
    setError('');
    onSubmit({
      originLocationId: origin,
      destinationLocationId: destination,
      departureDate: dateKey,
    });
  }

  return (
    <View style={styles.form}>
      {locations.length === 0 ? (
        <AlertBanner>
          No stops are available yet. Start the API gateway and seed the
          database.
        </AlertBanner>
      ) : null}

      <View style={styles.pair}>
        <SelectField
          disabled={locations.length === 0}
          label="From"
          onChange={setOrigin}
          options={options}
          placeholder="Select origin"
          value={origin}
        />

        <Pressable
          accessibilityLabel="Swap origin and destination"
          accessibilityRole="button"
          hitSlop={8}
          onPress={swap}
          style={styles.swap}
        >
          <Ionicons color={colors.brand700} name="swap-vertical" size={18} />
          <Text style={styles.swapText}>Swap</Text>
        </Pressable>

        <SelectField
          disabled={locations.length === 0}
          label="To"
          onChange={setDestination}
          options={options}
          placeholder="Select destination"
          value={destination}
        />
      </View>

      <DateStrip onChange={setDateKey} value={dateKey} />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <Button
        fullWidth
        icon="search"
        label={submitLabel}
        onPress={submit}
        disabled={locations.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  pair: { gap: spacing.md },
  swap: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand50,
    borderRadius: radius.full,
  },
  swapText: { fontSize: 12, fontWeight: '700', color: colors.brand700 },
});
