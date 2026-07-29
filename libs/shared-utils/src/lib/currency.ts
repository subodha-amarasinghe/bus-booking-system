/**
 * Formats a numeric amount as Sri Lankan Rupees, e.g. "LKR 1,234.00"
 */
export function formatLkr(amount: number): string {
  const formatted = amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `LKR ${formatted}`;
}
