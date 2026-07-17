import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ratingsApi } from '@/lib/api/ratings';

interface RatingFormProps {
  transactionType: 'PRODUCT_PURCHASE' | 'DEMAND_FULFILLMENT';
  referenceId: string;
  onSuccess: () => void;
  label?: string;
}

export function RatingForm({ transactionType, referenceId, onSuccess, label }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1 || score > 5) {
      setError('Silakan pilih rating 1-5 bintang');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await ratingsApi.submitRating({
        transaction_type: transactionType,
        reference_id: referenceId,
        score,
        comment: comment || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/60 mb-2">
          {label || 'Berikan Rating Anda'}
        </p>
        
        {/* Star Rating Select */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setScore(star)}
              onMouseEnter={() => setHoverScore(star)}
              onMouseLeave={() => setHoverScore(0)}
              className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
            >
              <Star
                size={24}
                className={
                  (hoverScore || score) >= star
                    ? 'fill-gr-green text-gr-green drop-shadow-[0_0_8px_rgba(92,255,158,0.3)]'
                    : 'text-white/20'
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-sans text-xs text-gr-text-primary/50 mb-1">
          Komentar (Opsional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bagaimana kualitas produk dan koordinasi transaksinya?"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-sans text-gr-text-primary placeholder-white/20 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-gr-price-unfair">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || score === 0}
        className="w-full bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 shadow-md shadow-gr-green/10"
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin mx-auto text-gr-bg" />
        ) : (
          'Kirim Rating'
        )}
      </Button>
    </form>
  );
}
