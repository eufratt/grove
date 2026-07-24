import { apiClient } from './client';

export const authApi = {
  loginWithGoogle: async (idToken: string) => {
    const response = await apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
    return response.json();
  },

  completeProfile: async (phone: string | null, lat?: number | null, lng?: number | null) => {
    const response = await apiClient('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({
        phone_whatsapp: phone,
        lat: lat ?? null,
        lng: lng ?? null
      }),
    });
    return response.json();
  },

  updateProfile: async (data: { 
    phone_whatsapp?: string | null; 
    phone_number?: string | null; 
    bio?: string | null; 
    theme_color?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  }) => {
    const response = await apiClient('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },


  upgradeToFarmer: async (phone: string) => {
    const response = await apiClient('/users/upgrade-to-farmer', {
      method: 'POST',
      body: JSON.stringify({
        phone_whatsapp: phone
      }),
    });
    return response.json();
  },

  updateLocation: async (lat: number, lng: number) => {
    const response = await apiClient('/users/me/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
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

  getUserById: async (id: string) => {
    const response = await apiClient(`/users/${id}`, {
      method: 'GET',
    });
    return response.json();
  },

  getFarmers: async (query?: string) => {
    const url = query 
      ? `/users?role=PETANI&q=${encodeURIComponent(query)}` 
      : '/users?role=PETANI';
    const response = await apiClient(url, {
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

