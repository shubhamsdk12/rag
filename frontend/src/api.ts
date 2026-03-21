const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '/api';

type ParsedBody = { kind: 'empty' | 'json' | 'text'; value: unknown };

async function readBody(res: Response): Promise<ParsedBody> {
  const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
  const raw = await res.text();
  if (!raw.trim()) return { kind: 'empty', value: null };

  if (contentType.includes('application/json')) {
    try {
      return { kind: 'json', value: JSON.parse(raw) };
    } catch {
      return { kind: 'text', value: 'Server returned invalid JSON.' };
    }
  }

  return { kind: 'text', value: raw };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const endpoint = `${BASE}${url}`;
  const res = await fetch(endpoint, init);
  const parsed = await readBody(res);
  const body = parsed.value;

  if (!res.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    const message =
      (detail as { message?: string } | undefined)?.message ??
      (typeof detail === 'string' ? detail : undefined) ??
      (typeof body === 'string' ? body : undefined) ??
      `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  if (parsed.kind === 'empty') {
    throw new Error(`Empty response from ${endpoint}. Check backend route and deployment logs.`);
  }

  if (parsed.kind !== 'json') {
    throw new Error(`Expected JSON from ${endpoint}, got ${res.headers.get('content-type') || 'unknown content-type'}.`);
  }

  return body as T;
}

function fileForm(name: string, file: File): FormData {
  const fd = new FormData();
  fd.append(name, file);
  return fd;
}

/* ─── Parse ─── */
export async function parseFile(file: File) {
  return request<import('./types').ParseResponse>('/parse', {
    method: 'POST',
    body: fileForm('file', file),
  });
}

/* ─── Validate ─── */
export async function validateFile(file: File) {
  return request<import('./types').ValidateResponse>('/validate', {
    method: 'POST',
    body: fileForm('file', file),
  });
}

/* ─── Reconcile ─── */
export async function reconcileFiles(claimFile: File, remittanceFile: File) {
  const fd = new FormData();
  fd.append('claim_file', claimFile);
  fd.append('remittance_file', remittanceFile);
  return request<import('./types').ReconciliationReport>('/reconcile', {
    method: 'POST',
    body: fd,
  });
}

/* ─── Delta ─── */
export async function deltaFiles(oldFile: File, newFile: File) {
  const fd = new FormData();
  fd.append('old_file', oldFile);
  fd.append('new_file', newFile);
  return request<import('./types').DeltaReport>('/delta', {
    method: 'POST',
    body: fd,
  });
}

/* ─── AI Explain ─── */
export async function explainError(error: import('./types').ValidationError) {
  return request<import('./types').ExplainResponse>('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(error),
  });
}
