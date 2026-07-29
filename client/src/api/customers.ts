import { apiClient, ApiSuccess, Pagination } from './client';
import type { Customer, FollowUp } from '../types';

export async function listCustomers(params: {
  page?: number; limit?: number; search?: string; customerType?: string; status?: string;
}): Promise<{ data: Customer[]; pagination: Pagination }> {
  const r = await apiClient.get<ApiSuccess<Customer[]>>('/customers', { params });
  return { data: r.data.data, pagination: r.data.pagination! };
}

export async function getCustomer(id: string): Promise<Customer> {
  const r = await apiClient.get<ApiSuccess<Customer>>(`/customers/${id}`);
  return r.data.data;
}

export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  const r = await apiClient.post<ApiSuccess<Customer>>('/customers', payload);
  return r.data.data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
  const r = await apiClient.patch<ApiSuccess<Customer>>(`/customers/${id}`, payload);
  return r.data.data;
}

export async function createFollowUp(customerId: string, payload: {
  note: string; followUpType?: string; nextFollowUpDate?: string | null;
}): Promise<FollowUp> {
  const r = await apiClient.post<ApiSuccess<FollowUp>>(`/customers/${customerId}/follow-ups`, payload);
  return r.data.data;
}
