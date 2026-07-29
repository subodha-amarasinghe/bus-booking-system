'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LoginRequestSchema,
  type LoginRequest,
} from '@bus-booking/shared-types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  async function onSubmit(values: LoginRequest) {
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.message ?? 'Login failed');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 420 }}>
        <h1>Staff login</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="text" autoComplete="username" {...register('phone')} />
          {errors.phone && <p className="error">{errors.phone.message}</p>}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="error">{errors.password.message}</p>}

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
