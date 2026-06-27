/**
 * Formatting utilities for timestamps, currency, percentage.
 */

export function formatDate(isoString: string | Date | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(isoString);
  }
}

export function formatCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '—';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return String(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
}

export function formatPercentage(rate: number | undefined): string {
  if (rate === undefined || rate === null) return '—';
  // If rate is between 0 and 1, multiply by 100
  const adjusted = rate <= 1 && rate > 0 ? rate * 100 : rate;
  return `${Math.round(adjusted)}%`;
}
