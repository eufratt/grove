'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { productsApi } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ScatteredHeroProps {
  products: any[];
  children: React.ReactNode;
}

const cardPresets = [
  { top: '8%', left: '5%', size: 'w-[160px]', zIndex: 'z-10' },
  { top: '15%', left: '32%', size: 'w-[190px]', zIndex: 'z-30', isFront: true },
  { top: '48%', left: '8%', size: 'w-[150px]', zIndex: 'z-20' },
  { top: '52%', left: '42%', size: 'w-[180px]', zIndex: 'z-10' },
  { top: '12%', left: '68%', size: 'w-[155px]', zIndex: 'z-20' },
];

export function ScatteredHero({ products, children }: ScatteredHeroProps) {
  const [liveStats, setLiveStats] = useState<{ total_commodities: number; last_updated: string; active_products: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await productsApi.getLiveStats();
        setLiveStats(stats);
      } catch (err) {
        console.error('Failed to fetch live stats for hero:', err);
      }
    };
    fetchStats();
  }, []);

  // Take 5 products to scatter
  const scatteredProducts = products.slice(0, 5);

  // Deterministic rotation generator based on string hash
  const getRotation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rot = (hash % 16) - 8; // returns value between -8 and 8
    return rot;
  };

  // Find the first product that has a bargain price
  const dealProduct = scatteredProducts.find(
    (p) => p.reference_price_per_kg && p.price_per_kg < p.reference_price_per_kg * 0.9
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 items-stretch justify-between w-full min-h-[480px]">
      {/* Kolom Kiri: PersonalGreeting, Search, Controls (~40%) */}
      <div className="w-full md:w-[42%] flex flex-col justify-center">
        {children}
      </div>

      {/* Kolom Kanan: Scattered Polaroid Photo Cards (~58%) */}
      <div className="hidden md:block md:w-[55%] relative overflow-hidden h-[480px]">
        {/* Glow effect inside scattered container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-gr-green/5 blur-3xl pointer-events-none" />
        
        {scatteredProducts.map((product, idx) => {
          const preset = cardPresets[idx % cardPresets.length];
          const rotation = getRotation(product.id);
          const isDeal = dealProduct?.id === product.id;

          return (
            <motion.div
              key={product.id}
              style={{
                top: preset.top,
                left: preset.left,
                transformOrigin: 'center center',
              }}
              initial={{ 
                opacity: 0, 
                scale: 0.8,
                rotate: rotation + (rotation > 0 ? 15 : -15) 
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: rotation 
              }}
              whileHover={{ 
                rotate: 0,
                scale: 1.06,
                zIndex: 50,
                transition: { duration: 0.3, ease: 'easeOut' }
              }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98]
              }}
              className={cn(
                "absolute bg-[#f9f7f1] border border-black/10 p-3 pb-5 shadow-2xl flex flex-col select-none cursor-pointer",
                preset.size,
                preset.zIndex
              )}
            >
              {/* Stat Badge for front/main card */}
              {preset.isFront && liveStats && (
                <div className="absolute -top-3 -right-3 z-50 bg-[#07080F]/90 border border-gr-green/30 text-gr-green px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider shadow-lg backdrop-blur-md">
                  🟢 {liveStats.total_commodities} harga acuan terpantau
                </div>
              )}

              {/* Deal/Urgent Badge for qualified card */}
              {isDeal && (
                <div className="absolute -top-3 -left-3 z-50 bg-gr-orange text-[#07080F] font-bold px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest shadow-lg animate-bounce">
                  🔥 Harga Terbaik Hari Ini
                </div>
              )}

              {/* Polaroid Photo Container */}
              <div className="relative aspect-square overflow-hidden bg-black/5 border border-black/5 mb-3">
                <Image
                  src={product.photo_url || '/placeholder-crop.jpg'}
                  alt={product.name}
                  width={200}
                  height={200}
                  sizes="200px"
                  className="h-full w-full object-cover pointer-events-none"
                />
              </div>

              {/* Polaroid Caption */}
              <div className="flex flex-col text-left">
                <span className="font-sans text-[11px] font-bold text-black/80 truncate">
                  {product.name}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[9px] text-black/40 uppercase tracking-widest">
                    {product.category}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-gr-green/90 bg-[#07080F]/90 px-1.5 py-0.5 rounded-sm">
                    {product.price_per_kg >= 1000 ? `${(product.price_per_kg / 1000).toFixed(0)}rb` : product.price_per_kg}/kg
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {scatteredProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <span className="font-display text-sm text-gr-text-primary/20 italic">
              Memuat tumpukan hasil panen...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
