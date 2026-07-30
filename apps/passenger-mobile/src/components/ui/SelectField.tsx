import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * React Native has no cross-platform `<select>`, so this presents the options in
 * a bottom sheet. Keeps parity with the web app's origin/destination pickers.
 */
export function SelectField({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  disabled = false,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled || options.length === 0}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          Boolean(error) && styles.triggerError,
          (disabled || options.length === 0) && styles.triggerDisabled,
        ]}
      >
        <Text
          numberOfLines={1}
          style={selected ? styles.triggerValue : styles.triggerPlaceholder}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons color={colors.slate400} name="chevron-down" size={18} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setOpen(false)}
            >
              <Ionicons color={colors.slate500} name="close" size={22} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(option) => option.value}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    {item.hint ? (
                      <Text style={styles.optionHint}>{item.hint}</Text>
                    ) : null}
                  </View>
                  {active ? (
                    <Ionicons
                      color={colors.brand600}
                      name="checkmark"
                      size={20}
                    />
                  ) : null}
                </Pressable>
              );
            }}
            style={styles.optionList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.slate600 },
  trigger: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.md,
  },
  triggerError: { borderColor: colors.rose600 },
  triggerDisabled: { backgroundColor: colors.slate100 },
  triggerValue: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.slate900,
    fontWeight: '500',
  },
  triggerPlaceholder: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.slate400,
  },
  error: { fontSize: fontSize.xs, color: colors.rose700 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    maxHeight: '65%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing['2xl'],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.slate900,
  },
  optionList: { flexGrow: 0 },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  optionPressed: { backgroundColor: colors.slate100 },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: fontSize.base,
    color: colors.slate900,
    fontWeight: '500',
  },
  optionHint: { fontSize: fontSize.xs, color: colors.slate500 },
});
