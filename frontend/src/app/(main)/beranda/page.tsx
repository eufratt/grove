'use client';

import React, { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2 } from 'lucide-react';

export default function BerandaPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const fetchInitialProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productsApi.getProducts();
      setProducts(data);
      setInitialProducts(data);
    } catch (error) {
      console.error('Failed to fetch initial products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialProducts();
  }, []);

  const handleSearchResults = (results: any[]) => {
    setProducts(results);
  };

  const handleClearSearch = () => {
    setProducts(initialProducts);
  };

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10" />
      
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-16 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
                Live Marketplace
              </span>
              <h1 className="mt-4 font-display text-6xl font-medium tracking-tight text-gr-text-primary">
                Hasil Panen Terbaru
              </h1>
            </div>
            <div className="lg:text-right">
              <p className="font-sans text-sm text-gr-text-primary/40 max-w-xs italic mx-auto lg:ml-auto">
                "Menghubungkan langsung ladang petani dengan dapur Anda tanpa rantai tengkulak yang panjang."
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <SearchBar 
              onResults={handleSearchResults} 
              onLoading={setIsSearching} 
              onClear={handleClearSearch} 
            />
          </div>

          <div className="mt-12 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {(isLoading || isSearching) ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              {isSearching ? 'Mencari secara semantik...' : 'Memuat produk...'}
            </span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any, index: number) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <span className="font-display text-3xl text-gr-text-primary/20">
              Tidak ada hasil yang ditemukan
            </span>
            <p className="mt-4 font-sans text-sm text-gr-text-primary/40">
              Coba kata kunci lain atau telusuri produk populer.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
