'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Heart, RefreshCw, Calendar, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { demandRequestsApi } from '@/lib/api/demand-requests';
import { RatingBadge } from '../ratings/rating-badge';

export interface DemandRequest {
  id: string;
  commodity_name: string;
  category: string;
  quantity_kg_needed: number;
  quantity_kg_committed: number;
  deadline: string;
  status: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  num_petani_committed?: number;
  buyer_name?: string;
  buyer_rating_avg?: number | null;
  buyer_rating_count?: number;
}

interface SwipeDeckProps {
  requests: DemandRequest[];
  onSwipeRight: (request: DemandRequest) => void;
  onSwipeLeft: (request: DemandRequest) => void;
  onEmpty: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ 
  requests, 
  onSwipeRight, 
  onSwipeLeft,
  onEmpty 
}) => {
  const [currentIndex, setCurrentSetIndex] = useState(0);

  // Commit Modal State
  const [commitRequest, setCommitRequest] = useState<DemandRequest | null>(null);
  const [commitQty, setCommitQty] = useState('');
  const [submittingCommit, setSubmittingCommit] = useState(false);
  const [commitError, setCommitError] = useState('');

  const activeRequests = useMemo(() => {
    return requests.slice(currentIndex, currentIndex + 3).reverse();
  }, [requests, currentIndex]);

  const handleSwipe = (direction: 'left' | 'right', request: DemandRequest) => {
    if (direction === 'right') {
      // Trigger commit modal
      setCommitRequest(request);
      setCommitQty('');
      setCommitError('');
    } else {
      onSwipeLeft(request);
      setCurrentSetIndex(prev => prev + 1);
    }
  };

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitRequest) return;
    setCommitError('');

    const qty = parseFloat(commitQty);
    if (isNaN(qty) || qty <= 0) {
      setCommitError('Masukkan jumlah valid lebih dari 0 kg');
      return;
    }

    setSubmittingCommit(true);
    try {
      await demandRequestsApi.commitSupply(commitRequest.id, qty);
      
      // Call swipe right callback
      onSwipeRight(commitRequest);
      
      // Close modal and advance
      setCommitRequest(null);
      setCurrentSetIndex(prev => prev + 1);
    } catch (err: any) {
      setCommitError(err.message || 'Gagal mengirimkan komitmen');
    } finally {
      setSubmittingCommit(false);
    }
  };

  if (currentIndex >= requests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-gr-text-primary/20">
          <RefreshCw size={40} />
        </div>
        <div>
          <h3 className="font-display text-3xl text-gr-text-primary">Sudah habis dijelajahi</h3>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/40">
            Tidak ada permintaan komoditas lagi saat ini.
          </p>
        </div>
        <Button 
          onClick={() => {
            setCurrentSetIndex(0);
            onEmpty();
          }}
          className="bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest px-8 cursor-pointer rounded-2xl py-3"
        >
          Muat Ulang
        </Button>
      </div>
    );
  }

  const currentRequest = requests[currentIndex];

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      <div className="relative h-[550px] w-full max-w-[380px]">
        <AnimatePresence>
          {activeRequests.map((request, index) => {
            const isFront = index === activeRequests.length - 1;
            return (
              <SwipeCard 
                key={request.id}
                request={request}
                isFront={isFront}
                index={activeRequests.length - 1 - index}
                onSwipe={(dir) => handleSwipe(dir, request)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex items-center gap-8">
        <button
          onClick={() => handleSwipe('left', currentRequest)}
          className="group flex h-16 w-16 items-center justify-center rounded-full border border-gr-price-unfair/30 bg-gr-price-unfair/5 text-gr-price-unfair transition-all hover:bg-gr-price-unfair hover:text-white hover:scale-110 active:scale-95 cursor-pointer"
        >
          <X size={32} />
        </button>
        <button
          onClick={() => handleSwipe('right', currentRequest)}
          className="group flex h-20 w-20 items-center justify-center rounded-full border border-gr-green/30 bg-gr-green/5 text-gr-green shadow-[0_0_20px_rgba(92,255,158,0.1)] transition-all hover:bg-gr-green hover:text-gr-bg hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Heart size={40} fill="currentColor" />
        </button>
      </div>

      {/* Commit Input Modal Overlay */}
      {commitRequest && (
        <div className="fixed inset-0 bg-[#07080F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0D0E16] border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <h3 className="font-display text-xl font-medium text-gr-text-primary mb-2 flex items-center gap-2">
              Komitmen Supply
            </h3>
            <p className="font-sans text-xs text-gr-text-primary/60 mb-6 leading-relaxed">
              Bantu penuhi permintaan <span className="text-gr-green font-semibold">{commitRequest.commodity_name}</span>. Berapa KG yang bisa Anda sediakan?
            </p>

            {commitError && (
              <div className="mb-4 rounded-xl bg-gr-price-unfair/10 p-3 text-xs text-gr-price-unfair border border-gr-price-unfair/20">
                {commitError}
              </div>
            )}

            <form onSubmit={handleCommitSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-primary/40 mb-1.5">
                  Jumlah (KG)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="Contoh: 50"
                  value={commitQty}
                  onChange={(e) => setCommitQty(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-gr-green/50 text-gr-text-primary px-3 py-2.5 rounded-xl font-sans text-xs focus:outline-none transition-all placeholder:text-gr-text-primary/30"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCommitRequest(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gr-text-primary font-sans text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCommit}
                  className="flex-1 bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingCommit ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Kirim'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface SwipeCardProps {
  request: DemandRequest;
  isFront: boolean;
  index: number;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ request, isFront, index, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const getRelativeDeadline = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    if (diffTime <= 0) return 'Sudah lewat';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${diffDays} hari lagi`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    if (remainingDays === 0) {
      return `${diffWeeks} minggu lagi`;
    }
    return `${diffWeeks} mgg ${remainingDays} hari lagi`;
  };

  const needed = request.quantity_kg_needed;
  const committed = request.quantity_kg_committed;
  const percent = needed > 0 ? Math.round((committed / needed) * 100) : 0;
  const numPetani = request.num_petani_committed || 0;

  // Determine progress badge color
  let progressBadgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
  if (percent >= 90) {
    progressBadgeColor = "bg-gr-green/10 text-gr-green border-gr-green/20";
  } else if (percent >= 70) {
    progressBadgeColor = "bg-lime-500/10 text-lime-400 border-lime-500/20";
  } else if (percent >= 30) {
    progressBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <motion.div
      style={{ 
        x: isFront ? x : 0, 
        rotate: isFront ? rotate : 0,
        zIndex: 50 - index,
        scale: 1 - index * 0.05,
        y: index * 10,
        filter: index > 0 ? 'blur(2px)' : 'none',
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1 - index * 0.05, opacity: 1, y: index * 10 }}
      exit={{ 
        x: x.get() > 0 ? 1000 : -1000, 
        opacity: 0, 
        scale: 0.5,
        transition: { duration: 0.4 } 
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing font-sans"
    >
      <div className="h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gr-bg-paper p-6 shadow-2xl transition-colors duration-300 flex flex-col justify-between">
        {/* Swiping Indicators */}
        {isFront && (
          <>
            <motion.div 
              style={{ opacity: likeOpacity }}
              className="absolute left-6 top-10 z-50 rounded-lg border-4 border-gr-green px-4 py-1 font-display text-3xl font-bold uppercase tracking-widest text-gr-green -rotate-12"
            >
              PENUHI
            </motion.div>
            <motion.div 
              style={{ opacity: nopeOpacity }}
              className="absolute right-6 top-10 z-50 rounded-lg border-4 border-gr-price-unfair px-4 py-1 font-display text-3xl font-bold uppercase tracking-widest text-gr-price-unfair rotate-12"
            >
              LEWATI
            </motion.div>
          </>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gr-text-paper/40">
              {request.category}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-gr-orange font-bold flex items-center gap-1">
              <Calendar size={11} />
              {getRelativeDeadline(request.deadline)}
            </span>
          </div>

          {/* Commodity Name */}
          <div className="space-y-1.5">
            <h3 className="font-display text-3xl font-medium leading-tight text-gr-text-paper">
              {request.commodity_name}
            </h3>
            <p className="font-mono text-[10px] text-gr-text-paper/30">
              Request ID: {request.id.slice(0, 8)}
            </p>
          </div>

          {/* Buyer / Requester info */}
          <div className="flex items-center justify-between border-t border-black/5 pt-3">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] uppercase tracking-widest text-gr-text-paper/40">Pemohon</span>
              <span className="font-sans text-xs font-semibold text-gr-text-paper">{request.buyer_name || 'Pembeli'}</span>
            </div>
            <div className="bg-black/[0.03] border border-black/5 rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0">
              <RatingBadge
                avgRating={request.buyer_rating_avg}
                ratingCount={request.buyer_rating_count}
                size="sm"
                newLabel="Pembeli Baru"
                countSuffix="permintaan"
              />
            </div>
          </div>

          <div className="border-t border-black/5 pt-5 space-y-4">
            {/* Target KG Needed */}
            <div className="flex justify-between items-end">
              <div>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-paper/40 mb-1">
                  Kebutuhan KG
                </span>
                <span className="font-mono text-2xl font-bold text-gr-text-paper">
                  {needed.toLocaleString('id-ID')} KG
                </span>
              </div>
              <div className="text-right">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-gr-text-paper/40 mb-1">
                  Sudah Terkumpul
                </span>
                <span className="font-mono text-lg font-bold text-gr-text-paper/80">
                  {committed.toLocaleString('id-ID')} KG
                </span>
              </div>
            </div>

            {/* Progress Badge and details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  progressBadgeColor
                )}>
                  {percent}% Terpenuhi
                </span>
                <span className="font-mono text-[10px] text-gr-text-paper/40 flex items-center gap-1">
                  <Users size={12} />
                  {numPetani} Petani Fulfill
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden border border-black/5">
                <div 
                  className="bg-gr-green h-full rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Warning Indicator or Polaroid Bottom Emblem */}
        <div>
          {percent >= 90 ? (
            <div className="rounded-xl bg-gr-price-unfair/10 border border-gr-price-unfair/20 p-3 text-[10px] text-gr-price-unfair leading-relaxed flex items-center gap-1.5 animate-pulse">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Hampir penuh — pertimbangkan permintaan lain</span>
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-black/5 pt-4 text-gr-text-paper/20">
              <span className="font-mono text-[8px] uppercase tracking-widest">Supply Signal Aggregator</span>
              <span className="font-display text-xl italic font-bold">G</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
