'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterRequestSchema, type RegisterRequest } from '@bus-booking/shared-types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
  });

  async function submit(values: RegisterRequest) {
    setError('');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.message ?? 'Registration failed');
    router.replace('/profile');
    router.refresh();
  }

  return (
    <main>
      <section className="card auth-card">
        <h1>Create your account</h1>
        <form onSubmit={handleSubmit(submit)}>
          <label>Name<input autoComplete="name" {...register('name')} /></label>
          <label>Phone<input autoComplete="tel" {...register('phone')} /></label>
          <label>Email (optional)<input type="email" autoComplete="email" {...register('email')} /></label>
          <label>Password<input type="password" autoComplete="new-password" {...register('password')} /></label>
          {error && <p className="error">{error}</p>}
          <button disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="muted">Already registered? <Link href="/login">Sign in</Link>.</p>
      </section>
    </main>
  );
}
