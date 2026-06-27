import { apiClient, apiUpload } from './client';
import type { DocumentSummary, IngestResponse } from '../types';

export async function getRecentDocuments(limit: number = 10): Promise<DocumentSummary[]> {
  const res = await apiClient<{ documents: DocumentSummary[] }>(
    `/api/v1/documents/recent?limit=${limit}`
  );
  return res.documents;
}

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<IngestResponse>('/api/v1/ingest', formData);
}
