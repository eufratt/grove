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
    <div className="h-[550px] w-full flex items-center justify-center bg-white/5 rounded-3xl border border-white/5 animate-pulse">
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

              if (Object.keys(pricesByProvince).includes(closestProv)) {
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

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-8">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live flex items-center gap-2">
            <TrendingUp size={12} className="text-gr-live animate-pulse" />
            Acuan Harga PIHPS
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Harga Pasar Nasional
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/60 max-w-3xl">
            Integrasi acuan harga komoditas pangan pokok strategis dari Pusat Informasi Harga Pangan Strategis (PIHPS) Indonesia, disajikan dalam bentuk peta sebaran data interaktif.
          </p>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {locationMessage && (
          <div className="mb-6 rounded-2xl bg-gr-orange/10 p-3.5 text-xs text-gr-orange border border-gr-orange/20 flex items-center gap-2 max-w-md">
            <Info size={14} className="shrink-0" />
            <span>{locationMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              Sinkronisasi data wilayah...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Map Area (Left - 3/5 width on desktop) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                  {activeTab === 'pricing' ? 'Sebaran Peta Provinsi' : 'Peta Jangkauan Produk'}
                </span>
                {activeTab === 'pricing' && selectedProvince && (
                  <span className="font-sans text-xs text-gr-green bg-gr-green/10 px-3 py-0.5 rounded-full border border-gr-green/20">
                    Provinsi Terpilih: {selectedProvince}
                  </span>
                )}
                {activeTab === 'products' && userLocation && (
                  <span className="font-sans text-xs text-gr-green bg-gr-green/10 px-3 py-0.5 rounded-full border border-gr-green/20">
                    Radius Deteksi: {radiusKm} KM
                  </span>
                )}
              </div>
              
              <MapView
                mode={activeTab}
                products={activeTab === 'products' ? nearbyProducts : []}
                radiusKm={radiusKm}
                pricesByProvince={pricesByProvince}
                selectedProvince={activeTab === 'pricing' ? selectedProvince : null}
                onSelectProvince={setSelectedProvince}
                userLocation={userLocation}
              />
            </div>

            {/* Sidebar Dark Panel (Right - 2/5 width on desktop) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-2xl flex flex-col min-h-[550px] max-h-[590px]">
              
              {/* Tab Toggle Selector */}
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mb-6 shrink-0">
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={cn(
                    "flex-1 text-center py-2.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                    activeTab === 'pricing' ? "bg-gr-green text-gr-bg" : "text-gr-text-primary/40 hover:text-gr-text-primary"
                  )}
                >
                  Harga Referensi
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={cn(
                    "flex-1 text-center py-2.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                    activeTab === 'products' ? "bg-gr-green text-gr-bg" : "text-gr-text-primary/40 hover:text-gr-text-primary"
                  )}
                >
                  Produk Terdekat
                </button>
              </div>

              {/* Layout Mode 1: Harga Referensi */}
              {activeTab === 'pricing' && (
                <>
                  <div className="mb-5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                      Rincian Acuan Harga
                    </span>
                    <h2 className="font-display text-3xl font-medium text-gr-orange mt-1">
                      {selectedProvince || 'Nasional'}
                    </h2>
                  </div>

                  {/* Floating Pill Filters Panel */}
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl space-y-3 shadow-inner mb-6">
                    {/* Search input */}
                    <div className="relative">
                      <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/30" />
                      <input
                        type="text"
                        placeholder="Cari Komoditas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-9 pr-3 py-2 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all placeholder:text-gr-text-primary/30"
                      />
                    </div>

                    {/* Dropdown selectors side-by-side */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <select
                          value={selectedProvince || ''}
                          onChange={(e) => setSelectedProvince(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-3 pr-8 py-2 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                        >
                          {availableProvinces.map((prov) => (
                            <option key={prov} value={prov} className="bg-[#07080F] text-gr-text-primary">
                              {prov}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select
                          value={selectedCommodity}
                          onChange={(e) => setSelectedCommodity(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-3 pr-8 py-2 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                        >
                          <option value="ALL" className="bg-[#07080F] text-gr-text-primary">Semua Komoditas</option>
                          {commodities.map((comm) => (
                            <option key={comm} value={comm} className="bg-[#07080F] text-gr-text-primary">
                              {comm}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Cards list */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {filteredPrices.length > 0 ? (
                      filteredPrices.map((item) => (
                        <div 
                          key={item.id}
                          className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl flex justify-between items-center group transition-all"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="font-display text-sm font-semibold text-gr-text-primary group-hover:text-gr-green transition-colors truncate">
                              {item.commodity_name}
                            </p>
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-gr-text-primary/40 mt-2 bg-white/5 px-2 py-0.5 rounded">
                              <Calendar size={9} />
                              {getRelativeTime(item.scraped_at)}
                            </span>
                          </div>
                          
                          <div className="shrink-0 text-right">
                            <span className="block font-mono text-sm font-bold text-gr-green">
                              Rp {item.price_per_kg.toLocaleString('id-ID')}
                            </span>
                            <span className="font-sans text-[9px] text-gr-text-primary/30 uppercase tracking-widest mt-0.5 block">
                              per KG
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <Tag className="h-8 w-8 text-gr-text-primary/10 mx-auto mb-2" />
                        <p className="font-sans text-xs text-gr-text-primary/30 italic">
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
                  <div className="mb-5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                      Pemetaan Panen Lokal
                    </span>
                    <h2 className="font-display text-3xl font-medium text-gr-orange mt-1">
                      Produk Terdekat
                    </h2>
                  </div>

                  {/* Radius Slider Panel */}
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl space-y-3 shadow-inner mb-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                        Radius Jangkauan
                      </span>
                      <span className="font-mono text-xs text-gr-green font-bold bg-gr-green/10 px-2 py-0.5 rounded">
                        {radiusKm} KM
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                      className="w-full accent-gr-green cursor-pointer"
                    />
                  </div>

                  {/* Products Card List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {!userLocation ? (
                      <div className="py-20 text-center space-y-3">
                        <Info className="h-8 w-8 text-gr-orange mx-auto animate-pulse" />
                        <p className="font-sans text-xs text-gr-text-primary/40 max-w-[240px] mx-auto leading-relaxed">
                          Aktifkan lokasi di browser untuk mencari produk di sekitarmu
                        </p>
                      </div>
                    ) : fetchingProducts ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-gr-green animate-spin opacity-50" />
                        <span className="mt-2 font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/30">
                          Memindai Radius...
                        </span>
                      </div>
                    ) : nearbyProducts.length > 0 ? (
                      nearbyProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          href={`/produk/${prod.id}`}
                          className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl flex gap-3 group transition-all cursor-pointer block"
                        >
                          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0">
                            <img
                              src={prod.photo_url || '/placeholder.png'}
                              alt={prod.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-display text-sm font-semibold text-gr-text-primary group-hover:text-gr-green transition-colors truncate">
                                {prod.name}
                              </h3>
                              <p className="font-sans text-[10px] text-gr-text-primary/40 mt-0.5">
                                Stok: {prod.quantity_kg} KG
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="font-mono text-sm font-bold text-gr-green">
                                Rp {prod.price_per_kg.toLocaleString('id-ID')}/KG
                              </span>
                              {prod.distance_km !== undefined && prod.distance_km !== null && (
                                <span className="font-sans text-[9px] text-gr-orange font-semibold">
                                  {prod.distance_km.toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <Tag className="h-8 w-8 text-gr-text-primary/10 mx-auto mb-2" />
                        <p className="font-sans text-xs text-gr-text-primary/30 italic">
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
      </div>
    </main>
  );
}
