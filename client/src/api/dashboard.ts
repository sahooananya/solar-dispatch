import { apiClient, ApiSuccess } from './client';
import type { DashboardSummary } from '../types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const r = await apiClient.get<ApiSuccess<DashboardSummary>>('/dashboard/summary');
  return r.data.data;
}
