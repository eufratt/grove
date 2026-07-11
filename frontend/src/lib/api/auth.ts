import { apiClient } from './client';

export const authApi = {
  register: async (data: any) => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  login: async (data: any) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  refresh: async () => {
    const response = await apiClient('/auth/refresh', {
      method: 'POST',
    });
    return response.json();
  },

  logout: async () => {
    const response = await apiClient('/auth/logout', {
      method: 'POST',
    });
    return response.json();
  },
};
