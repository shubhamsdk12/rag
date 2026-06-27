import { apiClient } from './client';
import type {
  RepairSession,
  QueueResponse,
  AuditCertificate,
  GlobalQueueAction,
} from '../types';

export async function startRepair(documentId: string): Promise<RepairSession> {
  return apiClient<RepairSession>('/api/v1/repair/start', {
    method: 'POST',
    body: JSON.stringify({ document_id: documentId }),
  });
}

export async function getQueue(sessionId: string): Promise<QueueResponse> {
  return apiClient<QueueResponse>(`/api/v1/repair/queue/${sessionId}`);
}

export async function getGlobalQueue(): Promise<{ total_pending: number; actions: GlobalQueueAction[] }> {
  return apiClient<{ total_pending: number; actions: GlobalQueueAction[] }>('/api/v1/repair/queue/all');
}

export async function getQueueCount(): Promise<{ count: number }> {
  return apiClient<{ count: number }>('/api/v1/repair/queue/active-count');
}

export async function approveAction(
  sessionId: string,
  errorId: string,
  reviewer: string
): Promise<void> {
  await apiClient(`/api/v1/repair/approve/${sessionId}/${errorId}`, {
    method: 'POST',
    body: JSON.stringify({ reviewer }),
  });
}

export async function rejectAction(
  sessionId: string,
  errorId: string,
  reviewer: string,
  reason?: string
): Promise<void> {
  await apiClient(`/api/v1/repair/reject/${sessionId}/${errorId}`, {
    method: 'POST',
    body: JSON.stringify({ reviewer, reason }),
  });
}

export async function certifySession(sessionId: string): Promise<AuditCertificate> {
  return apiClient<AuditCertificate>(`/api/v1/repair/certify/${sessionId}`, {
    method: 'POST',
  });
}
