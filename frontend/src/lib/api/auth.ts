import { apiClient } from './client';

export const authApi = {
  loginWithGoogle: async (idToken: string) => {
    const response = await apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
    return response.json();
  },

  completeProfile: async (role: string, phone: string) => {
    const response = await apiClient('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ role, phone_whatsapp: phone }),
    });
    return response.json();
  },

  refresh: async () => {
    const response = await apiClient('/auth/refresh', {
      method: 'POST',
    });
    return response.json();
  },

  getMe: async () => {
    const response = await apiClient('/auth/me', {
      method: 'GET',
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
