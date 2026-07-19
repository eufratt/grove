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

export function KickerBar() {
  const today = new Date();
  
  const formatDateIndonesian = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getEditionNumber = () => {
    const baseDate = new Date('2025-12-18');
    const diffTime = Math.abs(today.getTime() - baseDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="w-full relative z-40">
      {/* Kicker bar double rule lines */}
      <div className="h-[3px] bg-gr-ink max-w-[1100px] mx-auto" />
      <div className="h-[1px] bg-gr-ink max-w-[1100px] mx-auto mt-[3px]" />
      
      {/* Meta Row */}
      <div className="max-w-[1100px] mx-auto padding-kicker px-8 pt-3.5 flex justify-between flex-wrap gap-2 font-mono text-[10px] tracking-widest uppercase text-gr-ink-soft select-none">
        <span>Buletin harga pangan · Nº {getEditionNumber()}</span>
        <span className="hidden sm:inline">Grove · Rantai pasok pangan pedesaan</span>
        <span>PIHPS · {formatDateIndonesian(today)}</span>
      </div>
    </div>
  );
}

export function MastheadNav() {
  return (
    <header className="w-full max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between flex-wrap gap-4 relative z-40 select-none bg-transparent">
      {/* Logo Wordmark */}
      <a href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-full border-2 border-gr-ink flex items-center justify-center font-display font-bold text-lg text-gr-ink group-hover:bg-gr-ink group-hover:text-gr-paper transition-all duration-300">
          G
        </div>
        <span className="font-display font-semibold text-xl tracking-tight text-gr-ink">
          Grove
        </span>
      </a>

      {/* Action / Login button */}
      <div className="flex items-center gap-3">
        <a 
          href="/login"
          className="font-mono text-xs uppercase tracking-wider border-1.5 border-gr-ink bg-transparent hover:bg-gr-ink hover:text-gr-paper px-5 py-2.5 rounded-sm transition-all duration-300 cursor-pointer"
        >
          Masuk
        </a>
      </div>
    </header>
  );
}
