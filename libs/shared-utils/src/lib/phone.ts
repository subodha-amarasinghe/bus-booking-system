/**
 * Normalizes Sri Lankan phone numbers to E.164 format: +94XXXXXXXXX
 */
export function formatLkPhone(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (digits.startsWith('94') && digits.length === 11) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `+94${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+94${digits}`;
  }

  if (input.trim().startsWith('+94') && digits.length === 11) {
    return `+${digits}`;
  }

  throw new Error(`Invalid Sri Lankan phone number: ${input}`);
}
