import { apiClient } from './client';

export const productsApi = {
  createProduct: async (formData: FormData) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/products`, {
      method: 'POST',
      body: formData,
      // Note: Do not set Content-Type header when sending FormData, 
      // the browser will set it automatically with the boundary
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    return response.json();
  },

  getProducts: async (skip = 0, limit = 20) => {
    const response = await apiClient(`/products?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    return response.json();
  },

  getProductById: async (id: string) => {
    const response = await apiClient(`/products/${id}`, {
      method: 'GET',
    });
    return response.json();
  },

  getNearbyProducts: async (lat: number, lng: number, radiusKm: number) => {
    const response = await apiClient(`/products/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`, {
      method: 'GET',
    });
    return response.json();
  },

  updateProduct: async (id: string, data: any) => {
    const response = await apiClient(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
