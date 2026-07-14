const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  info?: any;

  constructor(message: string, status: number, info?: any) {
    super(message);
    this.status = status;
    this.info = info;
    this.name = 'ApiError';
  }
}

/**
 * Basic fetch wrapper for API calls.
 * Automatically attaches the base URL and includes credentials for JWT cookies.
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Basic error handling - can be expanded as needed
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.detail || `API error: ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  return response;
}
