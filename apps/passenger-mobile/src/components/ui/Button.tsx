import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const TONE: Record<Variant, { bg: string; fg: string; pressed: string }> = {
  primary: { bg: colors.brand600, fg: colors.white, pressed: colors.brand700 },
  secondary: {
    bg: colors.brand50,
    fg: colors.brand700,
    pressed: colors.brand100,
  },
  ghost: {
    bg: colors.transparent,
    fg: colors.slate700,
    pressed: colors.slate100,
  },
  danger: { bg: colors.rose600, fg: colors.white, pressed: colors.rose700 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const tone = TONE[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed && !inactive ? tone.pressed : tone.bg },
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} size="small" />
      ) : (
        icon && <Ionicons color={tone.fg} name={icon} size={18} />
      )}
      <Text style={[styles.label, { color: tone.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  fullWidth: { width: '100%' },
  inactive: { opacity: 0.55 },
  label: { fontSize: fontSize.sm, fontWeight: '700' },
});
