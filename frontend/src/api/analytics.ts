import { apiClient } from './client';
import type { AnalyticsSummary } from '../types';

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiClient<AnalyticsSummary>('/api/v1/analytics/summary');
}
