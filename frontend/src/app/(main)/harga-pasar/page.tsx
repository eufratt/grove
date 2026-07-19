'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { productsApi } from '@/lib/api/products';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Search, Calendar, Loader2, TrendingUp, ChevronDown, Info, Tag } from 'lucide-react';
import { provinceCentroids } from '@/lib/data/province-centroids';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Dynamically import the consolidated MapView component (disabling SSR)
const MapView = dynamic(() => import('@/components/products/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white/5 animate-pulse min-h-[300px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 text-gr-green animate-spin opacity-30" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/20">Memuat Peta...</span>
      </div>
    </div>
  )
});

function getRelativeTime(dateString: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
}

export default function HargaPasarPage() {
  // Mode selection state
  const [activeTab, setActiveTab] = useState<'pricing' | 'products'>('pricing');

  // Harga Referensi state
  const [allPrices, setAllPrices] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Geolocation & Status
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Produk Terdekat state
  const [nearbyProducts, setNearbyProducts] = useState<any[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [fetchingProducts, setFetchingProducts] = useState<boolean>(false);

  // Group prices by province (excluding National averages)
  const pricesByProvince = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allPrices.forEach((price) => {
      const region = price.region;
      if (region && region !== 'Nasional') {
        if (!grouped[region]) {
          grouped[region] = [];
        }
        grouped[region].push(price);
      }
    });
    return grouped;
  }, [allPrices]);

  // List of provinces containing data
  const availableProvinces = useMemo(() => {
    return Object.keys(pricesByProvince).sort();
  }, [pricesByProvince]);

  // Calculate default/fallback province
  const selectFallbackProvince = useCallback((items: any[]) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const region = item.region;
      if (region && region !== 'Nasional') {
        counts[region] = (counts[region] || 0) + 1;
      }
    });
    let maxRegion = 'Jawa Timur';
    let maxCount = 0;
    Object.entries(counts).forEach(([reg, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxRegion = reg;
      }
    });
    setSelectedProvince(maxRegion);
  }, []);

  // Fetch nearby products helper
  const fetchNearbyProducts = useCallback(async (lat: number, lng: number, radius: number) => {
    setFetchingProducts(true);
    try {
      const data = await productsApi.getNearbyProducts(lat, lng, radius);
      setNearbyProducts(data);
    } catch (err) {
      console.error('Failed to fetch nearby products:', err);
    } finally {
      setFetchingProducts(false);
    }
  }, []);

  // Geolocation and reference prices fetch on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await referencePricesApi.getReferencePrices(1, 1000);
        setAllPrices(data.items);
        if (data.distinct_commodities) {
          setCommodities(data.distinct_commodities);
        }

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const uLat = position.coords.latitude;
              const uLng = position.coords.longitude;
              setUserLocation([uLat, uLng]);
              setLocationMessage(null);

              // Find closest province centroid coordinate
              let closestProv = 'Di Yogyakarta';
              let minDist = Infinity;
              Object.entries(provinceCentroids).forEach(([provName, coords]) => {
                const dist = Math.sqrt((coords.lat - uLat) ** 2 + (coords.lng - uLng) ** 2);
                if (dist < minDist) {
                  minDist = dist;
                  closestProv = provName;
                }
              });

              // Extract active regions from raw fetched data.items to avoid React state update race condition
              const activeRegions = new Set(
                data.items
                  .map((item: any) => item.region)
                  .filter((region: string) => region && region !== 'Nasional')
              );

              if (activeRegions.has(closestProv)) {
                setSelectedProvince(closestProv);
              } else if (data.items.length > 0) {
                selectFallbackProvince(data.items);
              }
            },
            (error) => {
              console.warn('Geolocation error:', error.message);
              selectFallbackProvince(data.items);
              setLocationMessage('Aktifkan lokasi untuk mencari acuan harga di daerahmu');
            },
            { timeout: 5000 }
          );
        } else {
          selectFallbackProvince(data.items);
        }
      } catch (err) {
        console.error('Failed to load reference prices details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectFallbackProvince]);

  // Sync effect to fetch nearby products on tab/radius/location change
  useEffect(() => {
    if (activeTab === 'products' && userLocation) {
      fetchNearbyProducts(userLocation[0], userLocation[1], radiusKm);
    }
  }, [activeTab, userLocation, radiusKm, fetchNearbyProducts]);

  // Sidebar acuan prices filtering
  const filteredPrices = useMemo(() => {
    if (!selectedProvince) return [];
    let list = pricesByProvince[selectedProvince] || [];

    if (selectedCommodity && selectedCommodity !== 'ALL') {
      list = list.filter((item) => item.commodity_name === selectedCommodity);
    }
    if (searchQuery.trim() !== '') {
      list = list.filter((item) =>
        item.commodity_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [selectedProvince, selectedCommodity, searchQuery, pricesByProvince]);

  // Sidebar nearby products filtering
  const filteredProducts = useMemo(() => {
    let list = nearbyProducts;
    if (searchQuery.trim() !== '') {
      list = list.filter((prod) =>
        prod.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [nearbyProducts, searchQuery]);

  return (
    <main className="fixed inset-0 z-0 flex overflow-hidden bg-gr-paper">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />

      {loading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Loader2 className="h-12 w-12 text-gr-board animate-spin opacity-50" />
          <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-ink-soft">
            Sinkronisasi data wilayah...
          </span>
        </div>
      ) : (
        <div className="relative flex-grow w-full h-full overflow-hidden">
          
          {/* Map Area (Bottom layer, occupying the entire background width and height) */}
          <div className="absolute inset-0 w-full h-full z-10">
            {/* Metadata info cards floating on the top right */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
              {activeTab === 'pricing' && selectedProvince && (
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-gr-board bg-gr-paper/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-gr-line shadow-sm">
                  Provinsi: {selectedProvince}
                </span>
              )}
              {activeTab === 'products' && userLocation && (
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-gr-board bg-gr-paper/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-gr-line shadow-sm">
                  Radius: {radiusKm} KM
                </span>
              )}
            </div>
            
            <MapView
              mode={activeTab}
              products={activeTab === 'products' ? filteredProducts : []}
              radiusKm={radiusKm}
              pricesByProvince={pricesByProvince}
              selectedProvince={activeTab === 'pricing' ? selectedProvince : null}
              onSelectProvince={setSelectedProvince}
              userLocation={userLocation}
              className="h-full w-full"
            />
          </div>

          {/* Sidebar Paper Panel (Floating Overlay on Left) */}
          <div className="absolute z-20 flex flex-col bg-gr-paper/95 backdrop-blur-xl border border-gr-line p-6 rounded-[28px] shadow-lg overflow-hidden bottom-4 left-4 right-4 h-[48%] md:top-[80px] md:bottom-4 md:left-4 md:right-auto md:h-auto md:w-[440px] lg:w-[480px]">
            
            {/* 1. Header Block (Identitas Panel) */}
            <div className="flex items-center justify-between pb-4 border-b border-gr-line mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gr-board/10 flex items-center justify-center border border-gr-board/20">
                  <TrendingUp size={16} className="text-gr-board animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-gr-ink tracking-wide">
                    Harga Pasar
                  </h3>
                  <span className="block font-sans text-[10px] text-gr-ink-soft">
                    Data real-time PIHPS & Lokasi
                  </span>
                </div>
              </div>
              <Link
                href="/tren-harga"
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-gr-board hover:underline bg-gr-board/10 border border-gr-board/20 px-3 py-1.5 rounded-full hover:bg-gr-board/20 transition-all cursor-pointer shrink-0"
              >
                Tren Historis &rarr;
              </Link>
            </div>
 
            {/* Location Message inside Sidebar */}
            {locationMessage && (
              <div className="mb-4 rounded-xl bg-gr-down/10 p-3 text-[10px] text-gr-down border border-gr-down/20 flex items-center gap-2 shrink-0">
                <Info size={12} className="shrink-0" />
                <span className="leading-relaxed">{locationMessage}</span>
              </div>
            )}

            {/* 2. Prominent Search Bar */}
            <div className="relative mb-4 shrink-0">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gr-ink-soft" />
              <input
                type="text"
                placeholder="Cari komoditas atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-10 pr-4 py-2.5 rounded-full font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all placeholder:text-gr-ink-soft/40 shadow-inner"
              />
            </div>
 
            {/* 3. Tab Toggle Selector */}
            <div className="flex bg-gr-ink/5 p-1 rounded-full border border-gr-line mb-5 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('pricing');
                  setSearchQuery('');
                }}
                className={cn(
                  "flex-1 text-center py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === 'pricing' ? "bg-gr-board text-gr-chalk" : "text-gr-ink-soft hover:text-gr-ink"
                )}
              >
                Harga Referensi
              </button>
              <button
                onClick={() => {
                  setActiveTab('products');
                  setSearchQuery('');
                }}
                className={cn(
                  "flex-1 text-center py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === 'products' ? "bg-gr-board text-gr-chalk" : "text-gr-ink-soft hover:text-gr-ink"
                )}
              >
                Produk Terdekat
              </button>
            </div>

            {/* Layout Mode 1: Harga Referensi */}
            {activeTab === 'pricing' && (
              <>
                {/* Title and Count Badge */}
                <div className="mb-4 flex items-center justify-between shrink-0">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                      Rincian Acuan Harga
                    </span>
                    <h2 className="font-display text-2xl font-medium text-gr-board mt-0.5">
                      {selectedProvince || 'Nasional'}
                    </h2>
                  </div>
                  <span className="font-sans text-[9px] font-bold text-gr-ink bg-gr-ink/5 border border-gr-line px-2.5 py-0.5 rounded-full shadow-inner shrink-0">
                    {filteredPrices.length} ditemukan
                  </span>
                </div>
 
                {/* Dropdowns panel without duplicate search bar */}
                <div className="bg-gr-ink/2 border border-gr-line p-3 rounded-2xl shadow-inner mb-4 shrink-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={selectedProvince || ''}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-3 pr-8 py-2 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        {availableProvinces.map((prov) => (
                          <option key={prov} value={prov} className="bg-gr-paper text-gr-ink">
                            {prov}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gr-ink-soft pointer-events-none" />
                    </div>
 
                    <div className="relative">
                      <select
                        value={selectedCommodity}
                        onChange={(e) => setSelectedCommodity(e.target.value)}
                        className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                      >
                        <option value="ALL" className="bg-gr-paper text-gr-ink">Semua Komoditas</option>
                        {commodities.map((comm) => (
                          <option key={comm} value={comm} className="bg-gr-paper text-gr-ink">
                            {comm}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gr-ink-soft pointer-events-none" />
                    </div>
                  </div>
                </div>
 
                {/* Pricing Cards list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filteredPrices.length > 0 ? (
                    filteredPrices.map((item) => (
                      <div 
                        key={item.id}
                        className="p-4 bg-white hover:bg-gr-paper/30 border border-gr-line rounded-2xl flex justify-between items-center group transition-all"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-display text-sm font-semibold text-gr-ink group-hover:text-gr-board transition-colors truncate">
                            {item.commodity_name}
                          </p>
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-gr-ink-soft mt-2 bg-gr-paper/50 border border-gr-line px-2 py-0.5 rounded">
                            <Calendar size={9} />
                            {getRelativeTime(item.scraped_at)}
                          </span>
                        </div>
                        
                        <div className="shrink-0 text-right">
                          <span className="block font-mono text-sm font-bold text-gr-ink">
                            Rp {item.price_per_kg.toLocaleString('id-ID')}
                          </span>
                          <span className="font-sans text-[9px] text-gr-ink-soft uppercase tracking-widest mt-0.5 block">
                            per KG
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <Tag className="h-8 w-8 text-gr-ink-soft/20 mx-auto mb-2" />
                      <p className="font-sans text-xs text-gr-ink-soft italic">
                        Tidak ada acuan harga yang cocok
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Layout Mode 2: Produk Terdekat */}
            {activeTab === 'products' && (
              <>
                {/* Title and Count Badge */}
                <div className="mb-4 flex items-center justify-between shrink-0">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                      Pemetaan Panen Lokal
                    </span>
                    <h2 className="font-display text-2xl font-medium text-gr-board mt-0.5">
                      Produk Terdekat
                    </h2>
                  </div>
                  <span className="font-sans text-[9px] font-bold text-gr-ink bg-gr-ink/5 border border-gr-line px-2.5 py-0.5 rounded-full shadow-inner shrink-0">
                    {filteredProducts.length} ditemukan
                  </span>
                </div>
 
                {/* Radius Slider Panel */}
                <div className="bg-gr-ink/2 border border-gr-line p-4 rounded-2xl space-y-3 shadow-inner mb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                      Radius Jangkauan
                    </span>
                    <span className="font-mono text-xs text-gr-board font-bold bg-gr-board/10 px-2 py-0.5 rounded">
                      {radiusKm} KM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full accent-gr-board cursor-pointer"
                  />
                </div>
 
                {/* Products Card List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {!userLocation ? (
                    <div className="py-20 text-center space-y-3">
                      <Info className="h-8 w-8 text-gr-down mx-auto animate-pulse" />
                      <p className="font-sans text-xs text-gr-ink-soft max-w-[240px] mx-auto leading-relaxed">
                        Aktifkan lokasi di browser untuk mencari produk di sekitarmu
                      </p>
                    </div>
                  ) : fetchingProducts ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 text-gr-board animate-spin opacity-50" />
                      <span className="mt-2 font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                        Memindai Radius...
                      </span>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/produk/${prod.id}`}
                        className="p-3.5 bg-white hover:bg-gr-paper/30 border border-gr-line rounded-2xl flex gap-3 group transition-all cursor-pointer block"
                      >
                        <div className="h-16 w-16 bg-gr-paper/30 border border-gr-line rounded-xl overflow-hidden shrink-0">
                          <img
                            src={prod.photo_url || '/placeholder.png'}
                            alt={prod.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-display text-sm font-semibold text-gr-ink group-hover:text-gr-board transition-colors truncate">
                              {prod.name}
                            </h3>
                            <p className="font-sans text-[10px] text-gr-ink-soft mt-0.5">
                              Stok: {prod.quantity_kg} KG
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-mono text-sm font-bold text-gr-ink">
                              Rp {prod.price_per_kg.toLocaleString('id-ID')}/KG
                            </span>
                            {prod.distance_km !== undefined && prod.distance_km !== null && (
                              <span className="font-sans text-[9px] text-gr-down font-semibold">
                                {prod.distance_km.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <Tag className="h-8 w-8 text-gr-ink-soft/20 mx-auto mb-2" />
                      <p className="font-sans text-xs text-gr-ink-soft italic">
                        Tidak ada produk di radius ini
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>
      )}
    </main>
  );
}
