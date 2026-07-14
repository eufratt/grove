'use client';

import React, { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api/products';
import { ordersApi } from '@/lib/api/orders';
import { authApi } from '@/lib/api/auth';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { PriceGauge } from '@/components/products/price-gauge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageCircle, MapPin, Calendar, Tag, Loader2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PhoneModal } from '@/components/auth/phone-modal';

export default function ProductDetailPage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [qtyInput, setQtyInput] = useState('1');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadingProduct(true);
      setError('');
      try {
        const data = await productsApi.getProductById(id);
        setProduct(data);
        setQuantity(1);
        setQtyInput('1');
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
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

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10" />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gr-green text-gr-bg px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest shadow-2xl animate-bounce">
          {successToast}
        </div>
      )}
      
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link 
          href="/beranda" 
          className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Polaroid Style Image */}
          <div className="flex flex-col items-center">
            <div className="bg-gr-bg-paper p-6 pb-24 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 w-full max-w-md">
              <div className="aspect-square w-full overflow-hidden bg-black/5">
                <img 
                  src={product.photo_url || '/placeholder-crop.jpg'} 
                  alt={product.name} 
                  className="h-full w-full object-cover grayscale-[0.1] contrast-[1.05]"
                />
              </div>
              <div className="mt-8 text-center">
                <span className="font-display text-3xl text-gr-text-paper opacity-40">
                  EST. {new Date(product.created_at).getFullYear()}
                </span>
              </div>
            </div>
          </div>
 
          {/* Right: Info Section */}
          <div className="flex flex-col space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gr-green">
                  {product.category}
                </span>
                <span className="bg-gr-live/10 border border-gr-live/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gr-live">
                  {product.status}
                </span>
              </div>
              
              <h1 className="font-display text-6xl font-medium tracking-tight text-gr-text-primary leading-tight">
                {product.name}
              </h1>
              
              <div className="mt-6 flex items-baseline gap-4">
                <span className="font-mono text-5xl text-gr-green">
                  Rp {product.price_per_kg.toLocaleString('id-ID')}
                </span>
                <span className="font-sans text-sm text-gr-text-primary/40 uppercase tracking-widest">
                  per Kilogram
                </span>
              </div>
            </div>
 
            {/* Price Gauge Section */}
            {product.reference_price_per_kg && (
              <div className="rounded-2xl bg-white/5 p-8 border border-white/10 backdrop-blur-md">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-gr-text-primary/40 mb-1">
                      Analisis Transparansi
                    </h4>
                    <p className="font-display text-2xl text-gr-text-primary">
                      Indikator Keadilan Harga
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-lg text-white">
                      Rp {product.reference_price_per_kg.toLocaleString('id-ID')}
                    </span>
                    <span className="font-sans text-[8px] uppercase tracking-widest text-gr-text-primary/30">
                      Harga Referensi Pasar
                    </span>
                  </div>
                </div>
                
                <PriceGauge 
                  hargaProduk={product.price_per_kg} 
                  hargaReferensi={product.reference_price_per_kg} 
                />
                
                <p className="mt-6 font-sans text-xs text-gr-text-primary/60 leading-relaxed italic">
                  * Indikator ini membandingkan harga petani dengan harga pasar rata-rata untuk menjamin transparansi bagi pembeli dan keadilan bagi produsen.
                </p>
              </div>
            )}
 
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gr-green">
                  <Tag size={20} />
                </div>
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">Stok</span>
                  <span className="font-mono text-lg text-gr-text-primary">{product.quantity_kg} KG</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gr-green">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">Dipanen</span>
                  <span className="font-mono text-lg text-gr-text-primary">
                    {new Date(product.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gr-green">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">Lokasi</span>
                  <span className="font-mono text-lg text-gr-text-primary">
                    {product.distance_km ? `${product.distance_km.toFixed(1)} km dari Anda` : 'Terverifikasi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div className="bg-gr-price-unfair/10 border border-gr-price-unfair/20 text-gr-price-unfair text-xs px-4 py-3 rounded-md animate-pulse">
                {error}
              </div>
            )}

            {/* Quantity Selector & Total Price */}
            {isAvailable && (
              <div className="space-y-4 bg-white/5 p-6 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-gr-text-primary/40 mb-1">
                      Jumlah Pembelian
                    </h4>
                    <p className="font-display text-lg text-gr-text-primary">
                      Pilih Quantity (KG)
                    </p>
                  </div>
                  
                  {/* Selector Controls */}
                  <div className="flex items-center border border-white/10 bg-black/20 rounded-none overflow-hidden h-12">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="px-4 h-full flex items-center justify-center text-gr-text-primary hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="text"
                      value={qtyInput}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="w-16 h-full bg-transparent text-center font-mono text-base text-gr-text-primary border-none focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={handleIncrease}
                      disabled={quantity >= maxStock}
                      className="px-4 h-full flex items-center justify-center text-gr-text-primary hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-gr-text-primary/40">
                    Total Harga
                  </span>
                  <span className="font-mono text-2xl text-gr-green font-bold">
                    Rp {(product.price_per_kg * quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
 
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleBuyNow}
                disabled={checkingOut || !isAvailable}
                className="flex-1 bg-gr-green text-gr-bg hover:bg-gr-green/90 h-16 rounded-none font-sans font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : !isAvailable ? (
                  "Sudah Terjual"
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Beli Sekarang
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-16 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-gr-text-primary">
                <MessageCircle className="mr-2 h-5 w-5" />
                Hubungi Petani
              </Button>
            </div>
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
