'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { TrendingUp, TrendingDown, Loader2, Calendar, ChevronDown, HelpCircle, MapPin } from 'lucide-react';
import { PriceTrendChart } from '@/components/products/price-trend-chart';
import { provinceCentroids } from '@/lib/data/province-centroids';

export default function PriceTrendPage() {
  const [commodities, setCommodities] = useState<string[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Jawa Timur');
  const [daysRange, setDaysRange] = useState<number>(30);

  // Chart data
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [fetchingChart, setFetchingChart] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Trend calculation metrics
  const trendMetrics = useMemo(() => {
    if (historyData.length < 2) return null;
    
    // Sort chronologically to make sure we compare correctly
    const sorted = [...historyData].sort(
      (a, b) => new Date(a.scraped_at).getTime() - new Date(b.scraped_at).getTime()
    );
    
    const startPrice = sorted[0].price_per_kg;
    const endPrice = sorted[sorted.length - 1].price_per_kg;
    
    const change = endPrice - startPrice;
    const percentChange = startPrice > 0 ? (change / startPrice) * 100 : 0;
    
    return {
      startPrice,
      endPrice,
      change,
      percentChange,
      isUp: change > 0,
      isDown: change < 0,
      isFlat: change === 0
    };
  }, [historyData]);

  // List of provinces
  const regionsList = useMemo(() => {
    return Object.keys(provinceCentroids).sort();
  }, []);

  // Fetch initial commodities from standard endpoint
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      try {
        const res = await referencePricesApi.getReferencePrices(1, 10);
        if (res.distinct_commodities && res.distinct_commodities.length > 0) {
          setCommodities(res.distinct_commodities);
          // Default to first commodity
          setSelectedCommodity(res.distinct_commodities[0]);
        }
      } catch (err) {
        console.error('Failed to load initial commodities list:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch history list when filters update
  const fetchHistory = useCallback(async (commodity: string, region: string, days: number) => {
    if (!commodity) return;
    setFetchingChart(true);
    try {
      const data = await referencePricesApi.getPriceHistory(commodity, region, days);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to fetch pricing history:', err);
    } finally {
      setFetchingChart(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCommodity) {
      fetchHistory(selectedCommodity, selectedRegion, daysRange);
    }
  }, [selectedCommodity, selectedRegion, daysRange, fetchHistory]);

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live flex items-center gap-2">
            <TrendingUp size={12} className="text-gr-live animate-pulse" />
            Statistik Tren
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Visualisasi Tren Harga
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/60 max-w-2xl">
            Lacak perubahan dan fluktuasi harga acuan komoditas pangan nasional secara historis berdasarkan data rekam harian PIHPS.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-text-primary/30">
              Sinkronisasi indeks komoditas...
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Control filters pill panel */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-4 items-end shadow-2xl">
              
              {/* Select Commodity */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                  Komoditas Pangan
                </label>
                <div className="relative">
                  <select
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
                  >
                    {commodities.map((comm) => (
                      <option key={comm} value={comm} className="bg-[#07080F] text-gr-text-primary">
                        {comm}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                </div>
              </div>

              {/* Select Region */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                  Wilayah Provinsi
                </label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
                  >
                    {regionsList.map((reg) => (
                      <option key={reg} value={reg} className="bg-[#07080F] text-gr-text-primary">
                        {reg}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                </div>
              </div>

              {/* Date Range filter */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                  Rentang Analisis
                </label>
                <div className="relative">
                  <select
                    value={daysRange}
                    onChange={(e) => setDaysRange(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value={7} className="bg-[#07080F] text-gr-text-primary">7 Hari Terakhir</option>
                    <option value={30} className="bg-[#07080F] text-gr-text-primary">30 Hari Terakhir</option>
                    <option value={90} className="bg-[#07080F] text-gr-text-primary">90 Hari Terakhir</option>
                    <option value={365} className="bg-[#07080F] text-gr-text-primary">1 Tahun Terakhir</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-text-primary/40 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Chart Area Card */}
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-md shadow-2xl min-h-[400px] flex items-center justify-center relative">
              {fetchingChart ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-gr-green animate-spin opacity-50" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/30">Membuat Grafik...</span>
                </div>
              ) : historyData.length >= 2 ? (
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <span className="font-sans text-[10px] text-gr-text-primary/40 flex items-center gap-1.5 uppercase font-semibold">
                      <Calendar size={10} />
                      TREN HISTORIS: {selectedCommodity}
                      {trendMetrics && (
                        <span className={`ml-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold ${
                          trendMetrics.isUp
                            ? 'text-gr-green bg-gr-green/10'
                            : trendMetrics.isDown
                            ? 'text-gr-red bg-gr-red/10'
                            : 'text-gr-text-primary/60 bg-white/5'
                        }`}>
                          {trendMetrics.isUp && <TrendingUp size={12} />}
                          {trendMetrics.isDown && <TrendingDown size={12} />}
                          {trendMetrics.percentChange > 0 ? '+' : ''}
                          {trendMetrics.percentChange.toFixed(1)}%
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-[10px] text-gr-orange flex items-center gap-1.5 uppercase font-semibold">
                      <MapPin size={10} />
                      {selectedRegion}
                    </span>
                  </div>
                  <PriceTrendChart data={historyData} />
                </div>
              ) : (
                <div className="text-center py-10 max-w-sm px-6 space-y-4">
                  <HelpCircle className="h-10 w-10 text-gr-orange/60 mx-auto animate-pulse" />
                  <h3 className="font-display text-xl font-medium text-gr-text-primary">
                    Data Historis Terbatas
                  </h3>
                  <p className="font-sans text-xs text-gr-text-primary/50 leading-relaxed">
                    Data acuan historis saat ini terlalu sedikit untuk membentuk grafik tren. Data tren akan semakin akurat seiring waktu, karena kami mengumpulkan data setiap hari.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
