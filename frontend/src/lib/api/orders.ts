import { apiClient } from './client';

export const ordersApi = {
  createOrder: async (data: { product_id: string; quantity_kg: number }) => {
    const response = await apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getOrders: async () => {
    const response = await apiClient('/orders', {
      method: 'GET',
    });
    return response.json();
  },

  getIncomingOrders: async (skip = 0, limit = 20) => {
    const response = await apiClient(`/orders/incoming?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    return response.json();
  },

  getMyPurchases: async (skip = 0, limit = 20) => {
    const response = await apiClient(`/orders/my-purchases?skip=${skip}&limit=${limit}`, {
      method: 'GET',
    });
    return response.json();
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await apiClient(`/orders/${orderId}/status?status=${status}`, {
      method: 'PATCH',
    });
    return response.json();
  },
};

// WebSocket Hook for real-time status updates
import { useEffect, useState } from 'react';

export function useOrderSocket(orderId: string | null) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws/orders/${orderId}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status) {
        setStatus(data.status);
      }
    };

    return () => {
      socket.close();
    };
  }, [orderId]);

  return status;
}
