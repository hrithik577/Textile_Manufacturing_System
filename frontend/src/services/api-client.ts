/**
 * Everest Textile OS - Central API Client Layer
 * Handles network requests, error states, and seamless fallback to typed simulated fixtures.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiResponse<T> {
  data: T;
  isSimulated: boolean;
  timestamp: string;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<{ data: T; isSimulated: boolean }> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Check if force demo mode is active in localStorage
  const isForceDemo = localStorage.getItem('everest_force_demo') === 'true';

  if (isForceDemo && fallbackData !== undefined) {
    // Artificial small latency for realistic UI state feel
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { data: fallbackData, isSimulated: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const token = localStorage.getItem('everest_auth_token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new ApiError(
        errorBody?.detail || errorBody?.message || `HTTP Error ${res.status}: ${res.statusText}`,
        res.status,
        errorBody
      );
    }

    const data = await res.json();
    return { data, isSimulated: false };
  } catch (err: any) {
    if (fallbackData !== undefined) {
      console.warn(`[Everest API] Backend endpoint ${endpoint} unavailable, falling back to simulated fixture.`);
      return { data: fallbackData, isSimulated: true };
    }
    throw new ApiError(err?.message || 'Network error communicating with Everest Backend', 503);
  }
}
