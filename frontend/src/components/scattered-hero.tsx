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

export function HeroHeadline() {
  const today = new Date();
  
  const formatDateIndonesian = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <section className="w-full max-w-[1100px] mx-auto px-8 py-12 md:py-16 text-center select-none">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-gr-down block mb-5">
        Rantai pasok pangan pedesaan
      </span>
      
      <h1 className="font-display text-[clamp(2.8rem,9vw,5.5rem)] font-semibold tracking-tight text-gr-ink max-w-[850px] mx-auto leading-[0.95] mb-6">
        Panen tanpa <em className="font-light italic text-gr-ink tracking-wide">tebakan</em>.
      </h1>
      
      <p className="font-display italic font-normal text-[clamp(1.05rem,2.2vw,1.35rem)] text-gr-ink-soft max-w-[600px] mx-auto leading-relaxed mb-6">
        Harga langsung dari petani, dibaca sebagai pola — bukan angka yang berdiri sendiri.
      </p>
      
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-gr-ink-soft mb-8 flex items-center justify-center gap-2">
        <span>Papan harga Grove</span>
        <span className="inline-block w-1 h-1 bg-gr-ink-soft rounded-full" />
        <span>Diperbarui {formatDateIndonesian(today)}</span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3.5">
        <a
          href="/beranda"
          className="font-mono text-xs uppercase tracking-wider bg-gr-board text-gr-chalk border-1.5 border-gr-board hover:bg-transparent hover:text-gr-board px-6 py-3 rounded-sm transition-all duration-300 cursor-pointer shadow-sm"
        >
          Jelajahi marketplace
        </a>
        <a
          href="/ajukan-permintaan"
          className="font-mono text-xs uppercase tracking-wider border-1.5 border-gr-ink bg-transparent hover:bg-gr-ink hover:text-gr-paper px-6 py-3 rounded-sm transition-all duration-300 cursor-pointer"
        >
          Pasang sinyal demand
        </a>
      </div>
    </section>
  );
}

export function LedeSection() {
  return (
    <section className="w-full max-w-[1100px] mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-12 relative z-40 select-none">
      <style dangerouslySetInnerHTML={{__html: `
        .lede-dropcap::first-letter {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-style: italic;
          font-size: 3.5em;
          float: left;
          line-height: 0.8;
          padding: 0.05em 0.08em 0 0;
          color: var(--gr-ink);
        }
      `}} />
      
      <p className="lede-dropcap font-sans text-sm md:text-[15.5px] leading-relaxed text-gr-ink-soft text-justify md:text-left m-0">
        Setiap musim, pola yang sama berulang: petani menanam berdasarkan harga yang mereka lihat saat itu, bukan harga yang berlaku saat panen tiba berbulan-bulan kemudian. Karena hampir semua petani membaca sinyal yang sama, mereka menanam komoditas yang sama pula — dan saat panen tiba serentak, pasokan membanjir, harga jatuh, dan siklus dimulai lagi musim berikutnya. Ekonom menyebut ini Cobweb Theorem: bukan kegagalan siapapun secara individual, tapi jebakan struktural akibat keputusan yang selalu satu langkah di belakang informasi.
      </p>
      
      <div className="border-t border-gr-line pt-6 md:pt-0 md:border-t-0 md:border-l md:pl-8 flex flex-col justify-start">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-gr-ink-soft mb-4">
          Cara baca papan harga
        </h2>
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          <li className="flex gap-2.5 font-sans text-[13px] leading-relaxed text-gr-ink-soft">
            <span className="font-display italic font-semibold text-gr-ink flex-shrink-0">i.</span>
            <span>Setiap panel adalah satu komoditas. Warnanya menandai arah — hijau naik, terracotta turun, abu stabil.</span>
          </li>
          <li className="flex gap-2.5 font-sans text-[13px] leading-relaxed text-gr-ink-soft">
            <span className="font-display italic font-semibold text-gr-ink flex-shrink-0">ii.</span>
            <span>Angka besar adalah harga hari ini. Grafik kecil melacak tren beberapa hari terakhir, titik terakhir ditandai garis putus-putus.</span>
          </li>
          <li className="flex gap-2.5 font-sans text-[13px] leading-relaxed text-gr-ink-soft">
            <span className="font-display italic font-semibold text-gr-ink flex-shrink-0">iii.</span>
            <span>Data diperbarui otomatis setiap hari dari acuan resmi PIHPS Bank Indonesia, bukan input manual.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
