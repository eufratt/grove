import { apiClient } from './client';

export const demandRequestsApi = {
  createDemandRequest: async (data: {
    commodity_name: string;
    category: string;
    quantity_kg_needed: number;
    deadline: string;
    latitude: number;
    longitude: number;
  }) => {
    const response = await apiClient('/demand-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getOpenDemandRequests: async () => {
    const response = await apiClient('/demand-requests', {
      method: 'GET',
    });
    return response.json();
  },

  getMyDemandRequests: async () => {
    const response = await apiClient('/demand-requests/mine', {
      method: 'GET',
    });
    return response.json();
  },

  getDemandRequestById: async (id: string) => {
    const response = await apiClient(`/demand-requests/${id}`, {
      method: 'GET',
    });
    return response.json();
  },

  commitSupply: async (id: string, quantityKg: number) => {
    const response = await apiClient(`/demand-requests/${id}/commit`, {
      method: 'POST',
      body: JSON.stringify({ quantity_kg: quantityKg }),
    });
    return response.json();
  },
};
