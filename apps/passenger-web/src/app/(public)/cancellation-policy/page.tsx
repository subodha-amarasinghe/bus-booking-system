import { formatRuleOutcome } from '@bus-booking/shared-types';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';
import { getCancellationPolicy } from '../../../lib/cancellation-policy';
import { EmptyState } from '../../../shared/components/EmptyState';
import { PageHeader } from '../../../shared/components/PageHeader';

export const metadata = {
  title: 'Cancellation & Refund Policy · Bus Booking',
};
export const dynamic = 'force-dynamic';

export default async function CancellationPolicyPage() {
  const policy = await getCancellationPolicy();
  const rules = policy
    ? [...policy.rules].sort(
        (a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture,
      )
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/"
        backLabel="Home"
        subtitle="Booking Cancellation Policy"
        title={policy?.name ?? 'Cancellation & Refund Policy'}
      />

      {!policy ? (
        <EmptyState
          description="The operator has not published refund rules yet. Contact support if you need to cancel a trip."
          icon={ScrollText}
          title="Policy unavailable"
        />
      ) : (
        <section className="ui-card space-y-5">
          {policy.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {policy.description}
            </p>
          ) : null}

          <ul className="space-y-4">
            {rules.map((rule) => (
              <li
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 px-4 py-3"
                key={`${rule.minHoursBeforeDeparture}-${rule.outcome ?? ''}-${rule.label ?? ''}`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {rule.label ??
                    `At least ${rule.minHoursBeforeDeparture} hours before departure`}
                </p>
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">
                  {formatRuleOutcome(rule)}
                </p>
                {rule.notes ? (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{rule.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Refunds are based on the paid fare and the hours remaining until
            departure at the time you cancel. Processing times may vary by
            payment method.
          </p>

          <Link className="ui-btn-secondary min-h-[44px]" href="/bookings">
            Go to my bookings
          </Link>
        </section>
      )}
    </div>
  );
}
