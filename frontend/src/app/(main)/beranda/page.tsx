'use client';

import React, { useState, useEffect } from 'react';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2, Map as MapIcon, List as ListIcon } from 'lucide-react';

// Dynamic import for MapView to avoid SSR issues
const MapView = dynamic(() => import('@/components/products/map-view'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-white/5 rounded-2xl animate-pulse">
      <Loader2 className="h-8 w-8 text-gr-green animate-spin opacity-20" />
    </div>
  )
});

export default function BerandaPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // New state for map and geolocation
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

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
    fetchInitialProducts();
    
    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  const handleSearchResults = (results: any[]) => {
    setProducts(results);
    setViewMode('list'); // Switch to list view for search results unless we want to show them on map
  };

  const handleClearSearch = () => {
    if (viewMode === 'map' && userLocation) {
      fetchNearbyProducts(userLocation[0], userLocation[1], radiusKm);
    } else {
      setProducts(initialProducts);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'map' : 'list';
    setViewMode(newMode);
    
    if (newMode === 'map' && userLocation) {
      fetchNearbyProducts(userLocation[0], userLocation[1], radiusKm);
    } else if (newMode === 'list') {
      setProducts(initialProducts);
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value);
    setRadiusKm(newRadius);
    if (userLocation) {
      fetchNearbyProducts(userLocation[0], userLocation[1], newRadius);
    }
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
          
          <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <SearchBar 
                onResults={handleSearchResults} 
                onLoading={setIsSearching} 
                onClear={handleClearSearch} 
              />
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all",
                  viewMode === 'list' ? "bg-gr-green text-gr-bg" : "text-gr-text-primary/40 hover:text-gr-text-primary"
                )}
              >
                <ListIcon size={16} />
                List
              </button>
              <button
                onClick={toggleViewMode}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all",
                  viewMode === 'map' ? "bg-gr-green text-gr-bg" : "text-gr-text-primary/40 hover:text-gr-text-primary"
                )}
              >
                <MapIcon size={16} />
                Peta
              </button>
            </div>
          </div>

          {viewMode === 'map' && userLocation && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                Radius: {radiusKm} KM
              </span>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={radiusKm} 
                onChange={handleRadiusChange}
                className="w-48 accent-gr-green"
              />
            </div>
          )}

          <div className="mt-12 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {(isLoading || isSearching) ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              {isSearching ? 'Mencari hasil terdekat...' : 'Memuat produk...'}
            </span>
          </div>
        ) : viewMode === 'map' ? (
          <div className="space-y-8">
            <MapView 
              products={products} 
              center={userLocation || [-6.2000, 106.8166]} 
              zoom={11}
            />
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
