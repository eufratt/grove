'use client';

import React, { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api/products';
import { ordersApi } from '@/lib/api/orders';
import { authApi } from '@/lib/api/auth';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { PriceGauge } from '@/components/products/price-gauge';
import { SellerRatingBadge } from '@/components/ratings/seller-rating-badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageCircle, MapPin, Calendar, Tag, Loader2, Minus, Plus, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PhoneModal } from '@/components/auth/phone-modal';

export default function ProductDetailPage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [qtyInput, setQtyInput] = useState('1');

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProduct(true);
      setError('');
      try {
        const [prodData, userData] = await Promise.all([
          productsApi.getProductById(id),
          authApi.getMe().catch(() => null)
        ]);
        setProduct(prodData);
        setCurrentUser(userData);
        setQuantity(1);
        setQtyInput('1');
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchData();
  }, [id]);

  const maxStock = product ? product.quantity_kg : 0;

  const handleDecrease = () => {
    if (quantity > 1) {
      const nextVal = quantity - 1;
      setQuantity(nextVal);
      setQtyInput(nextVal.toString());
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      const nextVal = quantity + 1;
      setQuantity(nextVal);
      setQtyInput(nextVal.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQtyInput(val);
    
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      if (parsed >= 1 && parsed <= maxStock) {
        setQuantity(parsed);
      }
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(qtyInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
      setQtyInput('1');
    } else if (parsed > maxStock) {
      setQuantity(maxStock);
      setQtyInput(maxStock.toString());
    } else {
      setQuantity(parsed);
      setQtyInput(parsed.toString());
    }
  };

  const handleBuyNow = async () => {
    if (!product || product.status !== 'TERSEDIA') return;

    try {
      const user = await authApi.getMe();
      if (!user.phone_whatsapp) {
        setPhoneModalOpen(true);
        return;
      }
      await proceedToCheckout();
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi pengguna');
    }
  };

  const proceedToCheckout = async () => {
    setCheckingOut(true);
    setError('');
    try {
      await ordersApi.createOrder({ product_id: id, quantity_kg: quantity });
      setSuccessToast('Pesanan berhasil dibuat! Mengalihkan...');
      setTimeout(() => {
        router.push('/pesanan');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <BgPattern />
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <BgPattern />
        <div className="z-10 text-center">
          <h1 className="font-display text-4xl text-gr-text-primary">Produk tidak ditemukan</h1>
          <Link href="/beranda" className="mt-4 inline-block text-gr-green hover:underline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = product.status === 'TERSEDIA';
  const isOwnProduct = currentUser && product && currentUser.id === product.seller_id;

  return (
    <main className="relative min-h-screen lg:h-[calc(100vh-68px)] bg-gr-bg pt-6 pb-12 lg:pt-2 lg:pb-6 px-4 sm:px-6 lg:px-8 overflow-y-auto lg:overflow-hidden flex flex-col justify-start">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10" />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gr-green text-gr-bg px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest shadow-2xl animate-bounce">
          {successToast}
        </div>
      )}
      
      <div className="relative z-10 mx-auto w-full max-w-5xl lg:h-full lg:max-h-[580px] flex flex-col justify-between">
        <div className="shrink-0 mb-3">
          <Link 
            href="/beranda" 
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch lg:flex-1 lg:min-h-0">
          {/* Left: Polaroid Style Image */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center lg:min-h-0">
            <div className="bg-[#FAF9F5] p-4 pb-5 shadow-2xl rotate-1 hover:rotate-0 transition-all duration-500 w-full max-w-[280px] sm:max-w-[320px] flex flex-col justify-start border border-gr-line/14 rounded-sm">
              <div className="aspect-square w-full overflow-hidden bg-black/5 rounded-xs border border-gr-line/5">
                <img 
                  src={product.photo_url || '/placeholder-crop.jpg'} 
                  alt={product.name} 
                  className="h-full w-full object-cover grayscale-[0.1] contrast-[1.05]"
                />
              </div>
              
              {/* Product Identity stamp/label */}
              <div className="mt-4 pt-3 border-t border-dashed border-gr-line/20 font-mono text-[9px] text-gr-ink-soft space-y-1.5 text-left w-full">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-gr-ink/30 font-bold">
                  <span>ID PRODUK</span>
                  <span>#{product.id.slice(0, 8).toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between items-center py-0.5 border-b border-gr-line/5">
                  <span className="uppercase text-gr-ink/40">TANGGAL PANEN</span>
                  <span className="font-bold text-gr-ink">
                    {new Date(product.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-0.5 border-b border-gr-line/5">
                  <span className="uppercase text-gr-ink/40">JUMLAH STOK</span>
                  <span className="font-bold text-gr-ink">{product.quantity_kg} KG</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="uppercase text-gr-ink/40">ASAL DAERAH</span>
                  <span className="font-bold text-gr-ink uppercase truncate max-w-[120px]" title={product.distance_km ? `${product.distance_km.toFixed(1)} KM DARI ANDA` : 'TERVERIFIKASI'}>
                    {product.distance_km ? `${product.distance_km.toFixed(1)} KM` : 'TERVERIFIKASI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          {/* Right: Info Section */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4 lg:min-h-0">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-gr-chalk/60 border border-gr-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-gr-green font-semibold">
                  {product.category}
                </span>
                <span className="bg-gr-live/10 border border-gr-live/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-gr-live">
                  {product.status}
                </span>
              </div>
              
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-gr-text-primary leading-tight">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-gr-text-primary/40 uppercase tracking-wider">
                <span className="font-sans">
                  Petani: <span className="font-semibold text-gr-text-primary normal-case">{product.seller_name || 'Petani Grove'}</span>
                </span>
                <span>|</span>
                <SellerRatingBadge avgRating={product.seller_rating_avg} ratingCount={product.seller_rating_count} size="sm" />
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl text-gr-green">
                  Rp {product.price_per_kg.toLocaleString('id-ID')}
                </span>
                <span className="font-sans text-[9px] text-gr-text-primary/40 uppercase tracking-widest">
                  per Kilogram
                </span>
              </div>
            </div>
 
            {/* Price Gauge Section */}
            {product.reference_price_per_kg && (
              <div className="bg-[#FAF9F5] p-5 border border-gr-line shadow-sm space-y-4 rounded-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-mono text-[8px] uppercase tracking-[0.2em] text-gr-ink-soft mb-0.5">
                      Analisis Transparansi
                    </h4>
                    <p className="font-display text-xl text-gr-ink font-semibold leading-tight">
                      Indikator Keadilan Harga
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-base font-bold text-gr-ink leading-tight">
                      Rp {product.reference_price_per_kg.toLocaleString('id-ID')}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-gr-ink-soft">
                      Referensi Pasar
                    </span>
                  </div>
                </div>
                
                <PriceGauge 
                  hargaProduk={product.price_per_kg} 
                  hargaReferensi={product.reference_price_per_kg} 
                />
                
                <div className="h-px bg-gr-line/10 my-1" />
                
                <p className="font-sans text-[9px] text-gr-ink-soft leading-relaxed italic m-0">
                  * Indikator membandingkan harga petani dengan harga pasar rata-rata untuk menjamin transparansi & keadilan.
                </p>
              </div>
            )}
  
            {/* Metadata Horizontal Row */}
            <div className="grid grid-cols-3 gap-2 border-y border-gr-line py-3">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gr-green" />
                <div>
                  <span className="block font-sans text-[8px] uppercase tracking-widest text-gr-text-primary/50">Stok</span>
                  <span className="font-mono text-sm text-gr-text-primary">{product.quantity_kg} KG</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gr-green" />
                <div>
                  <span className="block font-sans text-[8px] uppercase tracking-widest text-gr-text-primary/50">Dipanen</span>
                  <span className="font-mono text-sm text-gr-text-primary">
                    {new Date(product.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gr-green" />
                <div className="min-w-0">
                  <span className="block font-sans text-[8px] uppercase tracking-widest text-gr-text-primary/50">Lokasi</span>
                  <span className="font-mono text-sm text-gr-text-primary block truncate" title={product.distance_km ? `${product.distance_km.toFixed(1)} km dari Anda` : 'Terverifikasi'}>
                    {product.distance_km ? `${product.distance_km.toFixed(1)} km` : 'Terverifikasi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div className="bg-gr-price-unfair/10 border border-gr-price-unfair/20 text-gr-price-unfair text-xs px-4 py-2 rounded-md animate-pulse">
                {error}
              </div>
            )}

            {/* Purchase Control Panel */}
            {isAvailable && !isOwnProduct ? (
              <div className="space-y-3 bg-gr-chalk/40 p-4 border border-gr-line backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-[8px] uppercase tracking-[0.2em] text-gr-text-primary/50 mb-0.5">
                      Jumlah Pembelian
                    </h4>
                    <p className="font-display text-sm text-gr-text-primary">
                      Pilih Quantity (KG)
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Selector Controls */}
                    <div className="flex items-center border border-gr-line bg-gr-chalk/60 rounded-none overflow-hidden h-9">
                      <button
                        type="button"
                        onClick={handleDecrease}
                        disabled={quantity <= 1}
                        className="px-3 h-full flex items-center justify-center text-gr-text-primary hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="text"
                        value={qtyInput}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className="w-12 h-full bg-transparent text-center font-mono text-sm text-gr-text-primary border-none focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={handleIncrease}
                        disabled={quantity >= maxStock}
                        className="px-3 h-full flex items-center justify-center text-gr-text-primary hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="block font-sans text-[8px] uppercase tracking-widest text-gr-text-primary/50 mb-0.5">
                        Total Harga
                      </span>
                      <span className="font-mono text-lg text-gr-green font-bold">
                        Rp {(product.price_per_kg * quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleBuyNow}
                    disabled={checkingOut || !isAvailable}
                    className="flex-1 bg-gr-green text-gr-bg hover:bg-gr-green/90 h-11 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Beli Sekarang
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1 border-gr-line hover:bg-gr-chalk/60 h-11 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-[11px] text-gr-text-primary">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Hubungi Petani
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                {isOwnProduct ? (
                  <Button 
                    disabled
                    className="w-full bg-gr-chalk/40 border border-gr-line text-gr-text-primary/50 h-11 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-[11px]"
                  >
                    Ini Produk Anda
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full bg-gr-chalk/40 border border-gr-line text-gr-text-primary/50 h-11 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-[11px]"
                  >
                    Sudah Terjual
                  </Button>
                )}
              </div>
            )}

            {/* Banners/Alerts at the very bottom */}
            {isAvailable && !isOwnProduct && (
              <div className="flex items-center gap-2 bg-gr-orange/5 border border-gr-orange/20 px-3 py-2">
                <ShieldAlert className="text-gr-orange shrink-0" size={14} />
                <div className="font-sans text-[10px] text-gr-text-primary/70">
                  <strong className="text-gr-orange uppercase tracking-wider text-[9px] mr-1">Pemberitahuan Keamanan:</strong>
                  Hindari transfer langsung. Gunakan transaksi <strong className="text-gr-green font-semibold">tunai (CoD)</strong> saat bertemu.
                </div>
              </div>
            )}

            {isOwnProduct && (
              <div className="flex items-center gap-2 bg-gr-orange/5 border border-gr-orange/20 px-3 py-2">
                <ShieldAlert className="text-gr-orange shrink-0" size={14} />
                <div className="font-sans text-[10px] text-gr-text-primary/70">
                  <strong className="text-gr-orange uppercase tracking-wider text-[9px] mr-1">Ini Produk Anda:</strong>
                  Anda tidak dapat membeli produk milik Anda sendiri.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PhoneModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onSuccess={async () => {
          setPhoneModalOpen(false);
          await proceedToCheckout();
        }}
      />
    </main>
  );
}
