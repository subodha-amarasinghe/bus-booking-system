'use client';

import {
  PaymentStatus,
  ProcessOnlinePaymentRequestSchema,
  ProcessOnlinePaymentResponseSchema,
} from '@bus-booking/shared-types';
import { ArrowRight, CreditCard, ShieldCheck, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMoney } from '../../lib/format';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { Spinner } from '../../shared/components/LoadingBlock';

type Phase = 'idle' | 'paying' | 'paid';

const STRIPE_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12 / 34',
  cvc: '123',
  name: 'Test Passenger',
} as const;

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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  async function pay() {
    setError('');
    if (!(amount > 0)) {
      setError('Amount due is missing. Open this booking again from My bookings.');
      return;
    }
    const origin = window.location.origin;
    const payload = ProcessOnlinePaymentRequestSchema.safeParse({
      bookingId,
      userId,
      amount,
      currency,
      returnUrl: `${origin}/payment/${bookingId}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/payment/${bookingId}?status=cancelled`,
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
      const payment = ProcessOnlinePaymentResponseSchema.safeParse(body);
      const data = payment.success
        ? payment.data
        : (body as {
            status?: string;
            checkoutUrl?: string;
            providerRef?: string;
            failureReason?: string;
          });
      if (data.status === PaymentStatus.FAILED) {
        setError(data.failureReason ?? 'The payment was declined.');
        setPhase('idle');
        return;
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      // Local stub path when Stripe is not configured — payment already succeeded.
      setReference(data.providerRef ?? '');
      setPhase('paid');
      router.replace('/bookings');
      router.refresh();
    } catch {
      setError('We could not reach the payment service. Please try again.');
      setPhase('idle');
    }
  }

  if (phase === 'paid') {
    return (
      <section className="ui-card space-y-4">
        <AlertBanner tone="success">
          Payment received. Taking you to your bookings…
        </AlertBanner>
        {reference && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
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
          <dt className="text-sm text-slate-500 dark:text-slate-400">Amount due</dt>
          <dd className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatMoney(amount, currency)}
          </dd>
        </div>
        <dd className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Stripe Checkout
        </dd>
      </dl>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 dark:border-slate-600 dark:bg-slate-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Stripe test card
        </p>
        <dl className="mt-2 grid gap-1.5 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Card number</dt>
            <dd className="font-mono font-medium">{STRIPE_TEST_CARD.number}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Expiry</dt>
            <dd className="font-mono font-medium">{STRIPE_TEST_CARD.expiry}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">CVC</dt>
            <dd className="font-mono font-medium">{STRIPE_TEST_CARD.cvc}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="font-medium">{STRIPE_TEST_CARD.name}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Use these placeholders on Stripe Checkout after you click Pay. No real
          charge is made in test mode.
        </p>
      </div>

      {error && <AlertBanner>{error}</AlertBanner>}

      <button
        className="ui-btn-primary min-h-[48px] w-full"
        disabled={phase === 'paying' || !(amount > 0)}
        onClick={pay}
        type="button"
      >
        {phase === 'paying' ? (
          <Spinner />
        ) : (
          <CreditCard aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
        {phase === 'paying'
          ? 'Opening Stripe…'
          : `Pay ${formatMoney(amount, currency)}`}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Clicking Pay creates a Stripe Checkout session and redirects you to the
        hosted payment page. Card details never touch this app.
      </p>
    </section>
  );
}
