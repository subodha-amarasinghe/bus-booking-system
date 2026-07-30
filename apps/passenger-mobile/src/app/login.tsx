import { LoginRequestSchema } from '@bus-booking/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertBanner } from '../components/ui/Feedback';
import { Input } from '../components/ui/Input';
import { Screen, SectionTitle } from '../components/ui/Screen';
import { useAuth } from '../lib/auth-context';
import { colors, fontSize, radius, spacing } from '../theme/tokens';

type LoginValues = { phone: string; password: string };

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { phone: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      router.back();
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Could not sign in. Please try again.',
      });
    }
  });

  return (
    <Screen>
      <SectionTitle
        subtitle="Sign in to hold seats and manage your tickets."
        title="Welcome back"
      />

      <Card style={styles.card}>
        {errors.root?.message ? (
          <AlertBanner>{errors.root.message}</AlertBanner>
        ) : null}

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              error={errors.phone?.message}
              keyboardType="phone-pad"
              label="Phone number"
              onChangeText={field.onChange}
              placeholder="0771111111"
              value={field.value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              error={errors.password?.message}
              label="Password"
              onChangeText={field.onChange}
              placeholder="Your password"
              secureTextEntry
              value={field.value}
            />
          )}
        />

        <Button
          fullWidth
          label="Sign in"
          loading={isSubmitting}
          onPress={() => void submit()}
        />

        <View style={styles.demo}>
          <Text style={styles.demoLabel}>Demo account</Text>
          <Text style={styles.demoValue}>0771111111 · Password123!</Text>
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/register')}
        style={styles.footerLink}
      >
        <Text style={styles.footerText}>
          New here? <Text style={styles.footerStrong}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  demo: {
    gap: 2,
    padding: spacing.md,
    backgroundColor: colors.slate50,
    borderRadius: radius.md,
  },
  demoLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  demoValue: { fontSize: fontSize.sm, color: colors.slate600 },
  footerLink: { alignItems: 'center', paddingVertical: spacing.md },
  footerText: { fontSize: fontSize.sm, color: colors.slate500 },
  footerStrong: { color: colors.brand700, fontWeight: '700' },
});
