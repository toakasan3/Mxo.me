/**
 * Returns the full URL for an API path, prefixing with NEXT_PUBLIC_API_URL
 * when the frontend and backend are deployed separately.
 *
 * In local development without a separate backend, calls fall back to the
 * Next.js API routes at the same origin (empty prefix).
 *
 * @example
 *   apiUrl('/api/boards')         // → 'https://api.example.com/api/boards'
 *   apiUrl('/api/elements?board=ABC123')
 */
export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  return `${base}${path}`;
}
