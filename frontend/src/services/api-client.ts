/**
 * Everest Textile OS - Central API Client Layer
 * Handles network requests, explicit demo mode, and strict HTTP error propagation.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data?: any;
  isNetworkError: boolean;
  isTimeout: boolean;

  constructor(message: string, status: number, data?: any, isNetworkError = false, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

export interface ApiResponse<T> {
  data: T;
  isSimulated: boolean;
  timestamp: string;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  allowReadFallback?: boolean;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  fallbackData?: T
): Promise<{ data: T; isSimulated: boolean }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = (options.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // 1. Explicit Demo Mode check (user-selected demo mode in app settings)
  const isForceDemo = typeof localStorage !== 'undefined' && localStorage.getItem('everest_force_demo') === 'true';

  if (isForceDemo && fallbackData !== undefined) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { data: fallbackData, isSimulated: true };
  }

  const timeoutMs = options.timeoutMs ?? 4000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('everest_auth_token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;

    // Only for read-only queries in dev mode when backend is unreachable, optionally permit fallback if specified
    const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    if (!isMutation && fallbackData !== undefined && (options.allowReadFallback ?? isDev)) {
      console.warn(`[Everest API] Backend unreachable for read endpoint ${endpoint}. Returning marked simulated data.`);
      return { data: fallbackData, isSimulated: true };
    }

    if (isTimeout) {
      throw new ApiError(`Request timeout after ${timeoutMs}ms for ${endpoint}`, 504, null, false, true);
    }
    throw new ApiError(`Network connection error: Unable to reach backend at ${url}`, 503, null, true, false);
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Strict HTTP Error Propagation: Never fall back on 4xx / 5xx responses!
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message =
      errorBody?.detail ||
      errorBody?.message ||
      `HTTP Error ${res.status}: ${res.statusText || 'Request failed'}`;

    throw new ApiError(message, res.status, errorBody, false, false);
  }

  const data = await res.json();
  return { data, isSimulated: false };
}

