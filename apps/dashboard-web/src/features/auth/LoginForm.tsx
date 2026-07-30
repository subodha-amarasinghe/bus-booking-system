'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import {
  LoginRequestSchema,
  type LoginRequest,
} from '@bus-booking/shared-types';
import { ErrorAlert } from '../../components/Alerts';
import { Field } from '../../components/Field';
import { Spinner } from '../../components/LoadingBlock';
import { errorMessage, postJson } from '../../lib/client-api';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { phone: '', password: '' },
  });

  async function onSubmit(values: LoginRequest) {
    setError(null);
    try {
      await postJson('/api/auth/login', values);
    } catch (cause) {
      setError(errorMessage(cause));
      return;
    }
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field
        label="Phone number"
        htmlFor="phone"
        error={errors.phone ? 'Enter the phone number on your staff account.' : undefined}
      >
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          className="ui-input"
          placeholder="0770000001"
          {...register('phone')}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password ? 'Enter your password.' : undefined}
      >
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="ui-input"
          placeholder="••••••••"
          {...register('password')}
        />
      </Field>

      {error ? <ErrorAlert message={error} /> : null}

      <button
        type="submit"
        className="ui-btn-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Spinner /> : <LogIn className="h-4 w-4" aria-hidden />}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
