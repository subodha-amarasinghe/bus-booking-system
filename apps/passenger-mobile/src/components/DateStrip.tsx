import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dateStripLabel, shiftDateKey, toDateKey } from '../lib/format';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

/**
 * Horizontal day picker. Preferred over a native date dialog here: travel dates
 * are nearly always within the next couple of weeks, and a single tap beats
 * opening a modal.
 */
export function DateStrip({
  value,
  onChange,
  days = 14,
}: {
  value: string;
  onChange: (dateKey: string) => void;
  days?: number;
}) {
  const today = toDateKey();
  const options = useMemo(
    () => Array.from({ length: days }, (_, index) => shiftDateKey(today, index)),
    [days, today],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Travel date</Text>
      <ScrollView
        contentContainerStyle={styles.strip}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((dateKey) => {
          const { weekday, day } = dateStripLabel(dateKey);
          const active = dateKey === value;
          return (
            <Pressable
              accessibilityLabel={`${weekday} ${day}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={dateKey}
              onPress={() => onChange(dateKey)}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.weekday, active && styles.textActive]}>
                {dateKey === today ? 'Today' : weekday}
              </Text>
              <Text style={[styles.dayNumber, active && styles.textActive]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.slate600 },
  strip: { gap: spacing.sm, paddingRight: spacing.lg },
  day: {
    minWidth: 60,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.md,
  },
  dayActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  weekday: { fontSize: fontSize.xs, color: colors.slate500, fontWeight: '600' },
  dayNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.slate900,
  },
  textActive: { color: colors.white },
});
