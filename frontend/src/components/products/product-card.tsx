'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PriceGauge } from './price-gauge';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: any;
  index: number;
}

const formatPriceShorthand = (price: number) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1).replace('.0', '')}jt`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}rb`;
  }
  return price.toString();
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const price = product.price_per_kg;
  const refPrice = product.reference_price_per_kg;

  // SVG params for 60px circle
  const size = 60;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let percentage = 0;
  let ringColor = "stroke-white/20"; // default grey
  let tooltipText = "Belum ada data referensi";

  if (refPrice) {
    percentage = Math.min(100, (price / refPrice) * 100);
    const ratio = price / refPrice;
    if (ratio >= 1.0) {
      ringColor = "stroke-gr-price-fair"; // green
      tooltipText = `Harga Adil (100% dari referensi: Rp ${refPrice.toLocaleString('id-ID')}/kg)`;
    } else if (ratio >= 0.9) {
      ringColor = "stroke-gr-price-warn"; // yellow
      tooltipText = `Harga Wajar (${Math.round(ratio * 100)}% dari referensi: Rp ${refPrice.toLocaleString('id-ID')}/kg)`;
    } else {
      ringColor = "stroke-gr-price-unfair"; // red
      tooltipText = `Harga Murah (${Math.round(ratio * 100)}% dari referensi: Rp ${refPrice.toLocaleString('id-ID')}/kg)`;
    }
  }

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getCardRotation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rot = (hash % 5) - 2; // returns value between -2 and 2
    return rot;
  };
  const cardRotation = getCardRotation(product.id);

  const isNew = new Date().getTime() - new Date(product.created_at).getTime() < 24 * 60 * 60 * 1000;
  const isLowStock = product.quantity_kg < 5;
  let orangeBadgeText = "";
  if (isNew) {
    orangeBadgeText = "Baru";
  } else if (isLowStock) {
    orangeBadgeText = "Stok Menipis";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="w-full h-full"
    >
      <div
        style={{ '--card-rot': `${cardRotation}deg` } as React.CSSProperties}
        className="group relative flex flex-col space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 hover:shadow-2xl transition-all duration-300 ease-out transform origin-center hover:scale-[1.02] hover:rotate-[var(--card-rot)] w-full h-full"
      >
        <Link href={`/produk/${product.id}`} className="absolute inset-0 z-10" />
      
      {/* Image & Price Ring Wrapper */}
      <div className="relative w-full">
        {/* Photo Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-white/5 border border-white/10 transition-all duration-500 group-hover:border-gr-green/30 rounded-2xl">
          <Image
            src={product.photo_url || '/placeholder-crop.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Tags Container */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
            <span className="bg-gr-bg/80 backdrop-blur-md border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-gr-live flex items-center gap-1.5 rounded-sm">
              <span className="h-1 w-1 rounded-full bg-gr-live animate-pulse" />
              {product.status}
            </span>
            {orangeBadgeText && (
              <span className="bg-gr-orange text-[#07080F] font-bold px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest rounded-sm shadow-md">
                {orangeBadgeText}
              </span>
            )}
          </div>
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gr-bg/20 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Circular Price ring positioned outside the photo container to prevent overflow clipping */}
        <div 
          className="absolute top-4 right-4 z-20 h-[60px] w-[60px] cursor-help group/tooltip"
        >
          {/* Tooltip */}
          <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-48 hidden group-hover/tooltip:block bg-gr-bg-elevated border border-white/10 text-gr-text-primary text-[10px] p-2 rounded shadow-xl backdrop-blur-md text-center z-30 font-mono">
            {tooltipText}
          </div>
          
          <svg width="60" height="60" className="transform -rotate-90">
            {/* Background circle track */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              className="fill-gr-bg/90 stroke-white/10"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            {refPrice && (
              <circle
                cx="30"
                cy="30"
                r={radius}
                className={cn("fill-transparent transition-all duration-500", ringColor)}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none text-gr-text-primary z-20 pointer-events-none">
            <span className="text-[8px] opacity-75 uppercase tracking-wider font-mono">Rp</span>
            <span className="text-[12px] font-bold font-mono text-gr-green tracking-tighter">
              {price.toLocaleString('id-ID')}
            </span>
            <span className="text-[8px] opacity-75 font-mono">/kg</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col space-y-2 px-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
            {product.category}
          </span>
          <span className="font-mono text-[10px] text-gr-text-primary/40">
            {new Date(product.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="font-display text-2xl font-medium text-gr-text-primary group-hover:text-gr-green transition-colors line-clamp-2 min-h-[4rem]">
          {product.name}
        </h3>
        
        <div className="mt-auto flex items-baseline justify-between border-t border-white/5 pt-2">
          <div className="flex flex-col">
            <span className="font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">
              Stok
            </span>
            <span className="block font-mono text-sm text-gr-text-primary/80">
              {product.quantity_kg} KG
            </span>
          </div>
          <div className="text-right">
            <span className="font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">
              Harga / KG
            </span>
            <span className="block font-mono text-sm text-gr-green">
              Rp {product.price_per_kg.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
};
