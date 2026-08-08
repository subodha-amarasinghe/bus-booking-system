'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  RegisterRequestSchema,
  type RegisterRequest,
} from '@bus-booking/shared-types';
import { UserRoundPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';

export function RegisterForm({ next }: { next: string }) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: { name: '', phone: '', password: '' },
  });

  async function submit(values: RegisterRequest) {
    setError('');
    const payload = { ...values, email: values.email || undefined };
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.message ?? 'We could not create your account.');
      return;
    }
    window.location.assign(next || '/');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div>
        <label className="ui-label" htmlFor="name">
          Full name
        </label>
        <input
          autoComplete="name"
          className="ui-input min-h-[48px]"
          id="name"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Tell us your name.</p>
        )}
      </div>

      <div>
        <label className="ui-label" htmlFor="phone">
          Mobile number
        </label>
        <input
          autoComplete="tel"
          className="ui-input min-h-[48px]"
          id="phone"
          inputMode="tel"
          placeholder="07XXXXXXXX"
          {...register('phone')}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Enter a mobile number.</p>
        )}
      </div>

      <div>
        <label className="ui-label" htmlFor="email">
          Email <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <input
          autoComplete="email"
          className="ui-input min-h-[48px]"
          id="email"
          type="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            That email address looks incorrect.
          </p>
        )}
      </div>

      <div>
        <label className="ui-label" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="new-password"
          className="ui-input min-h-[48px]"
          id="password"
          type="password"
          {...register('password')}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 6 characters.</p>
        {errors.password && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            Use a password with at least 6 characters.
          </p>
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
          <UserRoundPlus aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
