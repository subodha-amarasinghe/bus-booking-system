import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontSize, spacing } from '../../theme/tokens';

/** Scrollable page body with consistent gutters and optional pull-to-refresh. */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[colors.brand600]}
            onRefresh={onRefresh}
            refreshing={Boolean(refreshing)}
            tintColor={colors.brand600}
          />
        ) : undefined
      }
      style={styles.screen}
    >
      {children}
    </ScrollView>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  section: { gap: spacing.xs },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.slate900,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.slate500 },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.slate400,
  },
});
