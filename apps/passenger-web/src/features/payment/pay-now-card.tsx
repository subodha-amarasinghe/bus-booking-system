'use client';

import {
  PaymentSchema,
  PaymentStatus,
  ProcessOnlinePaymentRequestSchema,
} from '@bus-booking/shared-types';
import { ArrowRight, CreditCard, ShieldCheck, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '../../lib/format';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';

type Phase = 'idle' | 'paying' | 'paid';

export function PayNowCard({
  bookingId,
  userId,
  amount,
  currency,
}: {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  async function pay() {
    setError('');
    const payload = ProcessOnlinePaymentRequestSchema.safeParse({
      bookingId,
      userId,
      amount,
      currency,
    });
    if (!payload.success) {
      setError('This payment request is incomplete. Open it from My bookings.');
      return;
    }

    setPhase('paying');
    try {
      const response = await fetch('/api/payments/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message ?? 'The payment could not be completed.');
        setPhase('idle');
        return;
      }
      const payment = PaymentSchema.partial().safeParse(body);
      if (payment.success && payment.data.status === PaymentStatus.FAILED) {
        setError(payment.data.failureReason ?? 'The payment was declined.');
        setPhase('idle');
        return;
      }
      setReference(payment.data?.providerRef ?? '');
      setPhase('paid');
    } catch {
      setError('We could not reach the payment service. Please try again.');
      setPhase('idle');
    }
  }

  if (phase === 'paid') {
    return (
      <section className="ui-card space-y-4">
        <AlertBanner tone="success">
          Payment received. Your seats are confirmed.
        </AlertBanner>
        {reference && (
          <p className="text-xs text-slate-500">
            Reference <span className="font-mono">{reference}</span>
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="ui-btn-primary min-h-[48px] w-full sm:w-auto" href="/bookings">
            <Ticket aria-hidden="true" className="h-4 w-4" />
            View my bookings
          </Link>
          <Link className="ui-btn-ghost min-h-[48px] w-full sm:w-auto" href="/search">
            Book another trip
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-card space-y-4">
      <dl className="flex items-end justify-between gap-3">
        <div>
          <dt className="text-sm text-slate-500">Amount due</dt>
          <dd className="text-3xl font-bold tracking-tight text-slate-900">
            {formatMoney(amount, currency)}
          </dd>
        </div>
        <dd className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Secured checkout
        </dd>
      </dl>

      {error && <AlertBanner>{error}</AlertBanner>}

      <button
        className="ui-btn-primary min-h-[48px] w-full"
        disabled={phase === 'paying'}
        onClick={pay}
        type="button"
      >
        {phase === 'paying' ? (
          <Spinner />
        ) : (
          <CreditCard aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
        {phase === 'paying' ? 'Processing…' : `Pay ${formatMoney(amount, currency)}`}
      </button>

      <p className="text-xs text-slate-500">
        Your card details never touch this app — the request is signed and
        forwarded by the payment service.
      </p>
    </section>
  );
}
