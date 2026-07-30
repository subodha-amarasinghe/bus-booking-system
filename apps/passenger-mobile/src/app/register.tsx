import { RegisterRequestSchema } from '@bus-booking/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertBanner } from '../components/ui/Feedback';
import { Input } from '../components/ui/Input';
import { Screen, SectionTitle } from '../components/ui/Screen';
import { useAuth } from '../lib/auth-context';
import { colors, fontSize, spacing } from '../theme/tokens';

type RegisterValues = {
  name: string;
  phone: string;
  email?: string;
  password: string;
};

/**
 * A text input can only ever be empty or a string, so an untouched optional
 * email arrives as `''` — which the shared `.email()` rule rejects. Normalising
 * it here keeps shared-types as the single source of validation truth.
 */
const RegisterFormSchema = RegisterRequestSchema.extend({
  email: z.literal('').or(z.string().email()).optional(),
});

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      // The gateway rejects an empty string where it expects a valid email.
      await signUp({ ...values, email: values.email || undefined });
      router.back();
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Could not create your account. Please try again.',
      });
    }
  });

  return (
    <Screen>
      <SectionTitle
        subtitle="One account for every booking you make."
        title="Create your account"
      />

      <Card style={styles.card}>
        {errors.root?.message ? (
          <AlertBanner>{errors.root.message}</AlertBanner>
        ) : null}

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              autoCapitalize="words"
              error={errors.name?.message}
              label="Full name"
              onChangeText={field.onChange}
              placeholder="Nimal Perera"
              value={field.value}
            />
          )}
        />

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
          name="email"
          render={({ field }) => (
            <Input
              error={errors.email?.message}
              hint="Optional — used for booking receipts."
              keyboardType="email-address"
              label="Email"
              onChangeText={field.onChange}
              placeholder="you@example.com"
              value={field.value ?? ''}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              error={errors.password?.message}
              hint="At least 6 characters."
              label="Password"
              onChangeText={field.onChange}
              secureTextEntry
              value={field.value}
            />
          )}
        />

        <Button
          fullWidth
          label="Create account"
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/login')}
        style={styles.footerLink}
      >
        <Text style={styles.footerText}>
          Already registered? <Text style={styles.footerStrong}>Sign in</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  footerLink: { alignItems: 'center', paddingVertical: spacing.md },
  footerText: { fontSize: fontSize.sm, color: colors.slate500 },
  footerStrong: { color: colors.brand700, fontWeight: '700' },
});
