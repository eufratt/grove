'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Search, ChevronLeft, ChevronRight, TrendingUp, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [items, setItems] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const LIMIT = 15;

  const fetchReferencePrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await referencePricesApi.getReferencePrices(
        page,
        LIMIT,
        selectedCommodity === 'ALL' ? undefined : selectedCommodity,
        searchQuery || undefined
      );
      setItems(data.items);
      setTotalItems(data.total);
      setTotalPages(data.pages);
      if (data.distinct_commodities) {
        setCommodities(data.distinct_commodities);
      }
    } catch (err) {
      console.error('Failed to fetch reference prices:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCommodity, searchQuery]);

  useEffect(() => {
    fetchReferencePrices();
  }, [fetchReferencePrices]);

  // Reset page when filters change
  const handleFilterChange = (commodity: string) => {
    setSelectedCommodity(commodity);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live flex items-center gap-2">
            <TrendingUp size={12} className="text-gr-live" />
            Acuan Harga PIHPS
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Harga Pasar Nasional
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/60 max-w-2xl">
            Pantau harga acuan komoditas pangan pokok secara real-time berdasarkan data resmi Pusat Informasi Harga Pangan Strategis (PIHPS) Nasional.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gr-text-primary/30" />
            <input
              type="text"
              placeholder="Cari komoditas atau wilayah..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary pl-11 pr-4 py-3 rounded-2xl font-sans text-sm focus:outline-none focus:border-gr-green/50 transition-all placeholder:text-gr-text-primary/30"
            />
          </div>

          {/* Commodity Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedCommodity}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary px-4 py-3 rounded-2xl font-sans text-sm focus:outline-none focus:border-gr-green/50 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#07080F] text-gr-text-primary">Semua Komoditas</option>
              {commodities.map((comm) => (
                <option key={comm} value={comm} className="bg-[#07080F] text-gr-text-primary">
                  {comm}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gr-text-primary/40">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Table/List View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-4 sm:p-5 font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40">Komoditas</th>
                    <th className="p-4 sm:p-5 font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40">Wilayah</th>
                    <th className="p-4 sm:p-5 font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40 text-right">Harga Acuan</th>
                    <th className="p-4 sm:p-5 font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40 text-right">Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-white/[0.01] transition-colors duration-200 group"
                    >
                      <td className="p-4 sm:p-5 font-display text-base font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
                        {item.commodity_name}
                      </td>
                      <td className="p-4 sm:p-5 font-sans text-sm text-gr-text-primary/60">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gr-text-primary/30" />
                          <span>{item.region}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 font-mono text-sm font-semibold text-right text-gr-green">
                        Rp {item.price_per_kg.toLocaleString('id-ID')}/kg
                      </td>
                      <td className="p-4 sm:p-5 font-sans text-xs text-gr-text-primary/40 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar size={11} />
                          <span>{getRelativeTime(item.scraped_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-white/5 bg-white/[0.01]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/40">
                  Menampilkan {items.length} dari {totalItems} entri
                </span>
                
                <div className="flex items-center gap-3">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-full border border-white/10 hover:border-gr-green/30 hover:bg-gr-green/5 text-gr-text-primary/60 hover:text-gr-green disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  <span className="font-mono text-xs text-gr-text-primary">
                    Halaman {page} dari {totalPages}
                  </span>

                  <Button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-full border border-white/10 hover:border-gr-green/30 hover:bg-gr-green/5 text-gr-text-primary/60 hover:text-gr-green disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <Search className="h-12 w-12 text-gr-text-primary/20 mb-4" />
            <span className="font-display text-2xl text-gr-text-primary/20">
              Tidak ada data acuan harga
            </span>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/40 max-w-xs">
              Silakan ganti kata pencarian atau bersihkan filter Anda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
