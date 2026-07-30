import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

type Tone = 'emerald' | 'amber' | 'rose' | 'slate' | 'brand';

/** Mirrors the tone mapping in the web app's StatusBadge. */
const TONE_BY_STATUS: Record<string, Tone> = {
  CONFIRMED: 'emerald',
  COMPLETED: 'emerald',
  SUCCEEDED: 'emerald',
  APPROVED: 'emerald',
  AVAILABLE: 'emerald',
  LOCKED: 'amber',
  PENDING: 'amber',
  BOARDING: 'amber',
  CANCELLED: 'rose',
  FAILED: 'rose',
  REJECTED: 'rose',
  EXPIRED: 'slate',
  UNAVAILABLE: 'slate',
  BOOKED: 'slate',
  SCHEDULED: 'brand',
  IN_PROGRESS: 'brand',
  REFUNDED: 'brand',
};

const PALETTE: Record<Tone, { bg: string; fg: string }> = {
  emerald: { bg: colors.emerald50, fg: colors.emerald700 },
  amber: { bg: colors.amber50, fg: colors.amber700 },
  rose: { bg: colors.rose50, fg: colors.rose700 },
  slate: { bg: colors.slate100, fg: colors.slate600 },
  brand: { bg: colors.brand50, fg: colors.brand700 },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = PALETTE[TONE_BY_STATUS[status] ?? 'slate'];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

export function Pill({ label }: { label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.brand600 }]}>
      <Text style={[styles.text, { color: colors.white }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  text: { fontSize: fontSize.xs, fontWeight: '700' },
});
