'use client';

import React, { useState, useEffect, use } from 'react';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { authApi } from '@/lib/api/auth';
import { referencePricesApi } from '@/lib/api/reference-prices';
import { BASE_URL, WS_BASE_URL } from '@/lib/api/client';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { ArrowLeft, Calendar, Loader2, ClipboardCheck, Users, MapPin, Tag, CheckCircle, Info, MessageSquare } from 'lucide-react';
import { reverseGeocode as fetchAddress } from '@/lib/utils/geocode';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { conversationsApi } from '@/lib/api/conversations';
import { provinceCentroids } from '@/lib/data/province-centroids';
import { RatingBadge } from '@/components/ratings/rating-badge';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function DemandRequestDetailPage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const getClosestProvince = (latitude: number, longitude: number) => {
    let closestProv = 'Di Yogyakarta';
    let minDist = Infinity;
    Object.entries(provinceCentroids).forEach(([provName, coords]) => {
      const dist = Math.sqrt((coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestProv = provName;
      }
    });
    return closestProv;
  };


  const router = useRouter();
  const [chatLoading, setChatLoading] = useState(false);

  const handleContactBuyer = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!request || !request.buyer_id) return;
    setChatLoading(true);
    try {
      const res = await conversationsApi.createConversation(undefined, undefined, request.buyer_id);
      if (res && res.conversation_id) {
        router.push(`/chat/${res.conversation_id}`);
      } else {
        throw new Error('Gagal memulai percakapan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memulai chat dengan pembeli');
    } finally {
      setChatLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!request || !request.match_transaction || !request.match_transaction.seller_id) return;
    setChatLoading(true);
    try {
      const res = await conversationsApi.createConversation(
        request.match_transaction.product_id || undefined,
        request.match_transaction.seller_id,
        undefined
      );
      if (res && res.conversation_id) {
        const url = request.match_transaction.product_id 
          ? `/chat/${res.conversation_id}?product_id=${request.match_transaction.product_id}`
          : `/chat/${res.conversation_id}`;
        router.push(url);
      } else {
        throw new Error('Gagal memulai percakapan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memulai chat dengan penjual');
    } finally {
      setChatLoading(false);
    }
  };

  const handleContactPetani = async (petaniId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setChatLoading(true);
    try {
      const res = await conversationsApi.createConversation(undefined, petaniId, undefined);
      if (res && res.conversation_id) {
        router.push(`/chat/${res.conversation_id}`);
      } else {
        throw new Error('Gagal memulai percakapan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memulai chat dengan petani');
    } finally {
      setChatLoading(false);
    }
  };

  const [user, setUser] = useState<any | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isRequestBuyer = user && user.role === 'PEMBELI' && request && request.buyer_id === user.id;
  const isMatchedSeller = user && user.role === 'PETANI' && request && request.match_transaction && request.match_transaction.seller_id === user.id;
  
  // Commitment Form State (for Farmers)
  const [commitQty, setCommitQty] = useState('');
  const [submittingCommit, setSubmittingCommit] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Escrow & Matching states
  const [matching, setMatching] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [confirmMatchOpen, setConfirmMatchOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // User location & Reference price states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [refPrice, setRefPrice] = useState<number | null>(null);
  const [refPriceRegion, setRefPriceRegion] = useState<string>('');
  const [addressName, setAddressName] = useState<string>('');

  const requestLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (err) => {
          console.warn("Detail page geolocation error:", err.message);
        },
        { timeout: 8000 }
      );
    }
  };

  const fetchReferencePrice = async (commodity: string, latitude: number | null, longitude: number | null) => {
    try {
      const region = latitude && longitude ? getClosestProvince(latitude, longitude) : 'Nasional';
      
      const [regionRes, nationalRes] = await Promise.all([
        referencePricesApi.getReferencePrices(1, 1, commodity, undefined, region),
        region !== 'Nasional' ? referencePricesApi.getReferencePrices(1, 1, commodity, undefined, 'Nasional') : null
      ]);
      
      if (regionRes.items && regionRes.items.length > 0) {
        setRefPrice(regionRes.items[0].price_per_kg);
        setRefPriceRegion(region);
      } else if (nationalRes && nationalRes.items && nationalRes.items.length > 0) {
        setRefPrice(nationalRes.items[0].price_per_kg);
        setRefPriceRegion('Nasional');
      } else {
        setRefPrice(null);
        setRefPriceRegion('');
      }
    } catch (err) {
      console.error('Failed to fetch ref price in detail page:', err);
      setRefPrice(null);
      setRefPriceRegion('');
    }
  };

  // Detect location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch reference price when commodity name or coordinates change
  useEffect(() => {
    if (request && request.commodity_name) {
      fetchReferencePrice(request.commodity_name, lat, lng);
    }
  }, [request?.commodity_name, lat, lng]);

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

  // Reverse geocode request coordinates when request detail is loaded
  useEffect(() => {
    if (request && request.latitude && request.longitude) {
      const fallbackProv = getClosestProvince(request.latitude, request.longitude);
      setAddressName(fallbackProv);

      fetchAddress(request.latitude, request.longitude).then((result) => {
        if (result) setAddressName(result.full || result.short);
      });
    }
  }, [request]);

  // Fetch candidates for matching
  useEffect(() => {
    if (id && isRequestBuyer && request && request.status === 'TERBUKA') {
      const fetchCandidates = async () => {
        try {
          setLoadingCandidates(true);
          const res = await demandRequestsApi.getDemandMatchingCandidates(id);
          setCandidates(res);
          setCurrentPage(1);
        } catch (err) {
          console.error("Failed to fetch matching candidates:", err);
        } finally {
          setLoadingCandidates(false);
        }
      };
      fetchCandidates();
    }
  }, [id, isRequestBuyer, request?.status]);

  // 2. Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!id || loading || error) return;

    const wsUrl = `${WS_BASE_URL}/ws/demand-requests/${id}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.quantity_kg_committed !== undefined ||
          data.payment_status !== undefined ||
          data.escrow_status !== undefined
        ) {
          setRequest((prev: any) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              status: data.status !== undefined ? data.status : prev.status,
            };
            if (data.quantity_kg_committed !== undefined) {
              updated.quantity_kg_committed = data.quantity_kg_committed;
            }
            if (data.num_petani_committed !== undefined) {
              updated.num_petani_committed = data.num_petani_committed !== undefined ? data.num_petani_committed : prev.num_petani_committed;
            }
            // Trigger background reload if payment or escrow status changed to fetch matching details
            if (data.payment_status !== undefined || data.escrow_status !== undefined) {
              demandRequestsApi.getDemandRequestById(id)
                .then((freshData) => setRequest(freshData))
                .catch((err) => console.error("Failed to reload demand details on WS update:", err));
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to parse websocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error(`WebSocket connection error to URL (${wsUrl}):`, err);
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

    const remainingKg = Math.max(0, request.quantity_kg_needed - request.quantity_kg_committed);
    if (qty > remainingKg) {
      setError(`Jumlah komitmen tidak boleh melebihi sisa kebutuhan (${remainingKg.toLocaleString('id-ID')} kg)`);
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

  const handleMatch = async (productId: string) => {
    try {
      setMatching(productId);
      setError('');
      await demandRequestsApi.matchDemandRequest(id, productId);
      const updatedData = await demandRequestsApi.getDemandRequestById(id);
      setRequest(updatedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mencocokkan permintaan dengan produk petani terpilih');
    } finally {
      setMatching(null);
    }
  };

  const handlePilihClick = (cand: any) => {
    setSelectedCandidate(cand);
    setConfirmMatchOpen(true);
  };

  const handleConfirmMatch = async () => {
    if (!selectedCandidate) return;
    const productId = selectedCandidate.product_id;
    setConfirmMatchOpen(false);
    await handleMatch(productId);
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      setError('');
      const successUrl = `${window.location.origin}/permintaan/${id}?status=success`;
      const failureUrl = `${window.location.origin}/permintaan/${id}?status=failed`;
      const res = await demandRequestsApi.checkoutDemand(id, successUrl, failureUrl);
      if (res.invoice_url) {
        window.location.href = res.invoice_url;
      } else {
        setError('Gagal membuat URL pembayaran Xendit');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memulai checkout pembayaran');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleConfirmReceived = async () => {
    try {
      setConfirmingReceived(true);
      setError('');
      await demandRequestsApi.confirmDemandReceived(id);
      const updatedData = await demandRequestsApi.getDemandRequestById(id);
      setRequest(updatedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengonfirmasi penerimaan barang');
    } finally {
      setConfirmingReceived(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gr-paper">
        <Loader2 className="h-10 w-10 text-gr-board animate-spin opacity-60" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <main className="relative min-h-[calc(100vh-80px)] bg-gr-paper py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <BgPattern />
        <div className="relative z-10 max-w-md w-full bg-white/80 border border-gr-line p-8 rounded-sm text-center ">
          <h2 className="font-display text-2xl font-semibold text-gr-ink mb-3">Error</h2>
          <p className="font-sans text-sm text-gr-ink-soft mb-6">{error}</p>
          <Link
            href={user?.role === 'PEMBELI' ? "/permintaan-saya" : "/beranda"}
            className="inline-flex items-center gap-2 bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm  transition-all"
          >
            {user?.role === 'PEMBELI' ? "Kembali ke Ajukan Permintaan" : "Kembali ke Beranda"}
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
    <main className="relative min-h-[calc(100vh-80px)] bg-gr-paper py-16 px-4 sm:px-6 lg:px-8">
      <BgPattern />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={user?.role === 'PEMBELI' ? "/permintaan-saya" : "/beranda"}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider text-gr-ink-soft hover:text-gr-ink transition-colors"
          >
            <ArrowLeft size={12} />
            {user?.role === 'PEMBELI' ? "Kembali ke Ajukan Permintaan" : "Kembali ke Beranda"}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Columns (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <header className="mb-6">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gr-down font-bold block mb-2 select-none">
                {request.category || 'Hasil Bumi'}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-gr-ink">
                {request.commodity_name}
              </h1>
              <p className="mt-2 font-mono text-xs font-bold text-gr-ink-soft/70">
                Request ID: {request.id.slice(0, 8)}
              </p>
            </header>
 
            {/* Consolidated Request Detail Container */}
            <div className="rounded-sm border border-gr-line bg-white/80 backdrop-blur-md overflow-hidden">
              {/* Progress Bar Section (Editorial Ticker/Data-Panel style) */}
              <div className="p-6 sm:p-8 border-b border-gr-line bg-[#FAF9F5]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Left side: Serif Percentage & Volume Progress */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="space-y-1">
                    <div className="font-display text-4xl sm:text-5xl font-bold text-gr-board leading-none">
                      {progressPercent}%
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/70 font-bold block">
                      Kuota Terpenuhi
                    </span>
                  </div>
 
                  <div className="h-8 w-[1px] bg-gr-line/35 shrink-0" />
 
                  <div className="space-y-1">
                    <div className="font-mono text-xl font-bold text-gr-ink leading-none">
                      {Math.round(committed).toLocaleString('id-ID')} <span className="text-xs text-gr-ink-soft font-normal">dari</span> {Math.round(needed).toLocaleString('id-ID')} <span className="text-[10px] text-gr-ink-soft font-bold tracking-wider">KG</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/70 font-bold block">
                      Volume Pemenuhan
                    </span>
                  </div>
                </div>
 
                {/* Right side: Petani committed count */}
                <div className="space-y-1 sm:text-right shrink-0">
                  <div className="font-mono text-xl font-bold text-gr-ink leading-none">
                    {request.num_petani_committed && request.num_petani_committed > 0 ? (
                      <span>{request.num_petani_committed} Petani</span>
                    ) : (
                      <span className="text-sm font-sans text-gr-ink-soft italic font-normal">Belum ada komitmen masuk</span>
                    )}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/70 font-bold block">
                    Mitra Tani Berkomitmen
                  </span>
                </div>
 
                {remainingKg > 0 && request.status === 'TERBUKA' && (
                  <div className="hidden">
                    {/* Kept internally to preserve code functionality but layout is driven by stat block */}
                  </div>
                )}
              </div>
 
              {/* Request Detail Section */}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="border-b border-gr-line/45 pb-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft font-bold block">Rincian Permintaan</span>
                </div>
                
                <div className="font-sans text-sm">
                  {/* Row 1: Deadline & Lokasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-4 border-l-2 border-gr-board/15">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/75 font-semibold block mb-0.5">Deadline Pemenuhan</span>
                      <p className="text-gr-ink font-semibold flex items-center gap-2">
                        <Calendar size={14} strokeWidth={2} className="text-gr-board/60 pointer-events-none" />
                        {formattedDeadline}
                      </p>
                    </div>
 
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/75 font-semibold block mb-0.5">Lokasi Penerimaan</span>
                      <p className="text-gr-ink font-semibold flex items-start gap-2">
                        <MapPin size={14} strokeWidth={2} className="text-gr-board/60 mt-0.5 shrink-0" />
                        <span className="leading-snug">
                          {request.latitude && request.longitude
                            ? (addressName || getClosestProvince(request.latitude, request.longitude))
                            : 'Lokasi tidak diketahui'}
                        </span>
                      </p>
                    </div>
                  </div>
 
                  {/* Row 2: Harga Penawaran & Harga Acuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-10 gap-y-6 pt-5 border-t border-gr-line/35 pl-4 border-l-2 border-gr-board/15">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/75 font-semibold block mb-0.5">Harga Penawaran</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-baseline gap-1 font-display whitespace-nowrap">
                          <span className="text-2xl font-bold text-gr-ink leading-none">
                            Rp {request.price_per_kg ? Math.round(request.price_per_kg).toLocaleString('id-ID') : '-'}
                          </span>
                          <span className="text-gr-ink-soft/70 text-[10px] font-bold">/ KG</span>
                        </div>
                        {refPrice !== null && (
                          (() => {
                            const priceDevPercent = Math.round(((request.price_per_kg - refPrice) / refPrice) * 100);
                            if (priceDevPercent === 0) return null;
                            return (
                              <span className={cn(
                                "text-xs font-bold flex items-center gap-0.5 leading-none shrink-0",
                                priceDevPercent > 0 ? "text-gr-down" : "text-gr-up"
                              )}>
                                <span>{priceDevPercent > 0 ? '▲' : '▼'}</span>
                                <span>{priceDevPercent > 0 ? '+' : ''}{priceDevPercent}% vs acuan</span>
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </div>

                    {refPrice !== null && (
                      <div className="space-y-1 animate-fade-in">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/75 font-semibold block mb-0.5">Harga Acuan ({refPriceRegion})</span>
                        <div className="flex items-baseline gap-1 font-display whitespace-nowrap">
                          <span className="text-lg font-bold text-gr-ink-soft leading-none">
                            Rp {Math.round(refPrice).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-gr-ink-soft/60 font-bold">/ KG</span>
                        </div>
                      </div>
                    )}
                  </div>
 
                  {/* Row 3: Status Permintaan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-gr-line/35 pl-4 border-l-2 border-gr-board/15">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft/75 font-semibold block mb-0.5">Status Permintaan</span>
                      <div className="pt-0.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border font-mono ${
                          request.status === 'TERBUKA' 
                            ? 'bg-gr-board/10 text-gr-board border-gr-board/20'
                            : request.status === 'TERPENUHI'
                            ? 'bg-gr-up/10 text-gr-up border-gr-up/20'
                            : 'bg-gr-paper text-gr-ink-soft border-gr-line'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {/* Row 4: Footer Notice & System Metadata */}
                  <div className="pt-5 border-t border-gr-line/35 pl-4 border-l-2 border-gr-board/15">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gr-ink-soft/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-gr-up animate-pulse" />
                      <span>Terakhir diperbarui: {new Date(request.updated_at || request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
                  </div>
                </div>

                {user && user.role === 'PETANI' && request.buyer_name && (
                  <div className="pt-6 border-t border-gr-line">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft font-bold block mb-3">
                      Informasi Kontak Pembeli
                    </span>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                      <div className="font-sans text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gr-ink font-semibold text-base">{request.buyer_name}</span>
                          <div className="flex items-center justify-center shrink-0">
                            <RatingBadge
                              avgRating={request.buyer_rating_avg}
                              ratingCount={request.buyer_rating_count}
                              size="sm"
                              newLabel="Pembeli Baru"
                              countSuffix="permintaan"
                            />
                          </div>
                        </div>
                        <p className="text-gr-ink-soft/70 text-xs mt-0.5">{request.buyer_phone || 'Tidak ada nomor telepon'}</p>
                      </div>
                      {request.buyer_id && (
                        <button
                          onClick={handleContactBuyer}
                          disabled={chatLoading}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-gr-board text-gr-chalk hover:bg-gr-board/90 font-mono text-xs font-bold uppercase tracking-wider transition-all  cursor-pointer disabled:opacity-50"
                        >
                          {chatLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span>Chat Pembeli</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Commit actions for Farmers & Commitments log (1/3 width) */}
          <div className="space-y-6">
            {/* Buyer Match & Escrow Panel */}
            {user && user.role === 'PEMBELI' && request.buyer_id === user.id && (
              <>
                {/* Case 1: Already matched */}
                {request.match_transaction && (
                  <div className="rounded-sm border border-gr-line bg-white/80 p-6 overflow-hidden space-y-5">
                    <div>
                      <span className="bg-gr-up/10 border border-gr-up/20 px-2 py-0.5 font-mono text-[9px] uppercase font-bold tracking-wider text-gr-up rounded-xs inline-block mb-2">
                        Telah Dicocokkan
                      </span>
                      <h3 className="font-display text-xl font-semibold text-gr-ink">
                        Pencocokan Escrow
                      </h3>
                      <p className="font-sans text-[11px] text-gr-ink mt-1 leading-relaxed">
                        Permintaan Anda berhasil dicocokkan dengan produk petani.
                      </p>
                    </div>

                    <div className="border-t border-gr-line pt-4 space-y-2 text-xs font-sans">
                      <div className="flex justify-between">
                        <span className="text-gr-ink-soft">Petani:</span>
                        <span className="text-gr-ink font-semibold">{request.match_transaction.seller_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gr-ink-soft">Jumlah KG:</span>
                        <span className="text-gr-ink font-mono font-bold">{request.match_transaction.quantity_kg} KG</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gr-ink-soft">Harga per KG:</span>
                        <span className="text-gr-ink font-mono">Rp {Math.round(request.match_transaction.price_per_kg).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-t border-gr-line pt-2 font-bold text-sm">
                        <span className="text-gr-ink-soft">Total Pembayaran:</span>
                        <span className="text-gr-up font-mono">Rp {Math.round(request.match_transaction.amount).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="border-t border-gr-line pt-4 space-y-2 text-xs font-sans">
                      <div className="flex justify-between items-center">
                        <span className="text-gr-ink-soft">Status Pembayaran:</span>
                        <span className={cn(
                          "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs border",
                          request.match_transaction.payment_status === 'paid' 
                            ? "bg-gr-up/10 text-gr-up border border-gr-up/20" 
                            : "bg-gr-down/10 text-gr-down border border-gr-down/20"
                        )}>
                          {request.match_transaction.payment_status === 'paid' ? 'LUNAS' : 'PENDING'}
                        </span>
                      </div>
 
                      {request.match_transaction.escrow_status && request.match_transaction.escrow_status !== 'not_started' && (
                        <div className="flex justify-between items-center">
                          <span className="text-gr-ink-soft">Status Escrow:</span>
                          <span className={cn(
                            "font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-xs",
                            request.match_transaction.escrow_status === 'held' && "bg-gr-down/10 text-gr-down border border-gr-down/20",
                            request.match_transaction.escrow_status === 'released' && "bg-gr-up/10 text-gr-up border border-gr-up/20",
                            request.match_transaction.escrow_status === 'disputed' && "bg-gr-down/10 text-gr-down border border-gr-down/20"
                          )}>
                            {request.match_transaction.escrow_status === 'held' && 'DANA DITAHAN'}
                            {request.match_transaction.escrow_status === 'released' && 'DANA DICAIRKAN'}
                            {request.match_transaction.escrow_status === 'disputed' && 'SENGKETA'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gr-line space-y-3">
                      {request.match_transaction.payment_status !== 'paid' && (
                        isRequestBuyer ? (
                          <Button
                            disabled={checkingOut}
                            onClick={handleCheckout}
                            className="w-full bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-sm transition-all duration-200 cursor-pointer  flex items-center justify-center gap-2"
                          >
                            {checkingOut ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              'Bayar Sekarang (Xendit)'
                            )}
                          </Button>
                        ) : (
                          <div className="text-center py-3 bg-gr-paper border border-gr-line rounded-sm text-xs font-mono font-bold text-gr-board uppercase tracking-wider animate-pulse">
                            Menunggu Pembayaran dari Pembeli
                          </div>
                        )
                      )}

                      {request.match_transaction.payment_status === 'paid' && request.match_transaction.escrow_status === 'held' && (
                        isRequestBuyer ? (
                          <Button
                            disabled={confirmingReceived}
                            onClick={handleConfirmReceived}
                            className="w-full bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-sm transition-all duration-200 cursor-pointer "
                          >
                            {confirmingReceived ? 'Memproses...' : 'Konfirmasi Barang Diterima'}
                          </Button>
                        ) : (
                          <div className="text-center py-3 px-4 bg-gr-up/10 border border-gr-up/20 rounded-sm text-xs font-sans text-gr-up font-semibold leading-relaxed">
                            <span className="font-bold uppercase tracking-wider font-mono block mb-1">Dana Ditahan (Escrow)</span>
                            Pembayaran telah diverifikasi. Silakan kirim komoditas Anda ke Pembeli.
                          </div>
                        )
                      )}

                      {request.match_transaction.payment_status === 'paid' && request.match_transaction.escrow_status === 'released' && (
                        <div className="text-center py-3 px-4 bg-gr-up/10 border border-gr-up/20 rounded-sm text-xs font-sans text-gr-up font-semibold leading-relaxed">
                          <span className="font-bold uppercase tracking-wider font-mono block mb-1">Transaksi Selesai</span>
                          {isMatchedSeller ? 'Dana telah dicairkan ke rekening bank Anda.' : 'Dana telah dicairkan ke rekening bank Petani.'}
                        </div>
                      )}

                      {request.match_transaction.escrow_status === 'disputed' && (
                        <div className="text-center py-3 px-4 bg-gr-down/10 border border-gr-down/20 rounded-sm text-xs font-sans text-gr-down font-semibold leading-relaxed">
                          <span className="font-bold uppercase tracking-wider font-mono block mb-1">Status Sengketa (Dispute)</span>
                          Transaksi ditangguhkan. Layanan Pelanggan kami akan menghubungi kedua belah pihak.
                        </div>
                      )}

                      {isRequestBuyer && request.match_transaction.seller_id && (
                        <button
                          onClick={handleContactSeller}
                          disabled={chatLoading}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-gr-line hover:border-gr-ink bg-white/40 hover:bg-white/60 font-mono text-xs font-bold uppercase tracking-wider text-gr-ink transition-all  cursor-pointer disabled:opacity-50"
                        >
                          {chatLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span>Chat Petani</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(!request.match_transaction || (request.status === 'TERBUKA' && request.quantity_kg_committed < request.quantity_kg_needed)) && (
                  request.status === 'TERBUKA' && (
                    loadingCandidates ? (
                      <div className="rounded-sm border border-gr-line bg-white/80 p-6 overflow-hidden space-y-4">
                        <h3 className="font-display text-xl font-semibold text-gr-ink flex items-center gap-2">
                          <Users size={16} strokeWidth={2} className="text-gr-board" />
                          Kandidat Produk Petani
                        </h3>
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-gr-board" />
                          <span className="text-xs text-gr-ink-soft ml-2">Mencari kandidat terbaik...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-gr-line bg-white/80 p-6 overflow-hidden space-y-4">
                        <h3 className="font-display text-xl font-semibold text-gr-ink flex items-center gap-2">
                          <Users size={16} strokeWidth={2} className="text-gr-board" />
                          Kandidat Produk Petani
                        </h3>
                        <p className="font-sans text-[11px] text-gr-ink-soft leading-relaxed">
                          Berikut adalah daftar hasil panen petani yang cocok secara harga dan kemiripan komoditas dengan permintaan Anda. Silakan pilih salah satu untuk bertransaksi via Escrow.
                        </p>

                        {candidates.length === 0 ? (
                          <div className="text-center py-6 px-4 border border-dashed border-gr-line rounded-sm bg-gr-paper/30">
                            <p className="text-xs font-sans text-gr-ink-soft">
                              Tidak ada produk petani yang cocok (harga ≤ Rp {Math.round(request.price_per_kg).toLocaleString('id-ID')}/KG & cocok secara embedding) saat ini.
                            </p>
                          </div>
                        ) : (() => {
                          const candidatesPerPage = 2;
                          const totalPages = Math.ceil(candidates.length / candidatesPerPage);
                          const currentCandidates = candidates.slice(
                            (currentPage - 1) * candidatesPerPage,
                            currentPage * candidatesPerPage
                          );
                          return (
                            <div className="space-y-3">
                              <div className="space-y-2.5">
                                {currentCandidates.map((cand) => {
                                  const similarityPercentage = Math.round((1 - cand.distance_score) * 100);
                                  return (
                                    <div key={cand.product_id} className="py-4 border-b border-gr-line/45 last:border-b-0 flex flex-col gap-3.5 relative overflow-hidden">
                                      {/* Product Title & Match Badge */}
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                          <h4 className="font-display font-semibold text-xs text-gr-ink line-clamp-2" title={cand.product_name}>{cand.product_name}</h4>
                                          <p className="text-[10px] text-gr-ink-soft font-sans mt-0.5">Petani: {cand.seller_name}</p>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-gr-up/10 text-gr-up border border-gr-up/20 shrink-0">
                                          {similarityPercentage}% Match
                                        </span>
                                      </div>

                                      {/* Stock & Price info */}
                                      <div className="grid grid-cols-2 gap-4 text-xs font-sans border-t border-b border-gr-line/45 py-2">
                                        <div>
                                          <span className="text-[10px] text-gr-ink-soft block">Stok Tersedia:</span>
                                          <span className="font-semibold text-gr-ink font-mono">{cand.quantity_kg} KG</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-gr-ink-soft block">Harga per KG:</span>
                                          <span className="font-semibold text-gr-ink font-mono">Rp {Math.round(cand.price_per_kg).toLocaleString('id-ID')}</span>
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <a
                                          href={`/produk/${cand.product_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="h-8 rounded-xs border border-gr-line text-gr-ink hover:bg-gr-paper font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer"
                                        >
                                          Detail
                                        </a>
                                        <Button
                                          disabled={matching !== null}
                                          onClick={() => handlePilihClick(cand)}
                                          size="sm"
                                          className="h-8 bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-[9px] font-bold uppercase tracking-wider rounded-xs  cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                          {matching === cand.product_id ? (
                                            <>
                                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                              Proses...
                                            </>
                                          ) : (
                                            'Pilih'
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Pagination Controls */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t border-gr-line/50 text-[10px] font-sans text-gr-ink-soft">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-gr-ink hover:bg-gr-paper border border-gr-line disabled:opacity-45"
                                  >
                                    Sebelumnya
                                  </Button>
                                  
                                  {/* Numbered circles indicator */}
                                  <div className="flex justify-center items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                      const pageNum = idx + 1;
                                      return (
                                        <button
                                          key={pageNum}
                                          onClick={() => setCurrentPage(pageNum)}
                                          className={cn(
                                            "h-4 w-4 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold transition-all duration-200 cursor-pointer border",
                                            currentPage === pageNum
                                              ? "bg-gr-board text-gr-chalk border-gr-board"
                                              : "bg-white text-gr-ink-soft border-gr-line hover:border-gr-ink hover:text-gr-ink"
                                          )}
                                          aria-label={`Halaman ${pageNum}`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-gr-ink hover:bg-gr-paper border border-gr-line disabled:opacity-45"
                                  >
                                    Selanjutnya
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )
                  ))
                )}
              </>
            )}

            {/* Farmer Commitment Action Panel */}
            {user && user.role === 'PETANI' && request.status === 'TERBUKA' && (
              <div className="rounded-sm border border-gr-line bg-white/80 p-6 overflow-hidden">
                <h3 className="font-display text-xl font-semibold text-gr-ink mb-2 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-gr-board" />
                  Bantu Penuhi
                </h3>
                <p className="font-sans text-xs text-gr-ink-soft mb-4 leading-relaxed">
                  Apakah Anda memiliki hasil panen ini atau bersedia menanamnya? Masukkan jumlah KG yang sanggup Anda supply.
                </p>

                {commitSuccess && (
                  <div className="mb-4 rounded-sm bg-gr-up/10 p-3 text-xs text-gr-up border border-gr-up/30 flex items-center gap-2 font-mono">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>Komitmen berhasil dikirim!</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-sm bg-gr-down/10 p-3 text-xs text-gr-down border border-gr-down/30 font-mono">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCommitSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-gr-ink-soft/80 mb-1.5">
                      Jumlah Supply (KG)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Masukkan jumlah kg..."
                      value={commitQty}
                      onChange={(e) => setCommitQty(e.target.value)}
                      className="w-full bg-white/70 border border-gr-line focus:border-gr-board text-gr-ink px-3 py-2.5 rounded-sm font-sans text-xs focus:outline-none transition-all placeholder:text-gr-ink-soft/40 "
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingCommit}
                    className="w-full bg-gr-board hover:bg-gr-board/90 text-gr-chalk font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer "
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
            <div className="pt-6 border-t border-gr-line max-h-[400px] flex flex-col">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-gr-ink-soft mb-4">
                Riwayat Komitmen ({request.commitments?.length || 0})
              </h3>
              
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
                {request.commitments && request.commitments.length > 0 ? (
                  request.commitments.map((commit: any) => {
                    const commitDate = new Date(commit.committed_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const isBuyer = user?.role === 'PEMBELI';
                    return (
                      <div 
                        key={commit.id}
                        className="py-3 border-b border-gr-line/45 last:border-b-0 flex justify-between items-center bg-transparent"
                      >
                        <div>
                          {isBuyer && commit.petani_name && (
                            <p className="font-sans text-xs font-semibold text-gr-ink mb-0.5">
                              {commit.petani_name}
                            </p>
                          )}
                          <p className="font-mono text-xs font-bold text-gr-up">
                            +{commit.quantity_kg_committed} KG
                          </p>
                          <p className="font-sans text-[10px] text-gr-ink-soft/70 mt-0.5 font-mono">
                            {commitDate}
                          </p>
                        </div>
                        {isBuyer && commit.petani_id ? (
                          <button
                            onClick={() => handleContactPetani(commit.petani_id)}
                            disabled={chatLoading}
                            className="p-2 rounded-sm bg-gr-board text-gr-chalk hover:bg-gr-board/90 transition-all cursor-pointer  disabled:opacity-50"
                            title="Chat Petani"
                          >
                            {chatLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <Tag size={14} className="text-gr-ink-soft/40" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-dashed border-gr-line/60 bg-white/20 p-6 rounded-sm text-center flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 text-gr-ink-soft/40 mb-2" />
                    <p className="text-gr-ink-soft text-xs font-sans italic">
                      Belum ada komitmen masuk
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedCandidate && (
        <ConfirmModal
          isOpen={confirmMatchOpen}
          onClose={() => setConfirmMatchOpen(false)}
          onConfirm={handleConfirmMatch}
          title="Konfirmasi Pembelian"
          confirmText="Konfirmasi"
          cancelText="Batal"
          variant="info"
          isLoading={matching !== null}
          description={
            <div className="space-y-3">
              <p className="font-sans text-xs text-gr-ink-soft">
                Apakah Anda yakin ingin memilih hasil panen ini untuk memenuhi permintaan Anda?
              </p>
              <div className="bg-[#FAF9F5] border border-gr-line p-3 space-y-1.5 font-mono text-[10px] text-gr-text-primary">
                <div className="flex justify-between gap-4">
                  <span className="text-gr-text-primary/60">PRODUK:</span>
                  <span className="font-bold text-gr-text-primary uppercase truncate max-w-[160px]" title={selectedCandidate.product_name}>
                    {selectedCandidate.product_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gr-text-primary/60">HARGA:</span>
                  <span className="font-bold text-gr-text-primary">
                    Rp {Math.round(selectedCandidate.price_per_kg).toLocaleString('id-ID')} / KG
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gr-text-primary/60">QUANTITY:</span>
                  <span className="font-bold text-gr-text-primary">
                    {Math.min(selectedCandidate.quantity_kg, request.quantity_kg_needed)} KG
                  </span>
                </div>
                <div className="border-t border-dashed border-gr-line/30 my-1" />
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-gr-text-primary font-bold">TOTAL ESTIMASI:</span>
                  <span className="font-bold text-gr-green">
                    Rp {Math.round(selectedCandidate.price_per_kg * Math.min(selectedCandidate.quantity_kg, request.quantity_kg_needed)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <p className="font-sans text-[10px] text-gr-orange leading-normal">
                * Escrow matching akan membuat transaksi pembayaran baru dan memotong stok produk petani.
              </p>
            </div>
          }
        />
      )}
    </main>
  );

}
