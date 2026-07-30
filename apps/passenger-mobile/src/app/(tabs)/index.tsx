import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { LoadingBlock } from '../../components/ui/Feedback';
import { Screen, SectionTitle } from '../../components/ui/Screen';
import { TripSearchForm } from '../../features/search/TripSearchForm';
import { useAuth } from '../../lib/auth-context';
import { useLocations } from '../../lib/catalog';
import { toDateKey } from '../../lib/format';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const TRUST_POINTS = [
  {
    icon: 'flash-outline' as const,
    title: 'Live seat map',
    body: 'Seats update the moment another passenger holds one.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Held while you pay',
    body: 'Your seat is locked for a few minutes at checkout.',
  },
  {
    icon: 'ticket-outline' as const,
    title: 'Tickets in the app',
    body: 'Every booking stays under My bookings.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const locations = useLocations();

  /** Common corridors, so a first-time user can search in one tap. */
  const popular = (locations.data ?? []).slice(0, 4);

  return (
    <Screen
      onRefresh={() => void locations.refetch()}
      refreshing={locations.isFetching}
    >
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons color={colors.brand700} name="bus" size={14} />
          <Text style={styles.heroBadgeText}>Intercity bus travel</Text>
        </View>
        <Text style={styles.heroTitle}>
          {session ? 'Where to next?' : 'Book your seat in seconds'}
        </Text>
        <Text style={styles.heroBody}>
          Pick your route, choose a seat on the live map, and pay securely.
        </Text>
      </View>

      <Card>
        {locations.isPending ? (
          <LoadingBlock label="Loading stops…" />
        ) : (
          <TripSearchForm
            locations={locations.data ?? []}
            onSubmit={(values) =>
              router.push({
                pathname: '/search',
                params: {
                  originLocationId: values.originLocationId,
                  destinationLocationId: values.destinationLocationId,
                  departureDate: values.departureDate,
                },
              })
            }
          />
        )}
      </Card>

      {popular.length >= 2 ? (
        <View style={styles.block}>
          <SectionTitle
            subtitle="Tap a stop to search departures for today"
            title="Popular departures"
          />
          <View style={styles.chips}>
            {popular.map((location) => (
              <Pressable
                accessibilityRole="button"
                key={location.id}
                onPress={() =>
                  router.push({
                    pathname: '/search',
                    params: {
                      originLocationId: location.id,
                      departureDate: toDateKey(),
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
              >
                <Ionicons
                  color={colors.brand600}
                  name="location-outline"
                  size={14}
                />
                <Text style={styles.chipText}>From {location.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.block}>
        <SectionTitle title="Why book here" />
        {TRUST_POINTS.map((point) => (
          <Card key={point.title} style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <Ionicons color={colors.brand600} name={point.icon} size={20} />
            </View>
            <View style={styles.trustText}>
              <Text style={styles.trustTitle}>{point.title}</Text>
              <Text style={styles.trustBody}>{point.body}</Text>
            </View>
          </Card>
        ))}
      </View>

      {!session ? (
        <Card style={styles.authCard}>
          <Text style={styles.authTitle}>Already have an account?</Text>
          <Text style={styles.authBody}>
            Sign in to hold seats and see your tickets.
          </Text>
          <View style={styles.authActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/login')}
              style={styles.authPrimary}
            >
              <Text style={styles.authPrimaryText}>Sign in</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/register')}
              style={styles.authSecondary}
            >
              <Text style={styles.authSecondaryText}>Create account</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.brand50,
    borderRadius: radius.full,
  },
  heroBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.brand700,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.slate900,
  },
  heroBody: { fontSize: fontSize.sm, color: colors.slate500, lineHeight: 20 },
  block: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.full,
  },
  chipPressed: { backgroundColor: colors.brand50 },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.slate700,
  },
  trustCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  trustIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
  },
  trustText: { flex: 1, gap: 2 },
  trustTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate900,
  },
  trustBody: { fontSize: fontSize.xs, color: colors.slate500, lineHeight: 18 },
  authCard: { gap: spacing.sm },
  authTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate900,
  },
  authBody: { fontSize: fontSize.sm, color: colors.slate500 },
  authActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  authPrimary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand600,
    borderRadius: radius.md,
  },
  authPrimaryText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  authSecondary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderRadius: radius.md,
  },
  authSecondaryText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.brand700,
  },
});
