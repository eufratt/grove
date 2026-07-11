'use client';

import React, { useState, useEffect } from 'react';
import { ordersApi, useOrderSocket } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      
      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
            Transaksi
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Daftar Pesanan
          </h1>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order, index) => (
                <OrderCard key={order.id} order={order} index={index} onUpdate={fetchOrders} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <Package className="h-12 w-12 text-gr-text-primary/20 mb-4" />
            <span className="font-display text-2xl text-gr-text-primary/20">
              Belum ada pesanan
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order, index, onUpdate }: { order: any; index: number; onUpdate: () => void }) {
  // Connect to real-time status updates
  const liveStatus = useOrderSocket(order.id);
  const currentStatus = liveStatus || order.status;

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'dipesan': return { icon: Clock, color: 'text-gr-orange', label: 'Menunggu Konfirmasi' };
      case 'dikonfirmasi': return { icon: CheckCircle2, color: 'text-gr-green', label: 'Terkonfirmasi' };
      case 'siap_diambil': return { icon: Truck, color: 'text-gr-live', label: 'Siap Diambil' };
      case 'selesai': return { icon: CheckCircle2, color: 'text-gr-text-primary/40', label: 'Selesai' };
      case 'batal': return { icon: XCircle, color: 'text-gr-price-unfair', label: 'Dibatalkan' };
      default: return { icon: Package, color: 'text-gr-text-primary', label: status };
    }
  };

  const config = getStatusConfig(currentStatus);
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/5", config.color)}>
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                Order ID: {order.id.slice(0, 8)}
              </span>
              {liveStatus && (
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-live animate-pulse">
                  <span className="h-1 w-1 rounded-full bg-gr-live" />
                  Live
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-2xl font-medium text-gr-text-primary">
              {order.quantity_kg} KG Hasil Panen
            </h3>
            <p className="font-sans text-xs text-gr-text-primary/40 mt-1">
              Dipesan pada {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border border-current/20 bg-current/5", config.color)}>
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
              {config.label}
            </span>
          </div>
          
          {/* Action buttons could go here (e.g., WhatsApp seller) */}
          <Button variant="ghost" className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gr-green hover:bg-gr-green/10">
            Detail Pesanan
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
