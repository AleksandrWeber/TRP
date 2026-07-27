/**
 * Single UTC timestamp formatter for the web app.
 * Input: ISO-8601 (or Date-parseable) string / number / Date.
 */

export function formatUtc(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const iso = date.toISOString(); // always UTC
  // 2026-07-27T10:15:30.123Z → 2026-07-27 10:15:30 UTC
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}
