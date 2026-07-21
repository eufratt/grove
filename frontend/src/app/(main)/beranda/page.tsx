'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api/products';
import { authApi } from '@/lib/api/auth';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2, Map as MapIcon, List as ListIcon, Compass } from 'lucide-react';
import { SwipeDeck } from '@/components/products/swipe-deck';
import { cn } from '@/lib/utils';
import { PersonalGreeting } from '@/components/personal-greeting';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';



function BerandaContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // New state for map and geolocation
  const [viewMode, setViewMode] = useState<'list' | 'explore'>('list');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // User and Demand Requests State
  const [user, setUser] = useState<any | null>(null);
  const [demandRequests, setDemandRequests] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  // Fetch Demand Requests for Fulfilling (Swipe Deck)
  const fetchDemandRequests = async () => {
    setIsLoading(true);
    try {
      const data = await demandRequestsApi.getOpenDemandRequests();
      setDemandRequests(data);
    } catch (error) {
      console.error('Failed to fetch demand requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'jelajah') {
      setViewMode('explore');
      fetchDemandRequests();
    } else if (mode === null) {
      setViewMode('list');
    }
  }, [mode]);

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

  const fetchNearbyProducts = async (lat: number, lng: number, radius: number) => {
    setIsSearching(true);
    try {
      const data = await productsApi.getNearbyProducts(lat, lng, radius);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch nearby products:', error);
    } finally {
      setIsSearching(false);
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
    setViewMode('list'); // Switch to list view for search results unless we want to show them on map
  }, []);

  const handleClearSearch = useCallback(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const toggleViewMode = (mode: 'list' | 'explore') => {
    setViewMode(mode);
    if (mode === 'explore') {
      fetchDemandRequests();
    } else if (mode === 'list') {
      setProducts(initialProducts);
    }
  };

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
              
              <div className="flex items-center gap-2 bg-gr-ink/5 p-1 rounded-full border border-gr-line backdrop-blur-md">
                <button
                  onClick={() => toggleViewMode('list')}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                    viewMode === 'list' ? "bg-gr-board text-gr-chalk" : "text-gr-ink-soft hover:text-gr-ink"
                  )}
                >
                  <ListIcon size={12} />
                  List
                </button>
                <button
                  onClick={() => toggleViewMode('explore')}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                    viewMode === 'explore' ? "bg-gr-board text-gr-chalk" : "text-gr-ink-soft hover:text-gr-ink"
                  )}
                >
                  <Compass size={12} />
                  Jelajah
                </button>
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
        ) : viewMode === 'explore' ? (
          (!user || user.role === 'PEMBELI') ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 max-w-md mx-auto bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
              <Compass className="h-16 w-16 text-gr-orange animate-pulse" />
              <h3 className="font-display text-2xl text-gr-text-primary">Mode Jelajah Terbatas</h3>
              <p className="font-sans text-sm text-gr-text-primary/60 leading-relaxed">
                Mode Jelajah (Swipe Deck) dirancang khusus bagi para petani untuk menemukan dan berkomitmen memenuhi permintaan hasil panen dari pembeli.
              </p>
              <div className="bg-gr-green/5 border border-gr-green/10 p-4 rounded-2xl text-xs text-gr-green font-sans leading-relaxed">
                Sebagai pembeli, kamu bisa mengajukan permintaan di sini untuk dipenuhi oleh petani lokal.
              </div>
              <Link
                href="/permintaan-saya"
                className="inline-flex items-center gap-2 bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all cursor-pointer animate-bounce"
              >
                Ajukan Permintaan Baru
              </Link>
            </div>
          ) : (
            <SwipeDeck 
              requests={demandRequests} 
              onSwipeRight={fetchDemandRequests}
              onSwipeLeft={(r) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Skipped demand: ${r.commodity_name}`);
                }
              }}
              onEmpty={fetchDemandRequests}
            />
          )
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
