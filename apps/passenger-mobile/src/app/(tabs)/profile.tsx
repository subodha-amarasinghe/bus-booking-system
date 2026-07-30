import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '../../components/AuthGate';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Screen, SectionTitle } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth, type PassengerSession } from '../../lib/auth-context';
import { usePassengerProfile } from '../../lib/profile';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const QUICK_LINKS = [
  {
    icon: 'ticket-outline' as const,
    label: 'My bookings',
    body: 'Tickets, payments and cancellations',
    href: '/bookings' as const,
  },
  {
    icon: 'search-outline' as const,
    label: 'Find a bus',
    body: 'Search departures on any route',
    href: '/' as const,
  },
];

function ProfileDetails({ session }: { session: PassengerSession }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const profile = usePassengerProfile(session.userId);

  const name = profile.data?.name ?? 'Passenger';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again to book seats.', [
      { text: 'Stay signed in', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }

  return (
    <Screen
      onRefresh={() => void profile.refetch()}
      refreshing={profile.isFetching}
    >
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'P'}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>
            {profile.data?.phone ?? session.phone ?? 'Phone not set'}
          </Text>
        </View>
        <StatusBadge status={profile.data?.role ?? session.role ?? 'PASSENGER'} />
      </Card>

      <View style={styles.block}>
        <SectionTitle title="Account details" />
        <Card style={styles.detailCard}>
          <DetailRow
            icon="mail-outline"
            label="Email"
            value={profile.data?.email ?? 'Not provided'}
          />
          <DetailRow
            icon="finger-print-outline"
            label="Account ID"
            value={session.userId}
          />
        </Card>
      </View>

      <View style={styles.block}>
        <SectionTitle title="Shortcuts" />
        {QUICK_LINKS.map((link) => (
          <Pressable
            accessibilityRole="button"
            key={link.href}
            onPress={() => router.replace(link.href)}
            style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
          >
            <View style={styles.linkIcon}>
              <Ionicons color={colors.brand600} name={link.icon} size={18} />
            </View>
            <View style={styles.linkText}>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Text style={styles.linkBody}>{link.body}</Text>
            </View>
            <Ionicons
              color={colors.slate400}
              name="chevron-forward"
              size={18}
            />
          </Pressable>
        ))}
      </View>

      <Button
        fullWidth
        icon="log-out-outline"
        label="Sign out"
        onPress={confirmSignOut}
        variant="danger"
      />
    </Screen>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons color={colors.slate400} name={icon} size={16} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <AuthGate message="Sign in to view your account details.">
      {(session) => <ProfileDetails session={session} />}
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderRadius: radius.full,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.brand700,
  },
  identityText: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.slate900 },
  phone: { fontSize: fontSize.sm, color: colors.slate500 },
  block: { gap: spacing.md },
  detailCard: { gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailLabel: { fontSize: fontSize.sm, color: colors.slate500 },
  detailValue: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.slate900,
    textAlign: 'right',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
  },
  linkPressed: { backgroundColor: colors.slate50 },
  linkIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderRadius: radius.sm,
  },
  linkText: { flex: 1, gap: 2 },
  linkLabel: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate900,
  },
  linkBody: { fontSize: fontSize.xs, color: colors.slate500 },
});
