'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, useOrderSocket } from '@/lib/api/orders';
import { demandRequestsApi, useDemandSocket } from '@/lib/api/demand-requests';
import { productsApi } from '@/lib/api/products';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { RatingForm } from '@/components/ratings/rating-form';
import { BgPattern } from '@/components/effects/bg-pattern';
import { RatingBadge } from '@/components/ratings/rating-badge';
import { FilmGrain } from '@/components/effects/film-grain';
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2, ShoppingBag, ClipboardList, Tag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'purchases' | 'demands' | 'products'>('incoming');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  const loadOrders = async (userRole: string, tab: 'incoming' | 'purchases' | 'demands' | 'products', pageNum: number, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const skip = (pageNum - 1) * LIMIT;
      let data: any[] = [];

      if (tab === 'products') {
        data = await productsApi.getMyProducts();
      } else if (tab === 'demands') {
        data = await demandRequestsApi.getCommittedDemandRequests();
      } else if (userRole === 'PETANI') {
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
      setHasMore(tab === 'demands' || tab === 'products' ? false : data.length === LIMIT);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load orders/products:', err);
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
      if (err.status !== 401) {
        console.error('Failed to get user/orders:', err);
      }
      router.replace('/login');
    }
  };

  useEffect(() => {
    fetchUserAndOrders();
  }, []);

  const handleTabChange = (tab: 'incoming' | 'purchases' | 'demands' | 'products') => {
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
    } else if (activeTab === 'purchases') {
      return {
        title: 'Kamu belum melakukan pembelian',
        desc: 'Cari hasil panen segar di beranda untuk mulai berbelanja.'
      };
    } else if (activeTab === 'products') {
      return {
        title: 'Kamu belum melisting produk',
        desc: 'Mulai tawarkan hasil panenmu di marketplace melalui halaman Jual.'
      };
    } else {
      return {
        title: 'Belum ada permintaan diterima',
        desc: user?.role === 'PETANI'
          ? 'Kamu belum memberikan komitmen supply pada permintaan pembeli.'
          : 'Belum ada petani yang menyetujui/berkomitmen pada permintaan hasil panenmu.'
      };
    }
  };

  const emptyState = getEmptyState();

  return (
    <main className="relative flex-1 bg-gr-paper lg:h-[calc(100vh-76px)] lg:max-h-[calc(100vh-76px)] lg:overflow-hidden flex flex-col">
      <BgPattern />
      <FilmGrain />

      <div className="relative z-10 w-full h-full flex flex-col min-h-0 px-4 sm:px-8 py-6 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 flex-1 min-h-0 items-stretch overflow-hidden">
          
          {/* COLUMN 1: Masthead & Vertical Tab Selectors (Left) */}
          <div className="flex flex-col justify-between lg:border-r lg:border-dashed lg:border-gr-line/40 lg:pr-8 h-full space-y-6 shrink-0">
            <div className="space-y-4">
              <header className="select-none">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gr-board">
                  Transaksi
                </span>
                <h1 className="mt-2 font-display text-4xl font-semibold text-gr-ink leading-tight">
                  Daftar Pesanan
                </h1>
                <p className="mt-2 font-sans text-xs text-gr-ink-soft leading-relaxed">
                  Kelola pesanan masuk, pembelian hasil panen, supply, dan listing marketplace aktif secara terpusat.
                </p>
              </header>
              <div className="h-px bg-gradient-to-r from-gr-line via-gr-line/45 to-transparent" />
            </div>

            {/* Vertical Index Tabs */}
            {user && (
              <div className="flex-1 flex flex-col justify-end space-y-3">
                {user.role === 'PETANI' && (
                  <button
                    onClick={() => handleTabChange('incoming')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer",
                      activeTab === 'incoming'
                        ? "bg-gr-board text-gr-chalk border-gr-board shadow-sm"
                        : "bg-white/40 text-gr-ink-soft border-gr-line hover:text-gr-ink hover:bg-white/60"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Package size={14} />
                      Pesanan Masuk
                    </span>
                    <span className="text-[10px] opacity-60">→</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleTabChange('purchases')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer",
                    activeTab === 'purchases'
                      ? "bg-gr-board text-gr-chalk border-gr-board shadow-sm"
                      : "bg-white/40 text-gr-ink-soft border-gr-line hover:text-gr-ink hover:bg-white/60"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={14} />
                    Pesanan Saya
                  </span>
                  <span className="text-[10px] opacity-60">→</span>
                </button>

                <button
                  onClick={() => handleTabChange('demands')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer",
                    activeTab === 'demands'
                      ? "bg-gr-board text-gr-chalk border-gr-board shadow-sm"
                      : "bg-white/40 text-gr-ink-soft border-gr-line hover:text-gr-ink hover:bg-white/60"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList size={14} />
                    Permintaan Terpenuhi
                  </span>
                  <span className="text-[10px] opacity-60">→</span>
                </button>

                {user.role === 'PETANI' && (
                  <button
                    onClick={() => handleTabChange('products')}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer",
                      activeTab === 'products'
                        ? "bg-gr-board text-gr-chalk border-gr-board shadow-sm"
                        : "bg-white/40 text-gr-ink-soft border-gr-line hover:text-gr-ink hover:bg-white/60"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={14} />
                      Produk Saya
                    </span>
                    <span className="text-[10px] opacity-60">→</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* COLUMN 2: Scrollable Active Content List (Right) */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto pr-1.5 custom-scrollbar pb-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-10 w-10 text-gr-board animate-spin opacity-60" />
              </div>
            ) : orders.length > 0 ? (
              <div className="w-full space-y-6">
                <AnimatePresence mode="popLayout">
                  {activeTab === 'products' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {orders.map((product) => (
                        <FarmerProductCard 
                          key={product.id} 
                          product={product} 
                          onUpdate={handleUpdate} 
                        />
                      ))}
                    </div>
                  ) : activeTab === 'demands' ? (
                    <div className="space-y-6">
                      {orders.map((demand, index) => (
                        <DemandCard 
                          key={demand.id} 
                          demand={demand} 
                          index={index} 
                          onUpdate={handleUpdate} 
                          role={user?.role}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order, index) => (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          index={index} 
                          onUpdate={handleUpdate} 
                          isIncoming={user?.role === 'PETANI' && activeTab === 'incoming'}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      disabled={isLoadingMore}
                      onClick={handleLoadMore}
                      className="bg-white/80 border border-gr-line hover:border-gr-ink/40 text-gr-ink px-6 py-2.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer disabled:opacity-50 shadow-xs"
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
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gr-line rounded-sm bg-white/40 p-8 shadow-xs w-full">
                <Package className="h-12 w-12 text-gr-ink-soft/30 mb-4" />
                <span className="font-display text-2xl font-semibold text-gr-ink">
                  {emptyState.title}
                </span>
                <p className="mt-2 font-sans text-sm text-gr-ink-soft max-w-xs">
                  {emptyState.desc}
                </p>
              </div>
            )}
          </div>

        </div>
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [buyerConfirmedAt, setBuyerConfirmedAt] = useState<string | null>(order.buyer_confirmed_at);
  const [hasBuyerRated, setHasBuyerRated] = useState<boolean>(order.has_buyer_rated);
  
  const liveStatus = useOrderSocket(order.id);
  const currentStatus = liveStatus || order.status;

  const handleConfirmSuccess = async () => {
    try {
      setIsConfirming(true);
      const updatedOrder = await ordersApi.confirmOrderSuccess(order.id);
      setBuyerConfirmedAt(updatedOrder.buyer_confirmed_at);
      onUpdate();
    } catch (err) {
      console.error('Failed to confirm success:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DIPESAN': 
      case 'MENUNGGU_KONFIRMASI':
        return { icon: Clock, pillStyle: 'bg-gr-board/10 text-gr-board border-gr-board/20', label: 'Menunggu Konfirmasi' };
      case 'DIKONFIRMASI': 
      case 'DIPROSES':
        return { icon: CheckCircle2, pillStyle: 'bg-gr-up/10 text-gr-up border-gr-up/20', label: 'Diproses' };
      case 'SIAP_DIAMBIL': 
        return { icon: Truck, pillStyle: 'bg-gr-board/10 text-gr-board border-gr-board/20', label: 'Siap Diambil' };
      case 'DIKIRIM':
        return { icon: Truck, pillStyle: 'bg-gr-board/10 text-gr-board border-gr-board/20', label: 'Dikirim' };
      case 'DITERIMA':
        return { icon: CheckCircle2, pillStyle: 'bg-gr-up/10 text-gr-up border-gr-up/20', label: 'Diterima' };
      case 'SELESAI': 
        return { icon: CheckCircle2, pillStyle: 'bg-gr-paper text-gr-ink-soft border-gr-line', label: 'Selesai' };
      case 'BATAL': 
      case 'DIBATALKAN':
        return { icon: XCircle, pillStyle: 'bg-gr-down/10 text-gr-down border-gr-down/20', label: 'Dibatalkan' };
      default: 
        return { icon: Package, pillStyle: 'bg-gr-paper text-gr-ink border-gr-line', label: status };
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-sm bg-white/80 p-6 border border-gr-line backdrop-blur-md hover:border-gr-ink/30 transition-all shadow-md overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gr-line bg-gr-paper text-gr-ink shadow-xs">
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-gr-ink-soft/70">
                Order ID: {order.id.slice(0, 8)}
              </span>
              {liveStatus && (
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-up animate-pulse font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gr-up" />
                  Live
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-gr-ink">
              {order.product_name || 'Hasil Panen'}
            </h3>
            <p className="font-sans text-sm font-medium text-gr-ink-soft mt-0.5">
              {order.quantity_kg} KG
            </p>
            <p className="font-sans text-xs text-gr-ink-soft/70 mt-1">
              Dipesan pada {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end justify-between gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-sm border", config.pillStyle)}>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
              {config.label}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-mono text-xs font-bold uppercase tracking-wider text-gr-board hover:underline p-0 h-auto cursor-pointer"
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
            className="mt-6 pt-6 border-t border-gr-line space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-2">
                  Rincian Transaksi
                </h4>
                <div className="space-y-1.5 font-sans text-sm">
                  <div className="flex justify-between max-w-xs">
                    <span className="text-gr-ink-soft">Harga per KG:</span>
                    <span className="text-gr-ink font-medium">
                      {order.price_per_kg ? `Rp ${order.price_per_kg.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between max-w-xs">
                    <span className="text-gr-ink-soft">Jumlah Pesanan:</span>
                    <span className="text-gr-ink font-medium">{order.quantity_kg} KG</span>
                  </div>
                  <div className="flex justify-between max-w-xs border-t border-gr-line pt-1.5 mt-1.5 font-bold">
                    <span className="text-gr-ink-soft">Total Pembayaran:</span>
                    <span className="text-gr-up font-mono">
                      {order.price_per_kg ? `Rp ${(order.price_per_kg * order.quantity_kg).toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-2">
                  Informasi Kontak ({contactRoleLabel})
                </h4>
                {contactName ? (
                  <div className="space-y-3">
                    <div className="font-sans text-sm">
                      <p className="text-gr-ink font-semibold text-base">{contactName}</p>
                      <p className="text-gr-ink-soft/70 text-xs mt-0.5">{contactPhone || 'Tidak ada nomor telepon'}</p>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.233-1.371a9.936 9.936 0 004.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.065A9.925 9.925 0 0012.012 2zm5.735 14.13c-.315.881-1.554 1.616-2.146 1.718-.589.1-1.325.138-3.927-.928-3.329-1.365-5.47-4.753-5.635-4.975-.166-.222-1.326-1.764-1.326-3.364 0-1.6 1.042-2.384 1.305-2.648.263-.264.574-.329.765-.329.19 0 .38 0 .547.008.175.008.41-.033.642.528.24.577.818 1.996.887 2.141.07.145.117.315.02.511-.097.195-.147.314-.294.485-.147.172-.313.383-.446.514-.147.146-.3.307-.129.6.171.293.76 1.25 1.625 2.022 1.114.993 2.052 1.3 2.345 1.447.293.147.465.122.637-.078.172-.2.735-.856.932-1.15.196-.294.392-.246.662-.147.27.098 1.715.808 2.01 1.011.294.202.49.3.564.428.074.128.074.743-.241 1.624z"/>
                        </svg>
                        Hubungi via WhatsApp
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="font-sans text-xs text-gr-ink-soft/50 italic">
                    Informasi kontak tidak tersedia
                  </p>
                )}
              </div>
            </div>

            {/* Buyer actions */}
            {!isIncoming && (
              <div className="pt-4 border-t border-gr-line space-y-4">
                {(currentStatus === 'MENUNGGU_KONFIRMASI' || currentStatus === 'DIPESAN') && (
                  <Button
                    disabled={isUpdating}
                    variant="ghost"
                    onClick={() => handleStatusChange('DIBATALKAN')}
                    className="border border-gr-down/30 text-gr-down hover:bg-gr-down/10 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm cursor-pointer transition-all"
                  >
                    {isUpdating ? 'Memproses...' : 'Batalkan Pesanan'}
                  </Button>
                )}

                {!buyerConfirmedAt && (currentStatus === 'SIAP_DIAMBIL' || currentStatus === 'DIKIRIM') && (
                  <Button
                    disabled={isConfirming}
                    onClick={handleConfirmSuccess}
                    className="bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm cursor-pointer shadow-sm transition-all"
                  >
                    {isConfirming ? 'Memproses...' : 'Konfirmasi Transaksi Berhasil'}
                  </Button>
                )}

                {buyerConfirmedAt && !hasBuyerRated && (
                  <RatingForm
                    transactionType="PRODUCT_PURCHASE"
                    referenceId={order.id}
                    onSuccess={() => {
                      setHasBuyerRated(true);
                      onUpdate();
                    }}
                    label="Nilai Penjual/Petani"
                  />
                )}

                {hasBuyerRated && (
                  <div className="flex items-center gap-2 text-gr-up text-xs font-mono font-bold uppercase tracking-wider">
                    <CheckCircle2 size={16} />
                    <span>Rating Telah Dikirim</span>
                  </div>
                )}
              </div>
            )}

            {/* Farmer actions */}
            {isIncoming && currentStatus !== 'SELESAI' && currentStatus !== 'BATAL' && currentStatus !== 'DIBATALKAN' && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gr-line">
                {(currentStatus === 'DIPESAN' || currentStatus === 'MENUNGGU_KONFIRMASI') && (
                  <>
                    <Button
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('DIPROSES')}
                      className="bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm cursor-pointer shadow-sm transition-all"
                    >
                      Konfirmasi Pesanan
                    </Button>
                    <Button
                      disabled={isUpdating}
                      variant="ghost"
                      onClick={() => handleStatusChange('DIBATALKAN')}
                      className="border border-gr-down/30 text-gr-down hover:bg-gr-down/10 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm cursor-pointer transition-all"
                    >
                      Tolak
                    </Button>
                  </>
                )}
                {(currentStatus === 'DIKONFIRMASI' || currentStatus === 'DIPROSES') && (
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('SIAP_DIAMBIL')}
                    className="bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm cursor-pointer shadow-sm transition-all"
                  >
                    Tandai Siap Diambil
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

function DemandCard({ 
  demand, 
  index, 
  onUpdate, 
  role 
}: { 
  demand: any; 
  index: number; 
  onUpdate: () => void; 
  role: string; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasPetaniRated, setHasPetaniRated] = useState<boolean>(demand.has_petani_rated);
  const liveData = useDemandSocket(demand.id);
  const currentStatus = liveData?.status || demand.status;
  const currentCommitted = liveData?.quantity_kg_committed !== undefined ? liveData.quantity_kg_committed : demand.quantity_kg_committed;

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'TERBUKA': 
        return { icon: Clock, pillStyle: 'bg-gr-board/10 text-gr-board border-gr-board/20', label: 'Dikomit Petani' };
      case 'TERPENUHI': 
        return { icon: CheckCircle2, pillStyle: 'bg-gr-up/10 text-gr-up border-gr-up/20', label: 'Terpenuhi' };
      case 'DIBATALKAN': 
        return { icon: XCircle, pillStyle: 'bg-gr-down/10 text-gr-down border-gr-down/20', label: 'Dibatalkan' };
      default: 
        return { icon: Package, pillStyle: 'bg-gr-paper text-gr-ink-soft border-gr-line', label: 'Kedaluwarsa' };
    }
  };

  const config = getStatusConfig(currentStatus);
  const StatusIcon = config.icon;

  const formattedDate = new Date(demand.created_at).toLocaleDateString('id-ID', { 
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

  const isBuyer = role === 'PEMBELI';

  const buyerName = demand.buyer_name || 'Pembeli';
  const buyerPhone = demand.buyer_phone;
  const buyerWaMessage = `Halo ${buyerName}, saya adalah petani yang berkomitmen untuk memenuhi permintaan Anda (Request ID: ${demand.id.slice(0, 8)}) untuk ${demand.quantity_kg_needed} KG ${demand.commodity_name}.`;
  const buyerWaUrl = buyerPhone ? getWhatsAppUrl(buyerPhone, buyerWaMessage) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-sm bg-white/80 p-6 border border-gr-line backdrop-blur-md hover:border-gr-ink/30 transition-all shadow-md overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-gr-line bg-gr-paper text-gr-ink shadow-xs">
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-gr-ink-soft/70">
                Request ID: {demand.id.slice(0, 8)}
              </span>
              {liveData && (
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-gr-up animate-pulse font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gr-up" />
                  Live
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-gr-ink">
              {demand.commodity_name}
            </h3>
            <p className="font-sans text-sm font-medium text-gr-ink-soft mt-0.5">
              {currentCommitted} / {demand.quantity_kg_needed} KG terpenuhi
            </p>
            <p className="font-sans text-xs text-gr-ink-soft/70 mt-1">
              Diajukan pada {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end justify-between gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-sm border", config.pillStyle)}>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
              {config.label}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-mono text-xs font-bold uppercase tracking-wider text-gr-board hover:underline p-0 h-auto cursor-pointer"
          >
            {isExpanded ? 'Sembunyikan' : 'Detail Permintaan'}
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
            className="mt-6 pt-6 border-t border-gr-line space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-2">
                  Progress Pemenuhan
                </h4>
                <div className="space-y-2">
                  <div className="w-full bg-gr-paper h-2 rounded-full overflow-hidden border border-gr-line">
                    <div 
                      className="bg-gr-board h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((currentCommitted / demand.quantity_kg_needed) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-sans text-xs text-gr-ink-soft">
                    <span>Deadline: {new Date(demand.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-gr-board font-mono font-bold">
                      {Math.min(100, Math.round((currentCommitted / demand.quantity_kg_needed) * 100))}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link 
                    href={`/permintaan/${demand.id}`}
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase font-bold tracking-wider text-gr-board hover:underline cursor-pointer"
                  >
                    Buka Halaman Detail
                  </Link>
                </div>
              </div>

              <div>
                {isBuyer ? (
                  <div>
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-2">
                      Komitmen Petani ({demand.commitments?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {demand.commitments && demand.commitments.length > 0 ? (
                        demand.commitments.map((commit: any) => {
                          const farmerWaMessage = `Halo ${commit.petani_name || 'Petani'}, saya adalah pembeli yang mengajukan permintaan ${demand.commodity_name}. Terima kasih atas komitmen supply Anda sebesar ${commit.quantity_kg_committed} KG.`;
                          const farmerWaUrl = commit.petani_phone ? getWhatsAppUrl(commit.petani_phone, farmerWaMessage) : null;
                          return (
                            <div key={commit.id} className="p-3 bg-white/50 rounded-sm border border-gr-line flex justify-between items-center text-sm font-sans shadow-xs">
                              <div>
                                <p className="text-gr-ink font-semibold">{commit.petani_name || 'Petani'}</p>
                                <p className="text-gr-up text-xs font-mono font-bold mt-0.5">+{commit.quantity_kg_committed} KG</p>
                              </div>
                              {farmerWaUrl && (
                                <a
                                  href={farmerWaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-sm bg-gr-board text-gr-chalk hover:bg-gr-board/90 transition-all cursor-pointer shadow-xs"
                                  title="Hubungi via WhatsApp"
                                >
                                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.233-1.371a9.936 9.936 0 004.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.065A9.925 9.925 0 0012.012 2zm5.735 14.13c-.315.881-1.554 1.616-2.146 1.718-.589.1-1.325.138-3.927-.928-3.329-1.365-5.47-4.753-5.635-4.975-.166-.222-1.326-1.764-1.326-3.364 0-1.6 1.042-2.384 1.305-2.648.263-.264.574-.329.765-.329.19 0 .38 0 .547.008.175.008.41-.033.642.528.24.577.818 1.996.887 2.141.07.145.117.315.02.511-.097.195-.147.314-.294.485-.147.172-.313.383-.446.514-.147.146-.3.307-.129.6.171.293.76 1.25 1.625 2.022 1.114.993 2.052 1.3 2.345 1.447.293.147.465.122.637-.078.172-.2.735-.856.932-1.15.196-.294.392-.246.662-.147.27.098 1.715.808 2.01 1.011.294.202.49.3.564.428.074.128.074.743-.241 1.624z"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gr-ink-soft/50 italic text-xs">Belum ada komitmen masuk.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-2">
                      Informasi Kontak Pembeli
                    </h4>
                    <div className="space-y-3 font-sans">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-gr-ink font-semibold text-base">{buyerName}</p>
                          <div className="bg-gr-paper border border-gr-line rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0">
                            <RatingBadge
                              avgRating={demand.buyer_rating_avg}
                              ratingCount={demand.buyer_rating_count}
                              size="sm"
                              newLabel="Pembeli Baru"
                              countSuffix="permintaan"
                            />
                          </div>
                        </div>
                        <p className="text-gr-ink-soft/70 text-xs mt-0.5">{buyerPhone || 'Tidak ada nomor telepon'}</p>
                      </div>
                      {buyerWaUrl && (
                        <a
                          href={buyerWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        >
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.233-1.371a9.936 9.936 0 004.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.065A9.925 9.925 0 0012.012 2zm5.735 14.13c-.315.881-1.554 1.616-2.146 1.718-.589.1-1.325.138-3.927-.928-3.329-1.365-5.47-4.753-5.635-4.975-.166-.222-1.326-1.764-1.326-3.364 0-1.6 1.042-2.384 1.305-2.648.263-.264.574-.329.765-.329.19 0 .38 0 .547.008.175.008.41-.033.642.528.24.577.818 1.996.887 2.141.07.145.117.315.02.511-.097.195-.147.314-.294.485-.147.172-.313.383-.446.514-.147.146-.3.307-.129.6.171.293.76 1.25 1.625 2.022 1.114.993 2.052 1.3 2.345 1.447.293.147.465.122.637-.078.172-.2.735-.856.932-1.15.196-.294.392-.246.662-.147.27.098 1.715.808 2.01 1.011.294.202.49.3.564.428.074.128.074.743-.241 1.624z"/>
                          </svg>
                          Hubungi via WhatsApp
                        </a>
                      )}
                    </div>
                    
                    {/* Petani Rating action */}
                    {role === 'PETANI' && currentStatus === 'TERPENUHI' && (
                      <div className="mt-4 pt-4 border-t border-gr-line space-y-3">
                        {!hasPetaniRated ? (
                          <RatingForm
                            transactionType="DEMAND_FULFILLMENT"
                            referenceId={demand.id}
                            onSuccess={() => {
                              setHasPetaniRated(true);
                              onUpdate();
                            }}
                            label="Nilai Pembeli"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-gr-up text-xs font-mono font-bold uppercase tracking-wider">
                            <CheckCircle2 size={16} />
                            <span>Rating Telah Dikirim</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FarmerProductCard({
  product,
  onUpdate
}: {
  product: any;
  onUpdate: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menarik komoditas "${product.name}" dari pasar?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await productsApi.deleteProduct(product.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to withdraw product:', err);
      alert('Gagal menarik produk dari pasar.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(product.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col sm:flex-row gap-4 p-4 bg-white/60 backdrop-blur-sm border border-gr-line rounded-sm hover:border-gr-ink/30 transition-all shadow-sm"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-24 sm:w-28 shrink-0 overflow-hidden bg-black/5 border border-gr-line rounded-sm">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="h-full w-full object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gr-ink-soft/40">
            <Package size={24} />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-gr-ink-soft/70">
                {product.category}
              </span>
              <h3 className="font-display text-lg font-bold text-gr-ink leading-tight mt-0.5 truncate">
                {product.name}
              </h3>
            </div>
            
            {/* Status Badge */}
            <span className="px-2 py-0.5 rounded-sm border border-gr-board/20 bg-gr-board/10 text-gr-board font-mono text-[8px] font-bold uppercase tracking-wider">
              {product.status}
            </span>
          </div>

          <div className="mt-2.5 space-y-1 font-sans text-xs">
            <div className="flex justify-between text-gr-ink-soft">
              <span>Harga Jual:</span>
              <span className="font-mono font-bold text-gr-ink">Rp {product.price_per_kg.toLocaleString('id-ID')}/kg</span>
            </div>
            <div className="flex justify-between text-gr-ink-soft">
              <span>Stok Tersedia:</span>
              <span className="font-mono font-bold text-gr-ink">{product.quantity_kg} KG</span>
            </div>
            {product.reference_price_per_kg && (
              <div className="flex justify-between text-gr-ink-soft">
                <span>Acuan PIHPS:</span>
                <span className="font-mono font-bold text-gr-board">Rp {product.reference_price_per_kg.toLocaleString('id-ID')}/kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-gr-line/40">
          <span className="font-sans text-[10px] text-gr-ink-soft/60 italic">
            Listing sejak {formattedDate}
          </span>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gr-down/10 text-gr-down hover:bg-gr-down hover:text-gr-chalk border border-gr-down/20 font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Trash2 size={10} />
            )}
            Tarik Produk
          </button>
        </div>
      </div>
    </motion.div>
  );
}
