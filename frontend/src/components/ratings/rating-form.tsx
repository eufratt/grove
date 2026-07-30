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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim rating';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="mt-4 flex flex-col sm:flex-row sm:items-end gap-4 bg-transparent w-full"
    >
      {/* Star Rating Select */}
      <div className="flex-none">
        <p className="font-mono text-[10px] uppercase tracking-wider text-gr-text-primary/60 mb-2">
          {label || 'Berikan Rating Anda'}
        </p>
        <div className="flex items-center gap-1">
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
                size={22}
                className={
                  (hoverScore || score) >= star
                    ? 'fill-gr-green text-gr-green '
                    : 'text-gr-text-primary/25'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment Field */}
      <div className="flex-1 min-w-0">
        <label className="block font-sans text-xs text-gr-text-primary/50 mb-1">
          Komentar (Opsional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            e.target.style.height = '36px';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder="Tulis ulasan Anda di sini..."
          rows={1}
          style={{ height: '36px', minHeight: '36px' }}
          className="w-full rounded-sm border border-gr-line bg-gr-bg-elevated px-3 py-2 text-xs font-sans text-gr-text-primary placeholder-gr-text-primary/30 focus:border-gr-green focus:outline-none focus:ring-1 focus:ring-gr-green resize-none overflow-hidden"
        />
      </div>

      {/* Submit Button */}
      <div className="flex-none flex flex-col justify-end">
        {error && (
          <p className="text-[10px] text-gr-price-unfair mb-1">{error}</p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || score === 0}
          className="w-full sm:w-auto bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans text-xs font-bold uppercase tracking-widest px-4 h-[36px] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 flex items-center justify-center"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin text-gr-bg" />
          ) : (
            'Kirim'
          )}
        </Button>
      </div>
    </form>
  );
}
