import { apiClient } from './client';
import type { KnowledgeEntry, KnowledgeInitStatus } from '../types';

export async function getKnowledgeEntries(
  category?: string
): Promise<{ entries: KnowledgeEntry[]; total: number; auto_learned: number; last_indexed: string; model: string }> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiClient(`/api/v1/knowledge/entries${params}`);
}

export async function searchKnowledge(
  query: string
): Promise<{ entries: KnowledgeEntry[]; total: number; auto_learned: number; last_indexed: string; model: string }> {
  return apiClient(`/api/v1/knowledge/search?q=${encodeURIComponent(query)}`);
}

export async function getKnowledgeInitStatus(): Promise<KnowledgeInitStatus> {
  return apiClient<KnowledgeInitStatus>('/api/v1/knowledge/init/status');
}

export async function initializeRuleset(rulesetId: string): Promise<void> {
  await apiClient(`/api/v1/knowledge/init/${rulesetId}`, { method: 'POST' });
}
