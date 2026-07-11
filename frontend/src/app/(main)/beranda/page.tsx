import React from 'react';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';

// To ensure it's a server component and not cached indefinitely for development
export const dynamic = 'force-dynamic';

export default async function BerandaPage() {
  let products = [];
  try {
    // In a real Server Component, you might want to use the fetch API directly 
    // or share logic with the client-side API helper.
    // For now, let's assume this works if the backend is running.
    products = await productsApi.getProducts();
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10" />
      
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-16">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
                Live Marketplace
              </span>
              <h1 className="mt-4 font-display text-6xl font-medium tracking-tight text-gr-text-primary">
                Hasil Panen Terbaru
              </h1>
            </div>
            <div className="hidden lg:block text-right">
              <p className="font-sans text-sm text-gr-text-primary/40 max-w-xs italic">
                "Menghubungkan langsung ladang petani dengan dapur Anda tanpa rantai tengkulak yang panjang."
              </p>
            </div>
          </div>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any, index: number) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <span className="font-display text-3xl text-gr-text-primary/20">
              Belum ada hasil panen hari ini
            </span>
            <p className="mt-4 font-sans text-sm text-gr-text-primary/40">
              Silakan kembali lagi nanti atau jadilah petani pertama yang memposting!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
