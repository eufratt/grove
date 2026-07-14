'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Search, MapPin, Calendar, Loader2, TrendingUp, ChevronDown, Info, Tag } from 'lucide-react';
import { provinceCentroids } from '@/lib/data/province-centroids';
import dynamic from 'next/dynamic';

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
  const [allPrices, setAllPrices] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  
  // Filter settings
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status & Geolocation
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Group prices by province (excluding National 'Nasional' averages)
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

  // Geolocation and base queries fetch
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
              setLocationMessage('Aktifkan lokasi untuk melihat acuan harga di daerahmu');
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

  // Sidebar list filters
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
            {/* Interactive Map Area (Dominant - 3/5 width on desktop) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                  Sebaran Peta Provinsi
                </span>
                {selectedProvince && (
                  <span className="font-sans text-xs text-gr-green bg-gr-green/10 px-3 py-0.5 rounded-full border border-gr-green/20">
                    Provinsi Terpilih: {selectedProvince}
                  </span>
                )}
              </div>
              <MapView
                mode="pricing"
                pricesByProvince={pricesByProvince}
                selectedProvince={selectedProvince}
                onSelectProvince={setSelectedProvince}
                userLocation={userLocation}
              />
            </div>

            {/* Sidebar Dark Panel (Right - 2/5 width on desktop) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-2xl flex flex-col min-h-[550px] max-h-[590px]">
              
              {/* Region Title */}
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

              {/* Sidebar List panel (card-list vertikal) */}
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
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
