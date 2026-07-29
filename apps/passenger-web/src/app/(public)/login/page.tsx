'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema, type LoginRequest } from '@bus-booking/shared-types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  async function submit(values: LoginRequest) {
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.message ?? 'Login failed');
    router.replace('/bookings');
    router.refresh();
  }

  return (
    <main>
      <section className="card auth-card">
        <h1>Passenger login</h1>
        <form onSubmit={handleSubmit(submit)}>
          <label>Phone<input autoComplete="username" {...register('phone')} /></label>
          <label>Password<input type="password" autoComplete="current-password" {...register('password')} /></label>
          {error && <p className="error">{error}</p>}
          <button disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="muted">New passenger? <Link href="/register">Create an account</Link>.</p>
      </section>
    </main>
  );
}
