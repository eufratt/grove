'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { Button } from '@/components/ui/button';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { ArrowLeft, Calendar, Loader2, Plus, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AjukanPermintaanPage() {
  const router = useRouter();
  
  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  // Form inputs
  const [commodityName, setCommodityName] = useState('');
  const [category, setCategory] = useState('SAYUR');
  const [quantity, setQuantity] = useState('');
  const [deadline, setDeadline] = useState('');

  // Autocomplete state
  const [allCommodities, setAllCommodities] = useState<string[]>([]);
  const [filteredCommodities, setFilteredCommodities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Auth check and fetch commodities
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        if (userData.role !== 'PEMBELI' && userData.role !== 'AGEN') {
          // Keep checkingAuth true, but handle restricted message in render
          setCheckingAuth(false);
          return;
        }

        // Fetch distinct commodities for autocomplete
        const refPrices = await referencePricesApi.getReferencePrices(1, 1);
        if (refPrices.distinct_commodities) {
          setAllCommodities(refPrices.distinct_commodities);
        }
        setCheckingAuth(false);
      } catch (err) {
        router.replace('/login');
      }
    };
    checkAuthAndLoad();
  }, [router]);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter commodities on input change
  const handleCommodityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommodityName(val);
    if (val.trim() === '') {
      setFilteredCommodities([]);
      setShowDropdown(false);
    } else {
      const filtered = allCommodities.filter((item) =>
        item.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredCommodities(filtered);
      setShowDropdown(true);
    }
  };

  const selectCommodity = (name: string) => {
    setCommodityName(name);
    setShowDropdown(false);
  };

  // Get minimum date (7 days from today)
  const getMinDateString = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!commodityName.trim()) {
      setError('Nama komoditas harus diisi');
      return;
    }
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Jumlah (kg) harus bernilai lebih dari 0');
      return;
    }
    if (!deadline) {
      setError('Tanggal tenggat waktu (deadline) harus ditentukan');
      return;
    }

    const minDeadline = new Date();
    minDeadline.setDate(minDeadline.getDate() + 7);
    const selectedDeadline = new Date(deadline);
    if (selectedDeadline < minDeadline) {
      setError('Tenggat waktu minimal harus 1 minggu dari hari ini');
      return;
    }

    setLoading(true);
    try {
      const res = await demandRequestsApi.createDemandRequest({
        commodity_name: commodityName,
        category,
        quantity_kg_needed: parsedQty,
        deadline: new Date(deadline).toISOString()
      });
      router.push(`/permintaan/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan permintaan');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    );
  }

  // Restricted access for non-buyers / non-agents
  if (user && user.role !== 'PEMBELI' && user.role !== 'AGEN') {
    return (
      <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <BgPattern />
        <FilmGrain />
        <div className="relative z-10 max-w-md w-full bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
          <AlertTriangle className="h-16 w-16 text-gr-orange mx-auto mb-6 animate-pulse" />
          <h2 className="font-display text-2xl font-medium text-gr-text-primary mb-3">Akses Dibatasi</h2>
          <p className="font-sans text-sm text-gr-text-primary/60 mb-6 leading-relaxed">
            Halaman ini khusus untuk Pembeli atau Agen mengajukan permintaan hasil panen di masa depan. Akun Anda terdaftar sebagai <span className="font-bold text-gr-green">{user.role}</span>.
          </p>
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-gr-text-primary font-sans text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/permintaan-saya" 
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
          >
            <ArrowLeft size={12} />
            Kembali ke Permintaan Saya
          </Link>
        </div>

        <header className="mb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
            Form Pemesanan
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
            Ajukan Permintaan
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/60">
            Ajukan kebutuhan komoditas panen di masa depan agar para petani lokal dapat mulai mempersiapkan dan mengalokasikan hasil kebun mereka untuk Anda.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent" />
        </header>

        {/* Form Container */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 backdrop-blur-md shadow-2xl">
          {error && (
            <div className="mb-6 rounded-2xl bg-gr-price-unfair/10 p-4 text-xs text-gr-price-unfair border border-gr-price-unfair/20 flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Commodity Name Autocomplete */}
            <div className="relative" ref={dropdownRef}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                Nama Komoditas
              </label>
              <input
                type="text"
                placeholder="Contoh: Beras Medium, Cabai Rawit Merah..."
                value={commodityName}
                onChange={handleCommodityChange}
                onFocus={() => commodityName && setFilteredCommodities(allCommodities.filter(item => item.toLowerCase().includes(commodityName.toLowerCase())))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary px-4 py-3 rounded-2xl font-sans text-sm focus:outline-none transition-all placeholder:text-gr-text-primary/30"
              />
              {/* Autocomplete Dropdown */}
              {showDropdown && filteredCommodities.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-[#07080F]/95 backdrop-blur-xl shadow-2xl z-30 divide-y divide-white/5">
                  {filteredCommodities.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectCommodity(item)}
                      className="w-full text-left px-4 py-3 font-sans text-xs text-gr-text-primary/80 hover:text-gr-green hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                Kategori
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary px-4 py-3 rounded-2xl font-sans text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="SAYUR" className="bg-[#07080F] text-gr-text-primary">Sayur-mayur</option>
                  <option value="BUAH" className="bg-[#07080F] text-gr-text-primary">Buah-buahan</option>
                  <option value="POKOK" className="bg-[#07080F] text-gr-text-primary">Kebutuhan Pokok</option>
                  <option value="LAINNYA" className="bg-[#07080F] text-gr-text-primary">Lain-lain</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gr-text-primary/40">
                  <Plus size={14} className="rotate-45" />
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                Jumlah yang Dibutuhkan (KG)
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                placeholder="Contoh: 150"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary px-4 py-3 rounded-2xl font-sans text-sm focus:outline-none transition-all placeholder:text-gr-text-primary/30"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 mb-2">
                Batas Akhir Pemenuhan (Deadline)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={getMinDateString()}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary pl-11 pr-4 py-3 rounded-2xl font-sans text-sm focus:outline-none transition-all cursor-pointer"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gr-text-primary/30 pointer-events-none" />
              </div>
              <p className="mt-2 font-sans text-[10px] text-gr-text-primary/40 leading-relaxed flex items-center gap-1.5">
                <Info size={11} className="text-gr-live shrink-0" />
                Minimal 1 minggu dari hari ini agar petani memiliki waktu persiapan tanam/panen.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gr-green/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Pengajuan...
                  </>
                ) : (
                  <>
                    Ajukan Permintaan Sekarang
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
