import { z } from 'zod';

/**
 * A single refund tier. Matching uses the highest `minHoursBeforeDeparture`
 * that is still ≤ hours remaining until departure.
 *
 * Refund math (first match wins):
 * - `noRefund` → 0
 * - `deductionAmount` → max(0, fare − deduction) per seat
 * - `refundPercent` → fare × percent / 100
 */
export const CancellationPolicyRuleSchema = z
  .object({
    minHoursBeforeDeparture: z.number().int().nonnegative(),
    /** Fixed cancellation fee deducted from the fare (LKR per seat). */
    deductionAmount: z.number().nonnegative().optional(),
    /** Share of fare returned when not using a fixed deduction. */
    refundPercent: z.number().int().min(0).max(100).optional(),
    /** Explicit zero-refund tier (e.g. within the cut-off window). */
    noRefund: z.boolean().optional(),
    /** Short window label shown to passengers. */
    label: z.string().min(1).max(160).optional(),
    /** Primary outcome line, e.g. "Refund after deducting LKR 300 per seat." */
    outcome: z.string().min(1).max(300).optional(),
    /** Extra terms, e.g. rescheduling availability. */
    notes: z.string().max(500).optional(),
  })
  .superRefine((rule, ctx) => {
    if (rule.noRefund) return;
    if (rule.deductionAmount === undefined && rule.refundPercent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set a deduction amount, a refund percent, or mark as no refund.',
        path: ['deductionAmount'],
      });
    }
  });
export type CancellationPolicyRule = z.infer<typeof CancellationPolicyRuleSchema>;

export const CancellationPolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  rules: z.array(CancellationPolicyRuleSchema).min(1),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;

export const UpsertCancellationPolicyRequestSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  rules: z.array(CancellationPolicyRuleSchema).min(1),
  isActive: z.boolean().default(true),
});
export type UpsertCancellationPolicyRequest = z.infer<
  typeof UpsertCancellationPolicyRequestSchema
>;

/** Empty body — returns the currently active policy (or null). */
export const GetCancellationPolicyRequestSchema = z.object({});
export type GetCancellationPolicyRequest = z.infer<
  typeof GetCancellationPolicyRequestSchema
>;

export function matchCancellationRule(
  rules: CancellationPolicyRule[],
  hoursBeforeDeparture: number,
): CancellationPolicyRule | undefined {
  const sorted = [...rules].sort(
    (a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture,
  );
  return sorted.find(
    (rule) => hoursBeforeDeparture >= rule.minHoursBeforeDeparture,
  );
}

export function resolveRefundFromRule(
  rule: CancellationPolicyRule | undefined,
  fareAmount: number,
): { amount: number; percentage: number; deductionAmount: number } {
  if (!rule || rule.noRefund) {
    return { amount: 0, percentage: 0, deductionAmount: fareAmount };
  }

  if (rule.deductionAmount !== undefined) {
    const amount = Math.max(
      0,
      Math.round((fareAmount - rule.deductionAmount) * 100) / 100,
    );
    const percentage =
      fareAmount > 0 ? Math.round((amount / fareAmount) * 100) : 0;
    return {
      amount,
      percentage,
      deductionAmount: rule.deductionAmount,
    };
  }

  const percentage = rule.refundPercent ?? 0;
  const amount = Math.round(fareAmount * (percentage / 100) * 100) / 100;
  return {
    amount,
    percentage,
    deductionAmount: Math.max(0, fareAmount - amount),
  };
}

/**
 * Resolves the refund for a cancellation made `hoursBeforeDeparture` hours
 * before the trip leaves.
 */
export function resolveRefundAmount(
  rules: CancellationPolicyRule[],
  hoursBeforeDeparture: number,
  fareAmount: number,
): { amount: number; percentage: number; deductionAmount: number } {
  return resolveRefundFromRule(
    matchCancellationRule(rules, hoursBeforeDeparture),
    fareAmount,
  );
}

/** @deprecated Prefer resolveRefundAmount — kept for callers that only need %. */
export function resolveRefundPercent(
  rules: CancellationPolicyRule[],
  hoursBeforeDeparture: number,
): number {
  return resolveRefundAmount(rules, hoursBeforeDeparture, 100).percentage;
}

export function formatRuleOutcome(
  rule: CancellationPolicyRule,
  currency = 'LKR',
): string {
  if (rule.outcome?.trim()) return rule.outcome.trim();
  if (rule.noRefund) return 'No refund.';
  if (rule.deductionAmount !== undefined) {
    return `Refund after deducting ${currency} ${rule.deductionAmount} per seat.`;
  }
  if (rule.refundPercent !== undefined) {
    return rule.refundPercent === 0
      ? 'No refund.'
      : `${rule.refundPercent}% of fare refunded.`;
  }
  return 'Refund terms apply.';
}
