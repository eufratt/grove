import React from 'react';
import { productsApi } from '@/lib/api/products';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { PriceGauge } from '@/components/products/price-gauge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageCircle, MapPin, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  let product = null;
  try {
    product = await productsApi.getProductById(id);
  } catch (error) {
    console.error('Failed to fetch product:', error);
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

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10" />
      
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 bg-gr-green text-gr-bg hover:bg-gr-green/90 h-16 rounded-none font-sans font-bold uppercase tracking-[0.2em]">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Beli Sekarang
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-16 rounded-none font-sans font-bold uppercase tracking-[0.2em] text-gr-text-primary">
                <MessageCircle className="mr-2 h-5 w-5" />
                Hubungi Petani
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
