'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  index: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="group relative flex flex-col space-y-3"
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-white/5 border border-white/10 transition-all duration-500 group-hover:border-gr-green/30">
        <img
          src={product.photo_url || '/placeholder-crop.jpg'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Status Tag */}
        <div className="absolute top-4 left-4">
          <span className="bg-gr-bg/80 backdrop-blur-md border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-gr-live flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-gr-live animate-pulse" />
            {product.status}
          </span>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gr-bg/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Info Section */}
      <div className="flex flex-col space-y-1 px-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gr-text-primary/40">
            {product.category}
          </span>
          <span className="font-mono text-[10px] text-gr-text-primary/40">
            {new Date(product.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="font-display text-2xl font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-2 flex items-baseline justify-between border-t border-white/5 pt-2">
          <div className="flex flex-col">
            <span className="font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">
              Harga / KG
            </span>
            <span className="font-mono text-xl text-gr-green">
              Rp {product.price_per_kg.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="text-right">
            <span className="font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">
              Stok
            </span>
            <span className="block font-mono text-sm text-gr-text-primary/80">
              {product.quantity_kg} KG
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
