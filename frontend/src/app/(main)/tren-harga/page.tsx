'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BASE_URL } from '@/lib/api/client';
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

  // Divergence score & streaming details states
  const [divergenceData, setDivergenceData] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('Menganalisis tren harga...');
  const [explanationText, setExplanationText] = useState<string>('');
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  // Fetch divergence score on filters update
  useEffect(() => {
    const fetchDivergence = async () => {
      if (!selectedCommodity) return;
      try {
        const data = await referencePricesApi.getPriceDivergence(selectedCommodity, selectedRegion, daysRange);
        setDivergenceData(data);
      } catch (err) {
        console.error('Failed to fetch divergence score:', err);
      }
    };

    setDivergenceData(null);
    setExplanationText('');
    setShowTechDetails(false);
    fetchDivergence();
  }, [selectedCommodity, selectedRegion, daysRange]);

  const handleExplain = async () => {
    if (!selectedCommodity) return;
    setIsExplaining(true);
    setExplanationText('');
    
    // Staged loading text cycling
    const loadingStages = [
      'Menganalisis tren harga...',
      'Mendeteksi pola fluktuasi harian...',
      'Menghubungkan ke Groq LLM...'
    ];
    let stageIdx = 0;
    setLoadingText(loadingStages[0]);
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % loadingStages.length;
      setLoadingText(loadingStages[stageIdx]);
    }, 800);

    try {
      const url = `${BASE_URL}/reference-prices/divergence/stream?commodity=${encodeURIComponent(selectedCommodity)}&region=${encodeURIComponent(selectedRegion)}&days=${daysRange}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      // Clear loading stages and start stream rendering
      clearInterval(stageInterval);
      setIsStreaming(true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const payload = JSON.parse(dataStr);
              if (payload.type === 'stats') {
                setDivergenceData(payload.data);
              } else if (payload.type === 'chunk') {
                setExplanationText(prev => prev + payload.text);
              }
            } catch (err) {
              console.error('Failed to parse SSE payload:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Explanation streaming failed:', err);
      // Fallback
      try {
        const staticData = await referencePricesApi.getPriceDivergence(selectedCommodity, selectedRegion, daysRange);
        setDivergenceData(staticData);
        setExplanationText(staticData.explanation);
      } catch (fallbackErr) {
        console.error('Fallback explanation failed:', fallbackErr);
        setExplanationText('Gagal menghubungkan ke layanan AI. Silakan coba sesaat lagi.');
      }
    } finally {
      clearInterval(stageInterval);
      setIsExplaining(false);
      setIsStreaming(false);
    }
  };

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
    <main className="relative flex-1 bg-gr-paper py-10">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />

      <div className="relative z-10 w-full">
        <header className="mb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-board flex items-center gap-2">
            <TrendingUp size={12} className="text-gr-board animate-pulse" />
            Statistik Tren
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-ink">
            Visualisasi Tren Harga
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-ink-soft max-w-2xl">
            Lacak perubahan dan fluktuasi harga acuan komoditas pangan nasional secara historis berdasarkan data rekam harian PIHPS.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-board/30 via-gr-line to-transparent" />
        </header>

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="h-12 w-12 text-gr-board animate-spin opacity-50" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-ink-soft">
              Sinkronisasi indeks komoditas...
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Control filters pill panel */}
            <div className="bg-white border border-gr-line p-5 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end shadow-sm">
              
              {/* Select Commodity */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft mb-2">
                  Komoditas Pangan
                </label>
                <div className="relative">
                  <select
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all appearance-none cursor-pointer"
                  >
                    {commodities.map((comm) => (
                      <option key={comm} value={comm} className="bg-gr-paper text-gr-ink">
                        {comm}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-ink-soft pointer-events-none" />
                </div>
              </div>

              {/* Select Region */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft mb-2">
                  Wilayah Provinsi
                </label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all appearance-none cursor-pointer"
                  >
                    {regionsList.map((reg) => (
                      <option key={reg} value={reg} className="bg-gr-paper text-gr-ink">
                        {reg}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-ink-soft pointer-events-none" />
                </div>
              </div>

              {/* Date Range filter */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft mb-2">
                  Rentang Analisis
                </label>
                <div className="relative">
                  <select
                    value={daysRange}
                    onChange={(e) => setDaysRange(parseInt(e.target.value))}
                    className="w-full bg-gr-paper/30 border border-gr-line hover:border-gr-ink-soft/30 text-gr-ink pl-3 pr-8 py-2.5 rounded-xl font-sans text-xs focus:outline-none focus:border-gr-board/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value={7} className="bg-gr-paper text-gr-ink">7 Hari Terakhir</option>
                    <option value={30} className="bg-gr-paper text-gr-ink">30 Hari Terakhir</option>
                    <option value={90} className="bg-gr-paper text-gr-ink">90 Hari Terakhir</option>
                    <option value={365} className="bg-gr-paper text-gr-ink">1 Tahun Terakhir</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gr-ink-soft pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Chart Area Card */}
            <div className="bg-white border border-gr-line p-6 rounded-3xl shadow-sm min-h-[400px] flex items-center justify-center relative">
              {fetchingChart ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-gr-board animate-spin opacity-50" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">Membuat Grafik...</span>
                </div>
              ) : historyData.length >= 2 ? (
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center px-4 gap-2 flex-wrap">
                    <span className="font-sans text-[10px] text-gr-ink-soft flex items-center gap-1.5 uppercase font-semibold flex-wrap">
                      <Calendar size={10} />
                      TREN HISTORIS: {selectedCommodity}
                      {divergenceData && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-sm font-mono text-[9px] font-bold border ${
                          divergenceData.divergence_score < -5.0
                            ? 'text-gr-up bg-gr-up/10 border-gr-up/20'
                            : divergenceData.divergence_score > 5.0
                            ? 'text-gr-down bg-gr-down/10 border-gr-down/20'
                            : 'text-gr-ink-soft bg-gr-ink/5 border-gr-line'
                        }`}>
                          {divergenceData.classification} ({divergenceData.divergence_score > 0 ? '+' : ''}{divergenceData.divergence_score.toFixed(1)}%)
                        </span>
                      )}
                      {trendMetrics && (
                        <span className={`ml-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold ${
                          trendMetrics.isUp
                            ? 'text-gr-up bg-gr-up/10'
                            : trendMetrics.isDown
                            ? 'text-gr-down bg-gr-down/10'
                            : 'text-gr-ink-soft bg-gr-ink/5'
                        }`}>
                          {trendMetrics.isUp && <TrendingUp size={12} />}
                          {trendMetrics.isDown && <TrendingDown size={12} />}
                          {trendMetrics.percentChange > 0 ? '+' : ''}
                          {trendMetrics.percentChange.toFixed(1)}%
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-[10px] text-gr-board flex items-center gap-1.5 uppercase font-semibold">
                      <MapPin size={10} />
                      {selectedRegion}
                    </span>
                  </div>
                  <PriceTrendChart data={historyData} />
                </div>
              ) : (
                <div className="text-center py-10 max-w-sm px-6 space-y-4">
                  <HelpCircle className="h-10 w-10 text-gr-board/60 mx-auto animate-pulse" />
                  <h3 className="font-display text-xl font-medium text-gr-ink">
                    Data Historis Terbatas
                  </h3>
                  <p className="font-sans text-xs text-gr-ink-soft leading-relaxed">
                    Data acuan historis saat ini terlalu sedikit untuk membentuk grafik tren. Data tren akan semakin akurat seiring waktu, karena kami mengumpulkan data setiap hari.
                  </p>
                </div>
              )}
            </div>

            {/* Divergence Analysis Card */}
            {historyData.length >= 2 && (
              <div className="bg-white border border-gr-line p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gr-line pb-3 flex-wrap gap-2">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-gr-board font-bold flex items-center gap-2">
                    <TrendingUp size={14} />
                    Analisis Stabilitas Harga AI (Groq)
                  </h3>
                  {divergenceData && (
                    <span className={`px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold border ${
                      divergenceData.divergence_score < -5.0
                        ? 'text-gr-up bg-gr-up/10 border-gr-up/20'
                        : divergenceData.divergence_score > 5.0
                        ? 'text-gr-down bg-gr-down/10 border-gr-down/20'
                        : 'text-gr-ink-soft bg-gr-ink/5 border-gr-line'
                    }`}>
                      {divergenceData.classification}
                    </span>
                  )}
                </div>

                {explanationText ? (
                  <div className="space-y-4">
                    <p className="font-sans text-sm text-gr-ink leading-relaxed whitespace-pre-wrap">
                      {explanationText}
                      {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-gr-board animate-pulse" />}
                    </p>
                    
                    {/* Technical Details Toggle */}
                    <div className="pt-2">
                      <button
                        onClick={() => setShowTechDetails(!showTechDetails)}
                        className="font-mono text-[10px] uppercase tracking-wider text-gr-ink-soft hover:text-gr-ink flex items-center gap-1 transition-colors focus:outline-none"
                      >
                        <span>Lihat detail teknis</span>
                        <ChevronDown size={12} className={`transform transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showTechDetails && divergenceData && (
                        <div className="mt-3 bg-gr-paper/30 border border-gr-line rounded-2xl p-4 font-mono text-xs text-gr-ink-soft space-y-2.5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider opacity-60">Divergence Score</span>
                              <span className="font-bold text-gr-ink">{divergenceData.divergence_score > 0 ? '+' : ''}{divergenceData.divergence_score.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider opacity-60">Rata-rata Simpangan</span>
                              <span className="font-bold text-gr-ink">Rp {divergenceData.average_oscillation_amplitude.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider opacity-60">Siklus Fluktuasi</span>
                              <span className="font-bold text-gr-ink">{divergenceData.average_oscillation_frequency_days.toFixed(1)} hari</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider opacity-60">Tanggal Dihitung</span>
                              <span className="font-bold text-gr-ink">{new Date().toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <p className="font-sans text-xs text-gr-ink-soft">
                      Ingin memahami apakah fluktuasi harga komoditas ini wajar atau sedang tidak stabil? Dapatkan analisis mendalam dari AI.
                    </p>
                    <button
                      onClick={handleExplain}
                      disabled={isExplaining}
                      className="font-mono text-xs uppercase tracking-widest bg-gr-board text-gr-chalk border border-gr-board hover:bg-gr-board/90 px-6 py-3.5 rounded-xl transition-all duration-300 disabled:opacity-80 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      {isExplaining ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <span>Jelaskan Tren Harga</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
