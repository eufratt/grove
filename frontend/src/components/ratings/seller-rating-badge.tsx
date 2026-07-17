'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface SellerRatingBadgeProps {
  avgRating: number | null | undefined;
  ratingCount: number | undefined;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const SellerRatingBadge: React.FC<SellerRatingBadgeProps> = ({
  avgRating,
  ratingCount = 0,
  size = 'md',
  showCount = true,
}) => {
  const hasRating = ratingCount > 0 && avgRating !== null && avgRating !== undefined;

  const sizeClasses = {
    sm: 'text-[10px] gap-1',
    md: 'text-xs gap-1.5',
    lg: 'text-sm gap-2',
  };

  const starSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  if (!hasRating) {
    return (
      <span className={`inline-flex items-center font-sans text-gr-text-primary/40 ${sizeClasses[size]}`}>
        <span>Penjual Baru</span>
      </span>
    );
  }

  // Format rating average to 1 decimal place
  const roundedRating = Number(avgRating).toFixed(1);

  return (
    <div className={`inline-flex items-center font-mono ${sizeClasses[size]}`}>
      <span className="flex items-center gap-0.5 text-amber-400">
        <Star size={starSizes[size]} fill="currentColor" className="stroke-none" />
        <span className="font-bold">{roundedRating}</span>
      </span>
      {showCount && (
        <span className="text-gr-text-primary/40 font-sans">
          ({ratingCount} transaksi)
        </span>
      )}
    </div>
  );
};
