export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let message = errorData.message;
      
      if (!message) {
        if (typeof errorData.detail === 'string') {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          message = errorData.detail.map((d: any) => {
            const loc = Array.isArray(d.loc) ? d.loc.join('.') : (d.loc || '');
            return loc ? `${loc}: ${d.msg}` : d.msg;
          }).join(', ');
        } else {
          message = `API error: ${response.status}`;
        }
      }
      
      throw new ApiError(message, response.status, errorData);
    }

    return response;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'Koneksi ke server gagal. Pastikan server backend Anda berjalan dan terhubung.',
      0,
      { originalError: err.message }
    );
  }
}
