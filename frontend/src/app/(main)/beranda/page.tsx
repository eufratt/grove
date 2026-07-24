'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api/products';
import { authApi } from '@/lib/api/auth';
import { searchApi as semanticSearchApi } from '@/lib/api/search';
import { ProductCard } from '@/components/products/product-card';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { SearchBar } from '@/components/search/search-bar';
import { Loader2, ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react';
import { PersonalGreeting } from '@/components/personal-greeting';
import { SellerRatingBadge } from '@/components/ratings/seller-rating-badge';
import { provinceCentroids } from '@/lib/data/province-centroids';
import Link from 'next/link';

function BerandaContent() {
  const [products, setProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [pageProducts, setPageProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [locationError, setLocationError] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<any | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars

  // Search details states
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingFarmers, setMatchingFarmers] = useState<any[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const LIMIT = 12;

  const totalPages = Math.ceil(totalCount / LIMIT);
  const hasMore = page < totalPages;
  const hasPrev = page > 1;

  const getClosestProvince = (latitude: number, longitude: number) => {
    let closestProv = 'Di Yogyakarta';
    let minDist = Infinity;
    Object.entries(provinceCentroids).forEach(([provName, coords]) => {
      const dist = Math.sqrt((coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestProv = provName;
      }
    });
    return closestProv;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxDisplayed = 5;
    
    let startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxDisplayed - 1);
    
    if (endPage - startPage < maxDisplayed - 1) {
      startPage = Math.max(1, endPage - maxDisplayed + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

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

  const fetchProducts = useCallback(async (pageNum: number) => {
    // Defer state update to next microtask to prevent react-hooks/set-state-in-effect warning
    await Promise.resolve();
    setIsLoading(true);
    try {
      const skip = (pageNum - 1) * LIMIT;
      // Fetch products and total count concurrently
      const [productsData, countData] = await Promise.all([
        productsApi.getProducts(skip, LIMIT),
        productsApi.getProductsCount()
      ]);
      setPageProducts(productsData);
      setProducts(productsData);
      setTotalCount(countData.count || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [LIMIT]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authApi.getMe();
        setUser(data);
      } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
        setUser(null);
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts(1);
    requestLocation();
  }, [fetchProducts]);

  const handleSearchResults = useCallback(async (results: any[], query: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsSearchActive(true);
    setSearchQuery(query);
    setProducts(results);
    try {
      const farmersData = await authApi.getFarmers(query);
      setMatchingFarmers(farmersData);
    } catch (error) {
      console.error('Failed to fetch matching farmers:', error);
      setMatchingFarmers([]);
    }
  }, []);

  const handleSearchFarmers = useCallback(async (query: string) => {
    setIsSearchActive(true);
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const [farmersData, productsData] = await Promise.all([
        authApi.getFarmers(query),
        semanticSearchApi.semanticSearch(query).catch(() => [])
      ]);
      setMatchingFarmers(farmersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to search farmers/products:', error);
      setMatchingFarmers([]);
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
    setMatchingFarmers([]);
    setProducts(pageProducts);
  }, [pageProducts]);

  return (
    <main className="relative flex-1 bg-gr-paper py-10 overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />
      
      <div className="relative z-10 w-full font-sans">
        <header className="mb-8 text-center lg:text-left">
          <PersonalGreeting />
          
          <div className="mt-4 flex flex-col gap-2 w-full max-w-md">
            <SearchBar 
              onResults={handleSearchResults} 
              onLoading={setIsSearching} 
              onClear={handleClearSearch} 
              onSearchFarmers={handleSearchFarmers}
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

          <div className="mt-12 h-px w-full bg-gradient-to-r from-gr-board/30 via-gr-line to-transparent" />
        </header>

        {(isLoading || isSearching) ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              {isSearching ? 'Mencari hasil terdekat...' : 'Memuat produk...'}
            </span>
          </div>
        ) : (products.length > 0 || matchingFarmers.length > 0) ? (
          <>
            {/* Store search results banner/matching farmers display */}
            {isSearchActive && matchingFarmers.length > 0 && (
              <div className="mb-8 bg-[#FAF9F5] border border-gr-line p-5 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft mb-3.5 font-bold">
                  <span>Petani berkaitan dengan "{searchQuery}"</span>
                </div>
                <div className="space-y-3.5">
                  {matchingFarmers.slice(0, 3).map((farmer) => (
                    <div 
                      key={farmer.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/60 backdrop-blur-xs border border-gr-line/60 rounded-xl hover:border-gr-line transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div 
                          className="relative h-11 w-11 rounded-full bg-white p-0.5 border shadow-xs shrink-0"
                          style={{ borderColor: farmer.theme_color || '#1b4332' }}
                        >
                          <div className="h-full w-full rounded-full bg-gr-paper/60 overflow-hidden flex items-center justify-center text-gr-text-primary font-display text-sm font-bold uppercase border border-gr-line/10">
                            {farmer.avatar_url ? (
                              <img src={farmer.avatar_url} alt={farmer.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <User size={16} className="opacity-30" />
                            )}
                          </div>
                        </div>

                        {/* Name & Details */}
                        <div>
                          <h3 className="font-display text-sm font-bold text-gr-text-primary">
                            {farmer.full_name}
                          </h3>
                          <div className="flex items-center gap-2 font-mono text-[9px] text-gr-text-primary/50 uppercase mt-0.5 flex-wrap">
                            <span className="flex items-center gap-0.5 font-sans font-semibold text-gr-text-primary">
                              <MapPin size={10} style={{ color: farmer.theme_color || '#1b4332' }} /> 
                              {farmer.latitude && farmer.longitude ? getClosestProvince(farmer.latitude, farmer.longitude) : 'Nasional'}
                            </span>
                            <span>•</span>
                            <SellerRatingBadge avgRating={farmer.seller_rating_avg || 0} ratingCount={farmer.seller_rating_count || 0} size="sm" showCount={true} />
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="shrink-0">
                        <Link
                          href={`/petani/${farmer.id}`}
                          className="inline-flex items-center gap-1.5 text-white font-mono text-[9px] font-bold uppercase tracking-widest py-2 px-4 rounded-xl shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                          style={{ backgroundColor: farmer.theme_color || '#1b4332' }}
                        >
                          Kunjungi Toko
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products listings */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {products.map((product: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : isSearchActive && (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gr-line/40 rounded-2xl bg-white/20">
                <p className="font-sans text-sm text-gr-text-primary/45 italic">
                  Tidak ada produk hasil panen yang cocok dengan pencarian Anda dari petani ini.
                </p>
              </div>
            )}

            {!isSearchActive && totalPages > 1 && (
              <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
                <button
                  onClick={() => page > 1 && fetchProducts(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-full border border-gr-line bg-white/40 hover:bg-white/85 text-gr-ink font-mono text-xs uppercase tracking-wider transition-all duration-300 hover:border-gr-ink hover:translate-x-[-2px] disabled:translate-x-0 disabled:opacity-30 disabled:pointer-events-none disabled:border-gr-line/40 disabled:bg-white/15 cursor-pointer shadow-2xs animate-fade-in"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1.5">
                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      onClick={() => p !== page && fetchProducts(p)}
                      className={`flex items-center justify-center min-w-8 h-8 rounded-full border text-xs font-mono font-bold tracking-wider transition-all duration-300 cursor-pointer shadow-2xs ${
                        p === page
                          ? 'border-gr-board bg-gr-board text-gr-chalk'
                          : 'border-gr-line/60 bg-white/20 text-gr-ink hover:bg-white/60 hover:border-gr-ink'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => hasMore && fetchProducts(page + 1)}
                  disabled={!hasMore}
                  className="flex items-center gap-1 px-4 py-2 rounded-full border border-gr-line bg-white/40 hover:bg-white/85 text-gr-ink font-mono text-xs uppercase tracking-wider transition-all duration-300 hover:border-gr-ink hover:translate-x-[2px] disabled:translate-x-0 disabled:opacity-30 disabled:pointer-events-none disabled:border-gr-line/40 disabled:bg-white/15 cursor-pointer shadow-2xs animate-fade-in"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
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
