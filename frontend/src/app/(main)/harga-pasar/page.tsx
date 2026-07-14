'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Search, MapPin, Calendar, Loader2, TrendingUp, ChevronDown, Info } from 'lucide-react';
import { provinceCentroids } from '@/lib/data/province-centroids';
import dynamic from 'next/dynamic';

// Dynamically import pricing map component to avoid SSR window is not defined errors
const PricingMapView = dynamic(() => import('@/components/products/pricing-map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-white/5 rounded-3xl border border-white/5 animate-pulse">
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
  
  // Selection/filter state
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Location/loading status
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Group prices by province (excluding National)
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

  // List of all provinces available in database
  const availableProvinces = useMemo(() => {
    return Object.keys(pricesByProvince).sort();
  }, [pricesByProvince]);

  // Helper to fallback when geolocation is denied or disabled
  const selectFallbackProvince = useCallback((items: any[]) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const region = item.region;
      if (region && region !== 'Nasional') {
        counts[region] = (counts[region] || 0) + 1;
      }
    });
    let maxRegion = 'Jawa Timur'; // baseline fallback
    let maxCount = 0;
    Object.entries(counts).forEach(([reg, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxRegion = reg;
      }
    });
    setSelectedProvince(maxRegion);
  }, []);

  // Fetch all reference prices and trigger geolocation on load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Query high limit (500) to fetch all records in Indonesia (~330 rows)
        const data = await referencePricesApi.getReferencePrices(1, 500);
        setAllPrices(data.items);
        if (data.distinct_commodities) {
          setCommodities(data.distinct_commodities);
        }

        // Trigger Geolocation
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const uLat = position.coords.latitude;
              const uLng = position.coords.longitude;
              setUserLocation([uLat, uLng]);
              setLocationMessage(null);

              // Find closest province from province-centroids
              let closestProv = 'Di Yogyakarta';
              let minDist = Infinity;
              Object.entries(provinceCentroids).forEach(([provName, coords]) => {
                const dist = Math.sqrt((coords.lat - uLat) ** 2 + (coords.lng - uLng) ** 2);
                if (dist < minDist) {
                  minDist = dist;
                  closestProv = provName;
                }
              });

              // Check if the closest province has pricing data in the DB
              if (Object.keys(pricesByProvince).includes(closestProv)) {
                setSelectedProvince(closestProv);
              } else if (data.items.length > 0) {
                selectFallbackProvince(data.items);
              }
            },
            (error) => {
              console.warn('Geolocation failed/denied:', error.message);
              selectFallbackProvince(data.items);
              setLocationMessage('Aktifkan lokasi untuk melihat harga di daerahmu');
            },
            { timeout: 5000 }
          );
        } else {
          selectFallbackProvince(data.items);
        }
      } catch (err) {
        console.error('Failed to load reference prices data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectFallbackProvince]);

  // Filter prices list for the sidebar
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
        <header className="mb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live flex items-center gap-2">
            <TrendingUp size={12} className="text-gr-live animate-pulse" />
            Acuan Harga PIHPS
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Harga Pasar Nasional
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/60 max-w-3xl">
            Pantau harga acuan komoditas pangan pokok secara real-time berdasarkan data resmi Pusat Informasi Harga Pangan Strategis (PIHPS) Nasional di seluruh provinsi Indonesia.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {/* Geolocation fallback status notification */}
        {locationMessage && (
          <div className="mb-6 rounded-2xl bg-gr-orange/10 p-4 text-xs text-gr-orange border border-gr-orange/20 flex items-center gap-2 max-w-md">
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
            {/* Interactive Map (Left - 3/5 width on desktop) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
                  PETA INTERAKTIF PROVINSI
                </span>
                {selectedProvince && (
                  <span className="font-sans text-xs text-gr-green bg-gr-green/10 px-3 py-0.5 rounded-full border border-gr-green/20">
                    Aktif: {selectedProvince}
                  </span>
                )}
              </div>
              <PricingMapView
                pricesByProvince={pricesByProvince}
                selectedProvince={selectedProvince}
                onSelectProvince={setSelectedProvince}
                userLocation={userLocation}
              />
            </div>

            {/* Sidebar (Right - 2/5 width on desktop) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-2xl space-y-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40">
                  SIDEBAR HARGA REGIONAL
                </span>
                <h2 className="font-display text-3xl font-medium text-gr-orange mt-2">
                  {selectedProvince || 'Pilih Provinsi'}
                </h2>
              </div>

              {/* Toolbar filters inside sidebar */}
              <div className="space-y-4 pt-2 border-t border-white/5">
                {/* Select Province */}
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-1.5">
                    Pilih Provinsi
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvince || ''}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary px-3.5 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
                    >
                      {availableProvinces.map((prov) => (
                        <option key={prov} value={prov} className="bg-[#07080F] text-gr-text-primary">
                          {prov}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                  </div>
                </div>

                {/* Select Commodity */}
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-1.5">
                    Pilih Komoditas
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCommodity}
                      onChange={(e) => setSelectedCommodity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary px-3.5 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#07080F] text-gr-text-primary">Semua Komoditas</option>
                      {commodities.map((comm) => (
                        <option key={comm} value={comm} className="bg-[#07080F] text-gr-text-primary">
                          {comm}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                  </div>
                </div>

                {/* Search query input */}
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-1.5">
                    Cari Nama Komoditas
                  </label>
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gr-text-primary/30" />
                    <input
                      type="text"
                      placeholder="Contoh: Beras, Cabai..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-9 pr-3 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all placeholder:text-gr-text-primary/30"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar List items */}
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 pt-4 border-t border-white/5">
                {filteredPrices.length > 0 ? (
                  filteredPrices.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-white/2 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-display text-sm font-semibold text-gr-text-primary group-hover:text-gr-green transition-colors truncate">
                          {item.commodity_name}
                        </p>
                        <span className="flex items-center gap-1 font-sans text-[10px] text-gr-text-primary/40 mt-1">
                          <Calendar size={10} />
                          {getRelativeTime(item.scraped_at)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block font-mono text-sm font-bold text-gr-green">
                          Rp {item.price_per_kg.toLocaleString('id-ID')}
                        </span>
                        <span className="font-sans text-[8px] uppercase tracking-wider text-gr-text-primary/30">
                          per KG
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Search className="h-8 w-8 text-gr-text-primary/10 mx-auto mb-2" />
                    <p className="font-sans text-xs text-gr-text-primary/30 italic">
                      Tidak ada data acuan harga cocok
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
