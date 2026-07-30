import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';
import { Button } from './Button';

export function AlertBanner({
  children,
  tone = 'error',
}: {
  children: string;
  tone?: 'error' | 'success';
}) {
  const error = tone === 'error';

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.alert,
        {
          backgroundColor: error ? colors.rose50 : colors.emerald50,
          borderColor: error ? colors.rose200 : colors.emerald200,
        },
      ]}
    >
      <Ionicons
        color={error ? colors.rose700 : colors.emerald700}
        name={error ? 'alert-circle' : 'checkmark-circle'}
        size={18}
      />
      <Text
        style={[
          styles.alertText,
          { color: error ? colors.rose700 : colors.emerald700 },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand600} size="large" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'search',
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.brand600} name={icon} size={26} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stack}>
      <AlertBanner>{message}</AlertBanner>
      {onRetry ? (
        <Button
          icon="refresh"
          label="Try again"
          onPress={onRetry}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  alertText: { flex: 1, fontSize: fontSize.sm, fontWeight: '500' },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing['3xl'] },
  muted: { fontSize: fontSize.sm, color: colors.slate500 },
  stack: { gap: spacing.md },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
    borderRadius: radius.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.slate900,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.slate500,
    textAlign: 'center',
  },
});
