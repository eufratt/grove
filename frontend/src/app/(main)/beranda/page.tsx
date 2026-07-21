'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api/products';
import { authApi } from '@/lib/api/auth';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2 } from 'lucide-react';
import { PersonalGreeting } from '@/components/personal-greeting';
import Link from 'next/link';



function BerandaContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const requestLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(null);
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Aktifkan izin lokasi untuk melihat produk terdekat dari kamu.");
          } else {
            setLocationError("Gagal mengambil lokasi. Pastikan GPS/lokasi browser aktif.");
          }
        },
        { timeout: 5000 }
      );
    } else {
      setLocationError("Browser Anda tidak mendukung layanan lokasi geolokasi.");
    }
  };

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
    const fetchUser = async () => {
      try {
        const data = await authApi.getMe();
        setUser(data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
    fetchInitialProducts();
    requestLocation();
  }, []);

  const handleSearchResults = useCallback((results: any[]) => {
    setProducts(results);
  }, []);

  const handleClearSearch = useCallback(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <main className="relative flex-1 bg-gr-paper py-10 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />
      
      <div className="relative z-10 w-full">
        <header className="mb-8 text-center lg:text-left">
          <div className="flex flex-col gap-6 w-full max-w-3xl">
            <PersonalGreeting />
            
            <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="flex-1 w-full flex flex-col gap-2">
                <SearchBar 
                  onResults={handleSearchResults} 
                  onLoading={setIsSearching} 
                  onClear={handleClearSearch} 
                />
                <div className="flex justify-start px-2">
                  <Link 
                    href="/harga-pasar" 
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-gr-board hover:underline transition-all cursor-pointer"
                  >
                    Lihat Peta Acuan Harga
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 h-px w-full bg-gradient-to-r from-gr-board/30 via-gr-line to-transparent" />
        </header>

        {(isLoading || isSearching) ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              {isSearching ? 'Mencari hasil terdekat...' : 'Memuat produk...'}
            </span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
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

import { Suspense } from 'react';

export default function BerandaPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    }>
      <BerandaContent />
    </Suspense>
  );
}
