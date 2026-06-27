/* ─── Centralized API Client ─── */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '';

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const endpoint = `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch {
    throw new ApiError(0, null, 'Cannot connect to backend. Is the server running on port 8000?');
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const detail = (body as Record<string, unknown>)?.detail ?? (body as Record<string, unknown>)?.error ?? body;
    const message =
      typeof detail === 'string'
        ? detail
        : (detail as Record<string, string>)?.message ??
          `HTTP ${res.status}: ${res.statusText}`;
    throw new ApiError(res.status, detail, message);
  }

  if (!body && !text) {
    throw new ApiError(res.status, null, `Empty response from ${endpoint}`);
  }

  return body as T;
}

/**
 * Upload file via multipart/form-data (no Content-Type header — browser sets boundary)
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const endpoint = `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new ApiError(0, null, 'Cannot connect to backend. Is the server running on port 8000?');
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const detail = (body as Record<string, unknown>)?.detail ?? body;
    const message =
      typeof detail === 'string'
        ? detail
        : (detail as Record<string, string>)?.message ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, detail, message);
  }

  return body as T;
}
