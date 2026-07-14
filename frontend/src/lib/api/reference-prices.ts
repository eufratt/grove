import { apiClient } from './client';

export const referencePricesApi = {
  getReferencePrices: async (page = 1, limit = 20, commodity?: string, search?: string) => {
    let url = `/reference-prices?page=${page}&limit=${limit}`;
    if (commodity && commodity !== 'ALL') {
      url += `&commodity=${encodeURIComponent(commodity)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await apiClient(url, {
      method: 'GET',
    });
    return response.json();
  },
};
