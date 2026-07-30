'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import type { z } from 'zod';
import { Banknote, Calculator, Ticket, Wallet } from 'lucide-react';
import {
  CalculateRefundRequestSchema,
  CancellationRequestSchema,
  RecordOfflinePaymentRequestSchema,
  type Payment,
  type Refund,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { Field } from '../../components/Field';
import { Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { errorMessage, postJson } from '../../lib/client-api';
import { formatMoney } from '../../lib/format';

const RefundQuoteFormSchema = CalculateRefundRequestSchema.pick({
  bookingId: true,
});

/** The gateway fills these in from defaults; the form always sends a value. */
const OfflinePaymentFormSchema = RecordOfflinePaymentRequestSchema.extend({
  currency: RecordOfflinePaymentRequestSchema.shape.currency.removeDefault(),
  method: RecordOfflinePaymentRequestSchema.shape.method.removeDefault(),
});

type CancellationFormValues = z.infer<typeof CancellationRequestSchema>;
type RefundQuoteFormValues = z.infer<typeof RefundQuoteFormSchema>;
type OfflinePaymentFormValues = z.infer<typeof OfflinePaymentFormSchema>;

/** Modification-service returns the cancellation record plus the refund it raised. */
interface CancellationResult {
  cancellation: { id: string; status: string };
  refund: Refund;
}

interface RefundQuote {
  bookingId: string;
  amount: number;
  currency: string;
  percentage: number;
}

const METHOD_LABELS: Record<string, string> = {
  OFFLINE: 'Offline / bank transfer',
  CASH: 'Cash at counter',
  CARD: 'Card at counter',
};

function CancellationForm() {
  const [result, setResult] = useState<CancellationResult | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancellationFormValues>({
    resolver: zodResolver(CancellationRequestSchema),
  });

  const requestCancellation = useMutation({
    mutationFn: (values: CancellationFormValues) =>
      postJson<CancellationResult>('/api/cancellations/request', values),
    onSuccess: (data) => {
      setResult(data);
      reset();
    },
  });

  return (
    <SectionCard
      title="Cancel a booking"
      description="Cancels the seat and raises the refund in one step."
      icon={Ticket}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          setResult(null);
          requestCancellation.mutate(values);
        })}
      >
        <Field
          label="Booking ID"
          htmlFor="cancelBookingId"
          error={errors.bookingId ? 'Enter a valid booking ID (UUID).' : undefined}
        >
          <input
            id="cancelBookingId"
            className="ui-input font-mono text-xs"
            placeholder="60000000-0000-4000-8000-000000000001"
            {...register('bookingId')}
          />
        </Field>

        <Field
          label="Passenger user ID"
          htmlFor="cancelUserId"
          error={errors.userId ? 'Enter a valid user ID (UUID).' : undefined}
        >
          <input
            id="cancelUserId"
            className="ui-input font-mono text-xs"
            placeholder="a0000000-0000-4000-8000-000000000003"
            {...register('userId')}
          />
        </Field>

        <Field label="Reason" htmlFor="cancelReason" hint="Optional, but helpful for audits.">
          <textarea
            id="cancelReason"
            rows={3}
            className="ui-input"
            placeholder="Passenger changed travel date"
            {...register('reason')}
          />
        </Field>

        {requestCancellation.isError ? (
          <ErrorAlert message={errorMessage(requestCancellation.error)} />
        ) : null}
        {result ? (
          <div className="space-y-2">
            <SuccessAlert
              message={`Booking cancelled and a refund of ${formatMoney(
                result.refund.amount,
                result.refund.currency,
              )} was raised.`}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge status={result.cancellation.status} />
              <StatusBadge status={result.refund.status} />
              <span className="font-mono">Refund {result.refund.id}</span>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          className="ui-btn-danger"
          disabled={requestCancellation.isPending}
        >
          {requestCancellation.isPending ? <Spinner /> : null}
          {requestCancellation.isPending ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </form>
    </SectionCard>
  );
}

function RefundQuoteForm() {
  const [quote, setQuote] = useState<RefundQuote | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RefundQuoteFormValues>({
    resolver: zodResolver(RefundQuoteFormSchema),
  });

  const calculate = useMutation({
    mutationFn: (values: RefundQuoteFormValues) =>
      postJson<RefundQuote>('/api/cancellations/refund/calculate', values),
    onSuccess: setQuote,
  });

  return (
    <SectionCard
      title="Quote a refund"
      description="Check what a passenger would get back before you cancel anything."
      icon={Calculator}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          setQuote(null);
          calculate.mutate(values);
        })}
      >
        <Field
          label="Booking ID"
          htmlFor="quoteBookingId"
          error={errors.bookingId ? 'Enter a valid booking ID (UUID).' : undefined}
        >
          <input
            id="quoteBookingId"
            className="ui-input font-mono text-xs"
            placeholder="60000000-0000-4000-8000-000000000001"
            {...register('bookingId')}
          />
        </Field>

        {calculate.isError ? (
          <ErrorAlert message={errorMessage(calculate.error)} />
        ) : null}
        {quote ? (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Refund amount
              </dt>
              <dd className="text-lg font-semibold text-slate-900">
                {formatMoney(quote.amount, quote.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Share of fare
              </dt>
              <dd className="text-lg font-semibold text-slate-900">
                {quote.percentage}%
              </dd>
            </div>
          </dl>
        ) : null}

        <button
          type="submit"
          className="ui-btn-secondary"
          disabled={calculate.isPending}
        >
          {calculate.isPending ? <Spinner /> : <Calculator className="h-4 w-4" aria-hidden />}
          {calculate.isPending ? 'Calculating…' : 'Calculate refund'}
        </button>
      </form>
    </SectionCard>
  );
}

function OfflinePaymentForm() {
  const [saved, setSaved] = useState<Payment | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfflinePaymentFormValues>({
    resolver: zodResolver(OfflinePaymentFormSchema),
    defaultValues: { currency: 'LKR', method: 'CASH' },
  });

  const recordPayment = useMutation({
    mutationFn: (values: OfflinePaymentFormValues) =>
      postJson<Payment>('/api/payments/offline', values),
    onSuccess: (payment) => {
      setSaved(payment);
      reset({ currency: 'LKR', method: 'CASH' });
    },
  });

  return (
    <SectionCard
      title="Record an offline payment"
      description="Log cash or card payments taken at the counter against a booking."
      icon={Wallet}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          setSaved(null);
          recordPayment.mutate(values);
        })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Booking ID"
            htmlFor="paymentBookingId"
            error={errors.bookingId ? 'Enter a valid booking ID (UUID).' : undefined}
          >
            <input
              id="paymentBookingId"
              className="ui-input font-mono text-xs"
              {...register('bookingId')}
            />
          </Field>
          <Field
            label="Passenger user ID"
            htmlFor="paymentUserId"
            error={errors.userId ? 'Enter a valid user ID (UUID).' : undefined}
          >
            <input
              id="paymentUserId"
              className="ui-input font-mono text-xs"
              {...register('userId')}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]">
          <Field
            label="Amount"
            htmlFor="paymentAmount"
            error={errors.amount ? 'Enter an amount above zero.' : undefined}
          >
            <input
              id="paymentAmount"
              type="number"
              min={0}
              step="any"
              className="ui-input"
              {...register('amount', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Currency" htmlFor="paymentCurrency">
            <input
              id="paymentCurrency"
              className="ui-input uppercase"
              {...register('currency')}
            />
          </Field>
          <Field label="Method" htmlFor="paymentMethod">
            <select
              id="paymentMethod"
              className="ui-select"
              {...register('method')}
            >
              {OfflinePaymentFormSchema.shape.method.options.map((method) => (
                <option key={method} value={method}>
                  {METHOD_LABELS[method] ?? method}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Receipt number" htmlFor="receiptNo" hint="Optional.">
            <input id="receiptNo" className="ui-input" {...register('receiptNo')} />
          </Field>
          <Field label="Notes" htmlFor="paymentNotes" hint="Optional.">
            <input id="paymentNotes" className="ui-input" {...register('notes')} />
          </Field>
        </div>

        {recordPayment.isError ? (
          <ErrorAlert message={errorMessage(recordPayment.error)} />
        ) : null}
        {saved ? (
          <SuccessAlert
            message={`Recorded ${formatMoney(saved.amount, saved.currency)} against booking ${saved.bookingId}.`}
          />
        ) : null}

        <button
          type="submit"
          className="ui-btn-primary"
          disabled={recordPayment.isPending}
        >
          {recordPayment.isPending ? <Spinner /> : <Banknote className="h-4 w-4" aria-hidden />}
          {recordPayment.isPending ? 'Recording…' : 'Record payment'}
        </button>
      </form>
    </SectionCard>
  );
}

export function CancellationRefundPage() {
  return (
    <>
      <PageHeader
        title="Cancellations & refunds"
        description="Handle counter requests: quote a refund, cancel a booking, or log a payment taken in person."
        icon={Ticket}
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <CancellationForm />
          <RefundQuoteForm />
        </div>
        <OfflinePaymentForm />
      </div>
    </>
  );
}
