'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ClipboardList, Loader2, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function PermintaanSayaPage() {
  const router = useRouter();
  
  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  // Demands state
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initPage = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        if (userData.role !== 'PEMBELI') {
          setCheckingAuth(false);
          return;
        }

        const data = await demandRequestsApi.getMyDemandRequests();
        setRequests(data);
        setCheckingAuth(false);
      } catch (err: any) {
        console.error('Failed to init mine page:', err);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [router]);

  if (checkingAuth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    );
  }

  // Restricted access screen
  if (user && user.role !== 'PEMBELI') {
    return (
      <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <BgPattern />
        <FilmGrain />
        <div className="relative z-10 max-w-md w-full bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
          <ClipboardList className="h-16 w-16 text-gr-orange mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-2xl font-medium text-gr-text-primary mb-3">Akses Dibatasi</h2>
          <p className="font-sans text-sm text-gr-text-primary/60 mb-6 leading-relaxed">
            Halaman ini khusus untuk Pembeli melihat rincian riwayat permintaan komoditas panen mereka. Akun Anda terdaftar sebagai <span className="font-bold text-gr-green">{user.role}</span>.
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

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header toolbar */}
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
              Dashboard Pembeli
            </span>
            <h1 className="mt-4 font-display text-5xl font-medium text-gr-text-primary">
              Permintaan Saya
            </h1>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/60 max-w-xl">
              Pantau progress pemenuhan komoditas panen yang telah Anda ajukan kepada para petani lokal.
            </p>
          </div>

          <Link
            href="/ajukan-permintaan"
            className="group flex items-center gap-2 bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-md shadow-gr-green/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Ajukan Baru</span>
          </Link>
        </header>

        <div className="h-px w-full bg-gradient-to-r from-gr-green/50 via-white/5 to-transparent mb-10" />

        {/* Requests List */}
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => {
              const needed = req.quantity_kg_needed;
              const committed = req.quantity_kg_committed;
              const percent = Math.min(100, Math.round((committed / needed) * 100));

              const deadlineDate = new Date(req.deadline).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div 
                  key={req.id}
                  className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <Link href={`/permintaan/${req.id}`} className="absolute inset-0 z-10" />
                  
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold border ${
                        req.status === 'TERBUKA'
                          ? 'bg-gr-green/10 text-gr-green border-gr-green/20'
                          : req.status === 'TERPENUHI'
                          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-gr-text-primary/30 border-white/5'
                      }`}>
                        {req.status}
                      </span>
                      <span className="font-mono text-[9px] text-gr-text-primary/30 uppercase tracking-widest">
                        ID: {req.id.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
                      {req.commodity_name}
                    </h3>
                    <p className="font-sans text-xs text-gr-text-primary/40 mt-1">
                      Kategori: {req.category}
                    </p>

                    {/* Progress details */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gr-text-primary/40">Fulfillment Progress</span>
                        <span className="text-gr-green font-bold">{percent}%</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-gr-green h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs font-sans text-gr-text-primary/60 pt-1">
                        <span>
                          {committed.toLocaleString('id-ID')} / {needed.toLocaleString('id-ID')} KG
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} />
                          {deadlineDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-gr-green font-mono text-[10px] uppercase tracking-wider group-hover:gap-2 transition-all">
                      <span>Lihat Detail</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
            <ClipboardList className="h-12 w-12 text-gr-text-primary/20 mb-4" />
            <span className="font-display text-2xl text-gr-text-primary/20">
              Belum mengajukan permintaan
            </span>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/40 max-w-xs">
              Mulai ajukan komoditas pangan yang Anda butuhkan di masa depan untuk dipenuhi oleh petani.
            </p>
            <Link
              href="/ajukan-permintaan"
              className="mt-6 inline-flex items-center gap-2 bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-md shadow-gr-green/10 cursor-pointer"
            >
              Ajukan Permintaan Pertama
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
