'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema, type LoginRequest } from '@bus-booking/shared-types';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { phone: '', password: '' },
  });

  async function submit(values: LoginRequest) {
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.message ?? 'We could not sign you in. Check your details.');
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div>
        <label className="ui-label" htmlFor="phone">
          Mobile number
        </label>
        <input
          autoComplete="username"
          className="ui-input min-h-[48px]"
          id="phone"
          inputMode="tel"
          placeholder="07XXXXXXXX"
          {...register('phone')}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Enter your mobile number.</p>
        )}
      </div>

      <div>
        <label className="ui-label" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="ui-input min-h-[48px]"
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Enter your password.</p>
        )}
      </div>

      {error && <AlertBanner>{error}</AlertBanner>}

      <button
        className="ui-btn-primary min-h-[48px] w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <Spinner />
        ) : (
          <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
