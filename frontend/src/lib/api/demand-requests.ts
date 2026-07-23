import { apiClient } from './client';

export const demandRequestsApi = {
  createDemandRequest: async (data: {
    commodity_name: string;
    category: string;
    quantity_kg_needed: number;
    price_per_kg: number;
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

  getCommittedDemandRequests: async () => {
    const response = await apiClient('/demand-requests/committed', {
      method: 'GET',
    });
    return response.json();
  },
};

// WebSocket Hook for real-time status updates
import { useEffect, useState } from 'react';

export function useDemandSocket(id: string | null) {
  const [liveData, setLiveData] = useState<{
    quantity_kg_committed?: number;
    status?: string;
    num_petani_committed?: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/demand-requests/${id}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveData(data);
      } catch (err) {
        console.error('Failed to parse demand websocket message:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [id]);

  return liveData;
}
