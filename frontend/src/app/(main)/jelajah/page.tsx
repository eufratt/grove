'use client';

import React, { useState, useEffect } from 'react';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { authApi } from '@/lib/api/auth';
import { SwipeDeck } from '@/components/products/swipe-deck';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Loader2, Compass } from 'lucide-react';
import Link from 'next/link';

export default function JelajahPage() {
  const [demandRequests, setDemandRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const fetchDemandRequests = async () => {
    setIsLoading(true);
    try {
      const data = await demandRequestsApi.getOpenDemandRequests();
      setDemandRequests(data);
    } catch (error) {
      console.error('Failed to fetch demand requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
      await fetchDemandRequests();
    };
    init();
  }, []);

  return (
    <main className="relative flex-1 bg-gr-paper py-10 overflow-hidden min-h-[calc(100vh-80px)]">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-board)" position="top" className="opacity-5 scale-110 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 md:px-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gr-board/5 border border-gr-board/15 text-gr-board font-mono text-[10px] uppercase tracking-widest mb-3">
            <Compass size={12} className="animate-spin-slow" />
            <span>Marketplace Real-Time</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-gr-ink font-bold">
            Jelajah Permintaan Pangan
          </h1>
          <p className="mt-2 font-sans text-sm text-gr-ink-soft max-w-lg mx-auto">
            Temukan dan penuhi permintaan kebutuhan pangan langsung dari pembeli di sekitar lokasi Anda.
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-gr-line to-transparent" />
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-12 w-12 text-gr-board animate-spin opacity-60" />
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-gr-ink-soft">
              Memuat permintaan...
            </span>
          </div>
        ) : (!user || user.role === 'PEMBELI') ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 max-w-md mx-auto bg-gr-paper border border-gr-line p-8 rounded-3xl shadow-sm backdrop-blur-xl">
            <Compass className="h-16 w-16 text-gr-board animate-pulse" />
            <h3 className="font-display text-2xl text-gr-ink">Mode Jelajah Terbatas</h3>
            <p className="font-sans text-sm text-gr-ink-soft leading-relaxed">
              Mode Jelajah (Swipe Deck) dirancang khusus bagi para petani untuk menemukan dan berkomitmen memenuhi permintaan hasil panen dari pembeli.
            </p>
            <div className="bg-gr-board/5 border border-gr-board/10 p-4 rounded-2xl text-xs text-gr-board font-sans leading-relaxed">
              Sebagai pembeli, kamu bisa mengajukan permintaan di sini untuk dipenuhi oleh petani lokal.
            </div>
            <Link
              href="/permintaan-saya"
              className="inline-flex items-center gap-2 bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-sans text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all cursor-pointer shadow-sm"
            >
              Ajukan Permintaan Baru
            </Link>
          </div>
        ) : (
          <SwipeDeck
            requests={demandRequests}
            onSwipeRight={fetchDemandRequests}
            onSwipeLeft={(r) => {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Skipped demand: ${r.commodity_name}`);
              }
            }}
            onEmpty={fetchDemandRequests}
          />
        )}
      </div>
    </main>
  );
}
