'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, useOrderSocket } from '@/lib/api/orders';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'purchases'>('incoming');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  const loadOrders = async (userRole: string, tab: 'incoming' | 'purchases', pageNum: number, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const skip = (pageNum - 1) * LIMIT;
      let data: any[] = [];

      if (userRole === 'PETANI') {
        if (tab === 'incoming') {
          data = await ordersApi.getIncomingOrders(skip, LIMIT);
        } else {
          data = await ordersApi.getMyPurchases(skip, LIMIT);
        }
      } else {
        data = await ordersApi.getMyPurchases(skip, LIMIT);
      }

      if (append) {
        setOrders(prev => [...prev, ...data]);
      } else {
        setOrders(data);
      }
      setHasMore(data.length === LIMIT);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchUserAndOrders = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      
      const initialTab = userData.role === 'PETANI' ? 'incoming' : 'purchases';
      setActiveTab(initialTab);
      await loadOrders(userData.role, initialTab, 1, false);
    } catch (err: any) {
      if (!err.message?.includes('401')) {
        console.error('Failed to get user/orders:', err);
      }
      router.replace('/login');
    }
  };

  useEffect(() => {
    fetchUserAndOrders();
  }, []);

  const handleTabChange = (tab: 'incoming' | 'purchases') => {
    if (!user) return;
    setActiveTab(tab);
    loadOrders(user.role, tab, 1, false);
  };

  const handleLoadMore = () => {
    if (!user || isLoadingMore) return;
    loadOrders(user.role, activeTab, page + 1, true);
  };

  const handleUpdate = () => {
    if (!user) return;
    loadOrders(user.role, activeTab, 1, false);
  };

  const getEmptyState = () => {
    if (activeTab === 'incoming') {
      return {
        title: 'Belum ada pesanan masuk',
        desc: 'Hasil panenmu yang dijual belum dipesan oleh pembeli lain.'
      };
    } else {
      return {
        title: 'Kamu belum melakukan pembelian',
        desc: 'Cari hasil panen segar di beranda untuk mulai berbelanja.'
      };
    }
  };

  const emptyState = getEmptyState();

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

        {/* Tab Navigation for Farmers */}
        {user && user.role === 'PETANI' && (
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm max-w-md mb-8">
            <button
              onClick={() => handleTabChange('incoming')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer",
                activeTab === 'incoming'
                  ? "bg-gr-green text-gr-bg shadow-lg shadow-gr-green/25"
                  : "text-gr-text-primary/50 hover:text-gr-text-primary hover:bg-white/5"
              )}
            >
              <Package size={14} />
              Pesanan Masuk
            </button>
            <button
              onClick={() => handleTabChange('purchases')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer",
                activeTab === 'purchases'
                  ? "bg-gr-green text-gr-bg shadow-lg shadow-gr-green/25"
                  : "text-gr-text-primary/50 hover:text-gr-text-primary hover:bg-white/5"
              )}
            >
              <ShoppingBag size={14} />
              Pesanan Saya
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order, index) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  index={index} 
                  onUpdate={handleUpdate} 
                  isIncoming={user?.role === 'PETANI' && activeTab === 'incoming'}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  disabled={isLoadingMore}
                  onClick={handleLoadMore}
                  className="bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary px-6 py-2.5 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <Package className="h-12 w-12 text-gr-text-primary/20 mb-4" />
            <span className="font-display text-2xl text-gr-text-primary/20">
              {emptyState.title}
            </span>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/40 max-w-xs">
              {emptyState.desc}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({ 
  order, 
  index, 
  onUpdate, 
  isIncoming 
}: { 
  order: any; 
  index: number; 
  onUpdate: () => void; 
  isIncoming: boolean; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const liveStatus = useOrderSocket(order.id);
  const currentStatus = liveStatus || order.status;

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DIPESAN': 
        return { icon: Clock, color: 'text-gr-orange', label: 'Menunggu Konfirmasi' };
      case 'DIKONFIRMASI': 
        return { icon: CheckCircle2, color: 'text-gr-green', label: 'Terkonfirmasi' };
      case 'SIAP_DIAMBIL': 
        return { icon: Truck, color: 'text-gr-live', label: 'Siap Diambil' };
      case 'SELESAI': 
        return { icon: CheckCircle2, color: 'text-gr-text-primary/40', label: 'Selesai' };
      case 'BATAL': 
        return { icon: XCircle, color: 'text-gr-price-unfair', label: 'Dibatalkan' };
      default: 
        return { icon: Package, color: 'text-gr-text-primary', label: status };
    }
  };

  const config = getStatusConfig(currentStatus);
  const StatusIcon = config.icon;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await ordersApi.updateOrderStatus(order.id, newStatus);
      onUpdate();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const getWhatsAppUrl = (phone: string, msg: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
  };

  const contactPhone = isIncoming ? order.buyer_phone : order.seller_phone;
  const contactName = isIncoming ? order.buyer_name : order.seller_name;
  const contactRoleLabel = isIncoming ? 'Pembeli' : 'Penjual/Petani';

  const waMessage = isIncoming
    ? `Halo ${contactName}, saya adalah penjual dari pesanan Anda (Order ID: ${order.id.slice(0, 8)}) untuk ${order.quantity_kg} KG ${order.product_name || 'Hasil Panen'}.`
    : `Halo ${contactName}, saya adalah pembeli dari pesanan Anda (Order ID: ${order.id.slice(0, 8)}) untuk ${order.quantity_kg} KG ${order.product_name || 'Hasil Panen'}.`;

  const waUrl = contactPhone ? getWhatsAppUrl(contactPhone, waMessage) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5", config.color)}>
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
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
              {order.product_name || 'Hasil Panen'}
            </h3>
            <p className="font-sans text-sm text-gr-text-primary/60 mt-0.5">
              {order.quantity_kg} KG
            </p>
            <p className="font-sans text-xs text-gr-text-primary/40 mt-1">
              Dipesan pada {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end justify-between gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border border-current/20 bg-current/5", config.color)}>
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
              {config.label}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-gr-green hover:bg-gr-green/10"
          >
            {isExpanded ? 'Sembunyikan' : 'Detail Pesanan'}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 pt-6 border-t border-white/5 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40 mb-2">
                  Rincian Transaksi
                </h4>
                <div className="space-y-1.5 font-sans text-sm">
                  <div className="flex justify-between max-w-xs">
                    <span className="text-gr-text-primary/60">Harga per KG:</span>
                    <span className="text-gr-text-primary font-medium">
                      {order.price_per_kg ? `Rp ${order.price_per_kg.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between max-w-xs">
                    <span className="text-gr-text-primary/60">Jumlah Pesanan:</span>
                    <span className="text-gr-text-primary font-medium">{order.quantity_kg} KG</span>
                  </div>
                  <div className="flex justify-between max-w-xs border-t border-white/5 pt-1.5 mt-1.5 font-bold">
                    <span className="text-gr-text-primary/60">Total Pembayaran:</span>
                    <span className="text-gr-green">
                      {order.price_per_kg ? `Rp ${(order.price_per_kg * order.quantity_kg).toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40 mb-2">
                  Informasi Kontak ({contactRoleLabel})
                </h4>
                {contactName ? (
                  <div className="space-y-3">
                    <div className="font-sans text-sm">
                      <p className="text-gr-text-primary font-medium text-base">{contactName}</p>
                      <p className="text-gr-text-primary/40 text-xs mt-0.5">{contactPhone || 'Tidak ada nomor telepon'}</p>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.233-1.371a9.936 9.936 0 004.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.065A9.925 9.925 0 0012.012 2zm5.735 14.13c-.315.881-1.554 1.616-2.146 1.718-.589.1-1.325.138-3.927-.928-3.329-1.365-5.47-4.753-5.635-4.975-.166-.222-1.326-1.764-1.326-3.364 0-1.6 1.042-2.384 1.305-2.648.263-.264.574-.329.765-.329.19 0 .38 0 .547.008.175.008.41-.033.642.528.24.577.818 1.996.887 2.141.07.145.117.315.02.511-.097.195-.147.314-.294.485-.147.172-.313.383-.446.514-.147.146-.3.307-.129.6.171.293.76 1.25 1.625 2.022 1.114.993 2.052 1.3 2.345 1.447.293.147.465.122.637-.078.172-.2.735-.856.932-1.15.196-.294.392-.246.662-.147.27.098 1.715.808 2.01 1.011.294.202.49.3.564.428.074.128.074.743-.241 1.624z"/>
                        </svg>
                        Hubungi via WhatsApp
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="font-sans text-xs text-gr-text-primary/20 italic">
                    Informasi kontak tidak tersedia
                  </p>
                )}
              </div>
            </div>

            {/* Farmer actions */}
            {isIncoming && currentStatus !== 'SELESAI' && currentStatus !== 'BATAL' && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                {currentStatus === 'DIPESAN' && (
                  <>
                    <Button
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('DIKONFIRMASI')}
                      className="bg-gr-green hover:bg-gr-green/80 text-gr-bg font-sans text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-300"
                    >
                      Konfirmasi Pesanan
                    </Button>
                    <Button
                      disabled={isUpdating}
                      variant="ghost"
                      onClick={() => handleStatusChange('BATAL')}
                      className="border border-gr-price-unfair/30 hover:border-gr-price-unfair/50 text-gr-price-unfair hover:bg-gr-price-unfair/10 font-sans text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-300"
                    >
                      Tolak
                    </Button>
                  </>
                )}
                {currentStatus === 'DIKONFIRMASI' && (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SIAP_DIAMBIL')}
                    className="bg-gr-live hover:bg-gr-live/80 text-gr-bg font-sans text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-300"
                  >
                    Tandai Siap Diambil
                  </Button>
                )}
                {currentStatus === 'SIAP_DIAMBIL' && (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SELESAI')}
                    className="bg-gr-green hover:bg-gr-green/80 text-gr-bg font-sans text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-300"
                  >
                    Selesaikan Pesanan
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

