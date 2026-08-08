'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { Plus, RefreshCw, Save, ScrollText, Trash2 } from 'lucide-react';
import {
  formatRuleOutcome,
  UpsertCancellationPolicyRequestSchema,
  UserRole,
  type CancellationPolicy,
  type CancellationPolicyRule,
} from '@bus-booking/shared-types';
import { ErrorAlert, SuccessAlert } from '../../components/Alerts';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { LoadingBlock, Spinner } from '../../components/LoadingBlock';
import { PageHeader } from '../../components/PageHeader';
import { RequireRole } from '../../components/RequireRole';
import { SectionCard } from '../../components/SectionCard';
import { errorMessage, getJson, postJson, queryKeys } from '../../lib/client-api';

const PolicyFormSchema = UpsertCancellationPolicyRequestSchema.extend({
  isActive: UpsertCancellationPolicyRequestSchema.shape.isActive.removeDefault(),
});
type PolicyFormValues = z.infer<typeof PolicyFormSchema>;

const DEFAULT_RULES: PolicyFormValues['rules'] = [
  {
    minHoursBeforeDeparture: 12,
    deductionAmount: 300,
    noRefund: false,
    label: 'More than 12 hours before departure',
    outcome: 'Refund after deducting LKR 300 per seat.',
    notes: '',
  },
  {
    minHoursBeforeDeparture: 6,
    deductionAmount: 350,
    noRefund: false,
    label: 'Between 12 to 6 hours before departure',
    outcome: 'Refund after deducting LKR 350 per seat.',
    notes: '',
  },
  {
    minHoursBeforeDeparture: 0,
    deductionAmount: undefined,
    noRefund: true,
    label: 'Less than 6 hours before departure',
    outcome: 'No refund.',
    notes:
      'One-time rescheduling available within 30 days, subject to seat availability.',
  },
];

function cleanRule(rule: PolicyFormValues['rules'][number]): CancellationPolicyRule {
  const noRefund = Boolean(rule.noRefund);
  return {
    minHoursBeforeDeparture: rule.minHoursBeforeDeparture,
    noRefund: noRefund || undefined,
    deductionAmount: noRefund
      ? undefined
      : Number.isFinite(rule.deductionAmount)
        ? rule.deductionAmount
        : undefined,
    refundPercent: noRefund
      ? undefined
      : Number.isFinite(rule.refundPercent)
        ? rule.refundPercent
        : undefined,
    label: rule.label?.trim() || undefined,
    outcome: rule.outcome?.trim() || undefined,
    notes: rule.notes?.trim() || undefined,
  };
}

function PolicyPreview({ policy }: { policy: CancellationPolicy }) {
  const rules = [...policy.rules].sort(
    (a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture,
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{policy.name}</p>
        {policy.description ? (
          <p className="mt-1 whitespace-pre-line text-sm text-slate-500">
            {policy.description}
          </p>
        ) : null}
      </div>
      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={`${rule.minHoursBeforeDeparture}-${rule.outcome ?? ''}-${rule.label ?? ''}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <p className="font-medium text-slate-800">
              {rule.label ?? `${rule.minHoursBeforeDeparture}+ hours before departure`}
            </p>
            <p className="mt-1 text-slate-600">{formatRuleOutcome(rule)}</p>
            {rule.notes ? (
              <p className="mt-1 text-xs text-slate-500">{rule.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CancellationPolicyPage() {
  const queryClient = useQueryClient();
  const [savedName, setSavedName] = useState<string | null>(null);

  const policyQuery = useQuery({
    queryKey: queryKeys.cancellationPolicy,
    queryFn: () => getJson<CancellationPolicy | null>('/api/cancellations/policy'),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<PolicyFormValues>({
    resolver: zodResolver(PolicyFormSchema),
    defaultValues: {
      name: 'Cancellation & Refund Policy',
      description:
        'Cancellations must be made at least 6 hours prior to the scheduled journey start time. Refunds will be processed based on the time of cancellation as follows:',
      isActive: true,
      rules: DEFAULT_RULES,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const watchedRules = watch('rules');

  useEffect(() => {
    const policy = policyQuery.data;
    if (!policy) return;
    reset({
      id: policy.id,
      name: policy.name,
      description: policy.description ?? '',
      isActive: policy.isActive,
      rules: policy.rules.map((rule) => ({
        ...rule,
        noRefund: Boolean(rule.noRefund),
        notes: rule.notes ?? '',
        outcome: rule.outcome ?? '',
        label: rule.label ?? '',
      })),
    });
  }, [policyQuery.data, reset]);

  const savePolicy = useMutation({
    mutationFn: (values: PolicyFormValues) =>
      postJson<CancellationPolicy>('/api/cancellations/policy', {
        ...values,
        description: values.description?.trim()
          ? values.description.trim()
          : undefined,
        rules: values.rules.map(cleanRule),
      }),
    onSuccess: async (policy) => {
      setSavedName(policy.name);
      reset({
        id: policy.id,
        name: policy.name,
        description: policy.description ?? '',
        isActive: policy.isActive,
        rules: policy.rules.map((rule) => ({
          ...rule,
          noRefund: Boolean(rule.noRefund),
          notes: rule.notes ?? '',
          outcome: rule.outcome ?? '',
          label: rule.label ?? '',
        })),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cancellationPolicy,
      });
    },
  });

  const policy = policyQuery.data;

  return (
    <>
      <PageHeader
        title="Cancellation policy"
        description="Set fixed cancellation fees by hours before departure. Passengers see this wording when they cancel."
        icon={ScrollText}
        actions={
          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() => policyQuery.refetch()}
            disabled={policyQuery.isFetching}
          >
            {policyQuery.isFetching ? (
              <Spinner />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SectionCard
          title="Policy setup"
          description="Add tiers from earliest cancellation to closest to departure. The highest matching hours threshold applies."
        >
          {policyQuery.isPending ? (
            <LoadingBlock label="Loading cancellation policy…" />
          ) : policyQuery.isError ? (
            <ErrorAlert message={errorMessage(policyQuery.error)} />
          ) : (
            <RequireRole allowed={[UserRole.ADMIN_STAFF]}>
              <form
                className="space-y-5"
                onSubmit={handleSubmit((values) => {
                  setSavedName(null);
                  savePolicy.mutate({ ...values, isActive: true });
                })}
              >
                <input type="hidden" {...register('id')} />

                <Field
                  label="Policy name"
                  htmlFor="policyName"
                  error={errors.name ? 'Enter a policy name.' : undefined}
                >
                  <input
                    id="policyName"
                    className="ui-input"
                    placeholder="Cancellation & Refund Policy"
                    {...register('name')}
                  />
                </Field>

                <Field
                  label="Intro text"
                  htmlFor="policyDescription"
                  hint="Shown above the refund tiers on the passenger site."
                  error={
                    errors.description
                      ? 'Keep the description under 2000 characters.'
                      : undefined
                  }
                >
                  <textarea
                    id="policyDescription"
                    rows={4}
                    className="ui-input"
                    placeholder="Cancellations must be made at least 6 hours prior…"
                    {...register('description')}
                  />
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Refund tiers
                    </h3>
                    <button
                      type="button"
                      className="ui-btn-ghost"
                      onClick={() =>
                        append({
                          minHoursBeforeDeparture: 0,
                          deductionAmount: 0,
                          noRefund: false,
                          label: '',
                          outcome: '',
                          notes: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Add tier
                    </button>
                  </div>

                  {errors.rules?.root || errors.rules?.message ? (
                    <ErrorAlert message="Add at least one refund tier." />
                  ) : null}

                  {fields.length === 0 ? (
                    <EmptyState
                      icon={ScrollText}
                      title="No tiers yet"
                      description="Add at least one tier so refunds can be calculated."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {fields.map((field, index) => {
                        const noRefund = Boolean(watchedRules?.[index]?.noRefund);
                        return (
                          <li
                            key={field.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                          >
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                              <Field
                                label="Min hours before departure"
                                htmlFor={`rule-hours-${index}`}
                                error={
                                  errors.rules?.[index]?.minHoursBeforeDeparture
                                    ? 'Enter 0 or more hours.'
                                    : undefined
                                }
                              >
                                <input
                                  id={`rule-hours-${index}`}
                                  type="number"
                                  min={0}
                                  step={1}
                                  className="ui-input"
                                  {...register(
                                    `rules.${index}.minHoursBeforeDeparture`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </Field>
                              <Field
                                label="Deduction (LKR / seat)"
                                htmlFor={`rule-deduction-${index}`}
                                error={
                                  errors.rules?.[index]?.deductionAmount
                                    ? 'Enter a deduction amount, or mark as no refund.'
                                    : undefined
                                }
                              >
                                <input
                                  id={`rule-deduction-${index}`}
                                  type="number"
                                  min={0}
                                  step="any"
                                  className="ui-input"
                                  disabled={noRefund}
                                  placeholder="300"
                                  {...register(`rules.${index}.deductionAmount`, {
                                    setValueAs: (value) =>
                                      value === '' ||
                                      value === null ||
                                      Number.isNaN(Number(value))
                                        ? undefined
                                        : Number(value),
                                  })}
                                />
                              </Field>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  className="ui-btn-ghost text-rose-700 hover:bg-rose-50"
                                  disabled={fields.length <= 1}
                                  onClick={() => remove(index)}
                                  aria-label={`Remove tier ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            </div>

                            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                {...register(`rules.${index}.noRefund`)}
                              />
                              No refund for this tier
                            </label>

                            <Field
                              className="mt-3"
                              label="Window label"
                              htmlFor={`rule-label-${index}`}
                            >
                              <input
                                id={`rule-label-${index}`}
                                className="ui-input"
                                placeholder="More than 12 hours before departure"
                                {...register(`rules.${index}.label`)}
                              />
                            </Field>

                            <Field
                              className="mt-3"
                              label="Outcome text"
                              htmlFor={`rule-outcome-${index}`}
                              hint="Passenger-facing sentence for this tier."
                            >
                              <input
                                id={`rule-outcome-${index}`}
                                className="ui-input"
                                placeholder={
                                  noRefund
                                    ? 'No refund.'
                                    : `Refund after deducting LKR ${watchedRules?.[index]?.deductionAmount ?? 300} per seat.`
                                }
                                {...register(`rules.${index}.outcome`)}
                              />
                            </Field>

                            <Field
                              className="mt-3"
                              label="Extra notes (optional)"
                              htmlFor={`rule-notes-${index}`}
                              hint="e.g. rescheduling terms."
                            >
                              <textarea
                                id={`rule-notes-${index}`}
                                rows={2}
                                className="ui-input"
                                placeholder="One-time rescheduling available within 30 days…"
                                {...register(`rules.${index}.notes`)}
                              />
                            </Field>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {savePolicy.isError ? (
                  <ErrorAlert message={errorMessage(savePolicy.error)} />
                ) : null}
                {savedName ? (
                  <SuccessAlert
                    message={`Saved “${savedName}”. Passengers will see the updated policy.`}
                  />
                ) : null}

                <button
                  type="submit"
                  className="ui-btn-primary"
                  disabled={savePolicy.isPending || (!isDirty && Boolean(policy))}
                >
                  {savePolicy.isPending ? (
                    <Spinner />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  {savePolicy.isPending ? 'Saving…' : 'Save policy'}
                </button>
              </form>
            </RequireRole>
          )}
        </SectionCard>

        <SectionCard
          title="Preview"
          description="How passengers will read the active policy."
        >
          {!policy && !policyQuery.isPending ? (
            <EmptyState
              icon={ScrollText}
              title="No active policy"
              description="Save a policy to publish refund rules on the passenger site."
            />
          ) : policy ? (
            <PolicyPreview policy={policy} />
          ) : (
            <LoadingBlock label="Loading preview…" />
          )}
        </SectionCard>
      </div>
    </>
  );
}
