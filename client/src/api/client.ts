import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const normalizedBase = rawBase.replace(/\/+$/, '').replace(/\/api$/, '');

export const apiClient = axios.create({
  baseURL: normalizedBase ? `${normalizedBase}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sd_token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem('sd_token')) {
      localStorage.removeItem('sd_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export interface ApiSuccess<T> { success: true; data: T; pagination?: Pagination }
export interface ApiError { success: false; error: { code: string; message: string; fieldErrors: Record<string, string[]> | null } }
export interface Pagination { page: number; limit: number; totalItems: number; totalPages: number }

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as { response?: { data?: ApiError } };
  return e?.response?.data?.error?.message || (err as Error)?.message || fallback;
}
