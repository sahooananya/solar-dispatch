import { apiClient, ApiSuccess, Pagination } from './client';
import type { Product, StockMovement } from '../types';

export async function listProducts(params: {
  page?: number; limit?: number; search?: string; category?: string; lowStock?: 'true' | 'false';
}): Promise<{ data: Product[]; pagination: Pagination }> {
  const r = await apiClient.get<ApiSuccess<Product[]>>('/products', { params });
  return { data: r.data.data, pagination: r.data.pagination! };
}

export async function getProduct(id: string): Promise<Product> {
  const r = await apiClient.get<ApiSuccess<Product>>(`/products/${id}`);
  return r.data.data;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const r = await apiClient.post<ApiSuccess<Product>>('/products', payload);
  return r.data.data;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const r = await apiClient.patch<ApiSuccess<Product>>(`/products/${id}`, payload);
  return r.data.data;
}

export async function listMovements(productId: string): Promise<StockMovement[]> {
  const r = await apiClient.get<ApiSuccess<StockMovement[]>>(`/products/${productId}/movements`);
  return r.data.data;
}

export async function createMovement(productId: string, payload: { movementType: 'IN' | 'OUT'; quantity: number; reason: string }): Promise<StockMovement> {
  const r = await apiClient.post<ApiSuccess<StockMovement>>(`/products/${productId}/movements`, payload);
  return r.data.data;
}

export async function listAllMovements(page = 1, limit = 20): Promise<{ data: StockMovement[]; pagination: Pagination }> {
  const r = await apiClient.get<ApiSuccess<StockMovement[]>>('/stock-movements', { params: { page, limit } });
  return { data: r.data.data, pagination: r.data.pagination! };
}
