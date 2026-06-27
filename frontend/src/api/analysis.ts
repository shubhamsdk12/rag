import { apiClient } from './client';
import type { GraphData, AuditCertificate } from '../types';

export async function getGraphData(documentId: string): Promise<GraphData> {
  return apiClient<GraphData>(`/api/v1/graph/${documentId}`);
}

export async function generateAuditReport(sessionId: string): Promise<AuditCertificate> {
  return apiClient<AuditCertificate>(`/api/v1/repair/certify/${sessionId}`, {
    method: 'POST',
  });
}
