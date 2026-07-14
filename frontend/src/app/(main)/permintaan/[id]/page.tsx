'use client';

import React, { useState, useEffect, use } from 'react';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { authApi } from '@/lib/api/auth';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { ArrowLeft, Calendar, Loader2, ClipboardCheck, Users, MapPin, Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DemandRequestDetailPage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [user, setUser] = useState<any | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Commitment Form State (for Farmers)
  const [commitQty, setCommitQty] = useState('');
  const [submittingCommit, setSubmittingCommit] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  // 1. Fetch auth user & demand request details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user details if logged in (non-blocking)
        authApi.getMe().then(setUser).catch(() => setUser(null));
        
        const data = await demandRequestsApi.getDemandRequestById(id);
        setRequest(data);
      } catch (err: any) {
        console.error('Failed to fetch request detail:', err);
        setError('Gagal memuat detail permintaan hasil panen.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 2. Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!id || loading || error) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/demand-requests/${id}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.quantity_kg_committed !== undefined) {
          setRequest((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              quantity_kg_committed: data.quantity_kg_committed,
              status: data.status,
              num_petani_committed: data.num_petani_committed !== undefined ? data.num_petani_committed : prev.num_petani_committed
            };
          });
        }
      } catch (err) {
        console.error('Failed to parse websocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
    };

    return () => {
      ws.close();
    };
  }, [id, loading, error]);

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommitSuccess(false);
    setError('');

    const qty = parseFloat(commitQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Masukkan jumlah komitmen valid yang lebih besar dari 0');
      return;
    }

    setSubmittingCommit(true);
    try {
      await demandRequestsApi.commitSupply(id, qty);
      setCommitSuccess(true);
      setCommitQty('');
      // Detail request will also update locally via WS, but let's re-fetch to update commitments list
      const updatedData = await demandRequestsApi.getDemandRequestById(id);
      setRequest(updatedData);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirimkan komitmen supply');
    } finally {
      setSubmittingCommit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-bg">
        <Loader2 className="h-12 w-12 text-gr-green animate-spin opacity-50" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <BgPattern />
        <FilmGrain />
        <div className="relative z-10 max-w-md w-full bg-white/[0.02] border border-white/5 p-8 rounded-3xl text-center">
          <h2 className="font-display text-2xl font-medium text-gr-text-primary mb-3">Error</h2>
          <p className="font-sans text-sm text-gr-text-primary/60 mb-6">{error}</p>
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gr-text-primary font-sans text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  const needed = request.quantity_kg_needed;
  const committed = request.quantity_kg_committed;
  const progressPercent = Math.min(100, Math.round((committed / needed) * 100));
  const remainingKg = Math.max(0, needed - committed);

  const formattedDeadline = new Date(request.deadline).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <main className="relative min-h-screen bg-gr-bg py-24 px-4 sm:px-6 lg:px-8">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            href="/beranda"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 hover:text-gr-green transition-colors"
          >
            <ArrowLeft size={12} />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Columns (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <header className="mb-6">
              <span className="bg-gr-green/10 border border-gr-green/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-gr-green rounded-full inline-block mb-3">
                {request.category}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-gr-text-primary">
                {request.commodity_name}
              </h1>
              <p className="mt-2 font-mono text-xs text-gr-text-primary/40">
                Request ID: {request.id.slice(0, 8)}
              </p>
            </header>

            {/* Progress Bar Panel */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">Fulfillment Progress</span>
                <span className="font-mono text-xs font-bold text-gr-green bg-gr-green/10 px-2 py-0.5 rounded">
                  {progressPercent}%
                </span>
              </div>
              
              {/* Actual Progress Bar */}
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-6 border border-white/5">
                <div 
                  className="bg-gr-green h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(92,255,158,0.3)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Progress Description Text */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 font-sans text-sm">
                <div>
                  <span className="text-gr-text-primary font-semibold text-lg">
                    {committed.toLocaleString('id-ID')}
                  </span>
                  <span className="text-gr-text-primary/40"> dari </span>
                  <span className="text-gr-text-primary font-semibold text-lg">
                    {needed.toLocaleString('id-ID')} KG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gr-text-primary/60 font-mono text-xs sm:text-sm">
                  <Users size={16} className="text-gr-live" />
                  <span>
                    {request.num_petani_committed || 0} petani telah berkomitmen
                  </span>
                </div>
              </div>

              {remainingKg > 0 && request.status === 'TERBUKA' && (
                <p className="mt-4 font-sans text-xs text-gr-live/80 bg-gr-live/5 border border-gr-live/10 p-3 rounded-xl flex items-center gap-2">
                  <ClipboardCheck size={14} />
                  Membutuhkan {remainingKg.toLocaleString('id-ID')} KG lagi untuk dipenuhi.
                </p>
              )}
            </div>

            {/* Request Detail Panel */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-md space-y-6">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">Rincian Permintaan</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-sm">
                <div className="space-y-1">
                  <span className="text-gr-text-primary/40 text-xs">Deadline Pemenuhan</span>
                  <p className="text-gr-text-primary font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-gr-live" />
                    {formattedDeadline}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-gr-text-primary/40 text-xs">Lokasi Penerimaan</span>
                  <p className="text-gr-text-primary font-medium flex items-center gap-2">
                    <MapPin size={14} className="text-gr-live" />
                    Yogyakarta ({request.latitude ? `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}` : 'Koordinat tidak tersedia'})
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-gr-text-primary/40 text-xs">Status Permintaan</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 border ${
                    request.status === 'TERBUKA' 
                      ? 'bg-gr-green/10 text-gr-green border-gr-green/20'
                      : request.status === 'TERPENUHI'
                      ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-white/5 text-gr-text-primary/40 border-white/10'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Commit actions for Farmers & Commitments log (1/3 width) */}
          <div className="space-y-6">
            {/* Farmer Commitment Action Panel */}
            {user && user.role === 'PETANI' && request.status === 'TERBUKA' && (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
                <Glow color="var(--gr-green)" position="center" className="opacity-5 scale-90 pointer-events-none" />
                <h3 className="font-display text-xl font-medium text-gr-text-primary mb-2 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-gr-green" />
                  Bantu Penuhi
                </h3>
                <p className="font-sans text-xs text-gr-text-primary/60 mb-4 leading-relaxed">
                  Apakah Anda memiliki hasil panen ini atau bersedia menanamnya? Masukkan jumlah KG yang sanggup Anda supply.
                </p>

                {commitSuccess && (
                  <div className="mb-4 rounded-xl bg-emerald-600/10 p-3 text-xs text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>Komitmen berhasil dikirim!</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-xl bg-gr-price-unfair/10 p-3 text-xs text-gr-price-unfair border border-gr-price-unfair/20">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCommitSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-1.5">
                      Jumlah Supply (KG)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Masukkan jumlah kg..."
                      value={commitQty}
                      onChange={(e) => setCommitQty(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary px-3 py-2.5 rounded-xl font-sans text-xs focus:outline-none transition-all placeholder:text-gr-text-primary/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingCommit}
                    className="w-full bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-gr-green/10"
                  >
                    {submittingCommit ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Kirim Komitmen'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Commitment History Log */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md max-h-[400px] flex flex-col">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40 mb-4">
                Riwayat Komitmen ({request.commitments?.length || 0})
              </h3>
              
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {request.commitments && request.commitments.length > 0 ? (
                  request.commitments.map((commit: any) => {
                    const commitDate = new Date(commit.committed_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <div 
                        key={commit.id}
                        className="p-3 bg-white/2 rounded-xl border border-white/5 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-mono text-xs font-semibold text-gr-green">
                            +{commit.quantity_kg_committed} KG
                          </p>
                          <p className="font-sans text-[10px] text-gr-text-primary/40 mt-0.5">
                            {commitDate}
                          </p>
                        </div>
                        <Tag size={14} className="text-gr-text-primary/20" />
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <Users className="h-8 w-8 text-gr-text-primary/10 mx-auto mb-2" />
                    <p className="font-sans text-xs text-gr-text-primary/30 italic">
                      Belum ada komitmen masuk
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
