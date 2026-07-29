import { apiClient, ApiSuccess, Pagination } from './client';
import type { Challan } from '../types';

export async function listChallans(params: {
  page?: number; limit?: number; status?: string; customerId?: string; search?: string;
}): Promise<{ data: Challan[]; pagination: Pagination }> {
  const r = await apiClient.get<ApiSuccess<Challan[]>>('/challans', { params });
  return { data: r.data.data, pagination: r.data.pagination! };
}

export async function getChallan(id: string): Promise<Challan> {
  const r = await apiClient.get<ApiSuccess<Challan>>(`/challans/${id}`);
  return r.data.data;
}

export interface CreateChallanPayload {
  customerId: string;
  deliveryAddress: string;
  dispatchNotes?: string;
  installationSiteName?: string;
  projectReference?: string;
  proposedSystemCapacityKw?: number | null;
  expectedDispatchDate?: string | null;
  items: { productId: string; quantity: number }[];
}

export async function createChallan(payload: CreateChallanPayload): Promise<Challan> {
  const r = await apiClient.post<ApiSuccess<Challan>>('/challans', payload);
  return r.data.data;
}

export async function confirmChallan(id: string): Promise<Challan> {
  const r = await apiClient.post<ApiSuccess<Challan>>(`/challans/${id}/confirm`);
  return r.data.data;
}

export async function cancelChallan(id: string): Promise<Challan> {
  const r = await apiClient.post<ApiSuccess<Challan>>(`/challans/${id}/cancel`);
  return r.data.data;
}
