'use client';

import React from 'react';

interface TickerProps {
  pricesData?: {
    commodityName: string;
    priceToday: number;
    delta: number;
  }[];
}

const defaultTickerItems = [
  { commodityName: 'CABAI RAWIT MERAH', priceToday: 42500, delta: 2.3 },
  { commodityName: 'BAWANG MERAH', priceToday: 28100, delta: -1.8 },
  { commodityName: 'GABAH KERING PANEN', priceToday: 6200, delta: 0.5 },
  { commodityName: 'TELUR AYAM RAS', priceToday: 27800, delta: -0.9 },
  { commodityName: 'JAGUNG PIPILAN', priceToday: 5400, delta: 1.1 },
];

export function Ticker({ pricesData }: TickerProps) {
  const items = pricesData && pricesData.length > 0 ? pricesData : defaultTickerItems;
  // Repeat items to ensure smooth infinite marquee scroll without gaps
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="w-full bg-gr-board text-gr-chalk overflow-hidden border-b border-gr-chalk/10 relative z-50">
      <div className="animate-ticker flex whitespace-nowrap items-center">
        {repeatedItems.map((item, idx) => {
          const isUp = item.delta > 0;
          const isDown = item.delta < 0;
          const deltaText = isUp 
            ? `▲ ${item.delta.toFixed(1)}%` 
            : isDown 
            ? `▼ ${Math.abs(item.delta).toFixed(1)}%` 
            : `± 0.0%`;
          
          return (
            <span 
              key={idx} 
              className="inline-flex items-center gap-2 mr-12 font-mono text-xs uppercase tracking-widest"
            >
              <span>{item.commodityName}</span>
              <span className="opacity-40">·</span>
              <span>Rp {item.priceToday.toLocaleString('id-ID')}/kg</span>
              <span className={isUp ? "text-gr-up-board" : isDown ? "text-gr-down-board" : "text-gr-chalk/60"}>
                {deltaText}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Temporary empty placeholder export to avoid import errors on other components
export function ScatteredHero() {
  return null;
}
