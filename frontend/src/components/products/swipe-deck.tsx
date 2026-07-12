'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Heart, RefreshCw, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price_per_kg: number;
  reference_price_per_kg?: number;
  photo_url: string;
  category: string;
  distance_km?: number;
}

interface SwipeDeckProps {
  products: Product[];
  onSwipeRight: (product: Product) => void;
  onSwipeLeft: (product: Product) => void;
  onEmpty: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ 
  products, 
  onSwipeRight, 
  onSwipeLeft,
  onEmpty 
}) => {
  const [currentIndex, setCurrentSetIndex] = useState(0);

  const activeProducts = useMemo(() => {
    return products.slice(currentIndex, currentIndex + 3).reverse();
  }, [products, currentIndex]);

  const handleSwipe = (direction: 'left' | 'right', product: Product) => {
    if (direction === 'right') {
      onSwipeRight(product);
    } else {
      onSwipeLeft(product);
    }
    setCurrentSetIndex(prev => prev + 1);
  };

  if (currentIndex >= products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-gr-text-primary/20">
          <RefreshCw size={40} />
        </div>
        <div>
          <h3 className="font-display text-3xl text-gr-text-primary">Sudah habis dijelajahi</h3>
          <p className="mt-2 font-sans text-sm text-gr-text-primary/40">
            Tidak ada produk lagi di sekitar Anda saat ini.
          </p>
        </div>
        <Button 
          onClick={onEmpty}
          className="bg-gr-green text-gr-bg hover:bg-gr-green/90 font-sans font-bold uppercase tracking-widest px-8"
        >
          Muat Ulang
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      <div className="relative h-[550px] w-full max-w-[380px]">
        <AnimatePresence>
          {activeProducts.map((product, index) => {
            const isFront = index === activeProducts.length - 1;
            return (
              <SwipeCard 
                key={product.id}
                product={product}
                isFront={isFront}
                index={activeProducts.length - 1 - index}
                onSwipe={(dir) => handleSwipe(dir, product)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex items-center gap-8">
        <button
          onClick={() => handleSwipe('left', products[currentIndex])}
          className="group flex h-16 w-16 items-center justify-center rounded-full border border-gr-price-unfair/30 bg-gr-price-unfair/5 text-gr-price-unfair transition-all hover:bg-gr-price-unfair hover:text-white hover:scale-110 active:scale-95"
        >
          <X size={32} />
        </button>
        <button
          onClick={() => handleSwipe('right', products[currentIndex])}
          className="group flex h-20 w-20 items-center justify-center rounded-full border border-gr-green/30 bg-gr-green/5 text-gr-green shadow-[0_0_20px_rgba(92,255,158,0.1)] transition-all hover:bg-gr-green hover:text-gr-bg hover:scale-110 active:scale-95"
        >
          <Heart size={40} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

interface SwipeCardProps {
  product: Product;
  isFront: boolean;
  index: number;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ product, isFront, index, onSwipe }) => {
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

  // Determine price color
  let priceColor = "var(--gr-price-fair)";
  if (product.reference_price_per_kg) {
    if (product.price_per_kg < product.reference_price_per_kg) {
      if (product.price_per_kg >= product.reference_price_per_kg * 0.9) {
        priceColor = "var(--gr-price-warn)";
      } else {
        priceColor = "var(--gr-price-unfair)";
      }
    }
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
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gr-bg-paper p-4 shadow-2xl transition-colors duration-300">
        {/* Swiping Indicators */}
        {isFront && (
          <>
            <motion.div 
              style={{ opacity: likeOpacity }}
              className="absolute left-6 top-10 z-50 rounded-lg border-4 border-gr-green px-4 py-1 font-display text-4xl font-bold uppercase tracking-widest text-gr-green -rotate-12"
            >
              SIMPAN
            </motion.div>
            <motion.div 
              style={{ opacity: nopeOpacity }}
              className="absolute right-6 top-10 z-50 rounded-lg border-4 border-gr-price-unfair px-4 py-1 font-display text-4xl font-bold uppercase tracking-widest text-gr-price-unfair rotate-12"
            >
              LEWATI
            </motion.div>
          </>
        )}

        {/* Polaroid Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/5">
          <img 
            src={product.photo_url || '/placeholder-crop.jpg'} 
            alt={product.name} 
            className="h-full w-full object-cover grayscale-[0.1] contrast-[1.05]"
          />
        </div>

        {/* Info Section */}
        <div className="mt-6 flex flex-col space-y-4 px-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gr-text-paper/40">
              {product.category}
            </span>
            {product.distance_km !== undefined && product.distance_km !== null && (
              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-gr-orange">
                <MapPin size={10} />
                {product.distance_km.toFixed(1)} KM
              </span>
            )}
          </div>

          <h3 className="font-display text-3xl font-medium leading-tight text-gr-text-paper">
            {product.name}
          </h3>

          <div className="flex items-end justify-between border-t border-black/5 pt-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: priceColor, boxShadow: `0 0 8px ${priceColor}` }} 
                />
                <span className="font-sans text-[10px] uppercase tracking-widest text-gr-text-paper/40">
                  Harga / KG
                </span>
              </div>
              <span className="font-mono text-2xl font-bold text-gr-text-paper">
                Rp {product.price_per_kg.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full border border-black/5 bg-black/2 flex items-center justify-center opacity-20">
              <span className="font-display text-xl text-gr-text-paper italic">G</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
