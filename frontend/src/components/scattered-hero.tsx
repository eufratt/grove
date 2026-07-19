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

export function QuoteSection() {
  return (
    <section className="w-full max-w-[900px] mx-auto px-8 py-10 relative z-40 select-none">
      {/* Quote Eyebrow */}
      <div className="flex items-center gap-4 justify-center mb-8">
        <span className="flex-1 h-px bg-gr-line" />
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-gr-ink-soft whitespace-nowrap">
          Kenapa harga pangan berulang jatuh
        </span>
        <span className="flex-1 h-px bg-gr-line" />
      </div>

      {/* Quote Content */}
      <blockquote className="font-display font-light italic text-[clamp(1.5rem,4vw,2.125rem)] text-gr-ink text-center leading-relaxed max-w-[780px] mx-auto mb-8">
        “Petani menanam berdasarkan harga musim lalu. Panen tiba serentak, dan harga jatuh sebelum siapapun sempat <span className="font-display font-light italic text-gr-down tracking-wide">bertanya</span>.”
      </blockquote>

      {/* Diamond Divider */}
      <div className="flex items-center gap-4 justify-center max-w-[280px] mx-auto mb-10">
        <span className="flex-1 h-px bg-gr-line" />
        <span className="w-1.5 h-1.5 bg-gr-ink rotate-45 flex-shrink-0" />
        <span className="flex-1 h-px bg-gr-line" />
      </div>
    </section>
  );
}

export function Sparkline({ history, color }: { history: { price_per_kg: number }[]; color: string }) {
  if (!history || history.length === 0) {
    return (
      <svg className="block w-full h-[58px] mb-3.5 bg-gr-ink/5 opacity-40">
        <line x1="0" y1="30" x2="300" y2="30" stroke={color} strokeWidth={1} strokeDasharray="3,3" />
      </svg>
    );
  }

  const prices = history.map(h => h.price_per_kg);
  const n = prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const width = 300;
  const height = 60;
  const xPaddingRight = 20;
  const xUsable = width - xPaddingRight;
  
  const points = prices.map((price, idx) => {
    const x = n > 1 ? (idx / (n - 1)) * xUsable : 0;
    const y = 52 - ((price - minPrice) / priceRange) * 44;
    return { x, y };
  });

  const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const pathD = points.length > 0
    ? `M0,60 L${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} L${points[points.length - 1].x.toFixed(1)},60 Z`
    : '';

  const lastPoint = points[points.length - 1] || { x: 0, y: 30 };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block w-full h-[58px] mb-3.5 select-none">
      {pathD && <path d={pathD} fill={color} opacity={0.12} />}
      <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2} />
      <line 
        x1={lastPoint.x.toFixed(1)} 
        y1={lastPoint.y.toFixed(1)} 
        x2={lastPoint.x.toFixed(1)} 
        y2={60} 
        stroke={color} 
        strokeDasharray="3,3" 
        strokeWidth={1} 
      />
      <circle cx={lastPoint.x.toFixed(1)} cy={lastPoint.y.toFixed(1)} r={3} fill={color} />
    </svg>
  );
}

interface FigPanelsProps {
  pricesData?: {
    commodityName: string;
    priceToday: number;
    priceYesterday: number;
    delta: number;
    history: { scraped_at: string; price_per_kg: number }[];
    desc: string;
    swatchColor: string;
  }[];
}

const defaultFigPanelsData = [
  {
    commodityName: 'Cabai rawit merah',
    priceToday: 42500,
    priceYesterday: 41544,
    delta: 2.3,
    history: [
      { scraped_at: '1', price_per_kg: 45000 },
      { scraped_at: '2', price_per_kg: 40000 },
      { scraped_at: '3', price_per_kg: 42000 },
      { scraped_at: '4', price_per_kg: 25000 },
      { scraped_at: '5', price_per_kg: 30000 },
      { scraped_at: '6', price_per_kg: 15000 },
      { scraped_at: '7', price_per_kg: 20000 },
      { scraped_at: '8', price_per_kg: 8000 }
    ],
    desc: 'Naik tajam sejak akhir pekan lalu, sejalan dengan turunnya pasokan pascapanen di Jawa Barat.',
    swatchColor: 'var(--gr-up)'
  },
  {
    commodityName: 'Bawang merah',
    priceToday: 28100,
    priceYesterday: 28615,
    delta: -1.8,
    history: [
      { scraped_at: '1', price_per_kg: 8000 },
      { scraped_at: '2', price_per_kg: 14000 },
      { scraped_at: '3', price_per_kg: 12000 },
      { scraped_at: '4', price_per_kg: 22000 },
      { scraped_at: '5', price_per_kg: 20000 },
      { scraped_at: '6', price_per_kg: 32000 },
      { scraped_at: '7', price_per_kg: 28000 },
      { scraped_at: '8', price_per_kg: 40000 }
    ],
    desc: 'Melandai setelah panen serentak membanjiri pasar Brebes dan sekitarnya.',
    swatchColor: 'var(--gr-down)'
  },
  {
    commodityName: 'Telur ayam ras segar',
    priceToday: 27800,
    priceYesterday: 28052,
    delta: -0.9,
    history: [
      { scraped_at: '1', price_per_kg: 28000 },
      { scraped_at: '2', price_per_kg: 26000 },
      { scraped_at: '3', price_per_kg: 29000 },
      { scraped_at: '4', price_per_kg: 24000 },
      { scraped_at: '5', price_per_kg: 27000 },
      { scraped_at: '6', price_per_kg: 25000 },
      { scraped_at: '7', price_per_kg: 26000 },
      { scraped_at: '8', price_per_kg: 24000 }
    ],
    desc: 'Mendekati kisaran stabil seiring dengan konsolidasi harga pakan ayam ras.',
    swatchColor: 'var(--gr-ink-soft)'
  }
];

export function FigPanels({ pricesData }: FigPanelsProps) {
  const panelsData = pricesData && pricesData.length > 0 ? pricesData : defaultFigPanelsData;

  return (
    <section className="w-full max-w-[1100px] mx-auto px-8 pb-16 relative z-40 select-none">
      {/* Fig Head */}
      <div className="flex justify-between items-baseline flex-wrap gap-2 border-b border-gr-line pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase text-gr-down">Fig. 1</span>
          <span className="font-display font-semibold text-lg text-gr-ink">Papan harga hari ini</span>
        </div>
        <div className="font-sans italic text-xs text-gr-ink-soft">
          Diperbarui otomatis setiap hari dari PIHPS, Bank Indonesia
        </div>
      </div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {panelsData.map((panel, idx) => {
          // Dynamic calculation of color and delta display
          const isUp = panel.delta > 0;
          const isDown = panel.delta < 0;
          
          let color = 'var(--gr-ink-soft)';
          let deltaText = `± stabil, 0,0%`;
          let swatchBg = 'bg-gr-ink-soft';
          let deltaColor = 'text-gr-ink-soft';
          
          if (isUp) {
            color = 'var(--gr-up)';
            deltaText = `▲ naik ${panel.delta.toFixed(1)}% dari kemarin`;
            swatchBg = 'bg-gr-up';
            deltaColor = 'text-gr-up';
          } else if (isDown) {
            color = 'var(--gr-down)';
            deltaText = `▼ turun ${Math.abs(panel.delta).toFixed(1)}% dari kemarin`;
            swatchBg = 'bg-gr-down';
            deltaColor = 'text-gr-down';
          }

          return (
            <div key={idx} className="border border-gr-line rounded-sm p-5 flex flex-col bg-white/20 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-widest text-gr-ink-soft mb-3.5">
                <span className={`w-2 h-2 ${swatchBg} flex-shrink-0`} />
                <span>{panel.commodityName}</span>
              </div>
              <div className="font-display font-bold text-3xl text-gr-ink mb-0.5">
                Rp {panel.priceToday.toLocaleString('id-ID')}
                <span className="font-sans font-medium text-xs text-gr-ink-soft ml-1">/kg</span>
              </div>
              <div className={`font-sans text-xs ${deltaColor} mb-3.5`}>
                {deltaText}
              </div>
              
              {/* SVG Sparkline */}
              <Sparkline history={panel.history} color={color} />
              
              <p className="font-sans text-[13px] leading-relaxed text-gr-ink-soft m-0">
                {panel.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Entries Section: Bagaimana Grove memutus siklus harga */}
      <div className="border-t-2 border-gr-ink pt-4">
        <div className="font-mono text-[11px] tracking-widest uppercase text-gr-ink-soft mb-6">
          Bagaimana Grove memutus siklus harga
        </div>
        
        <div className="flex flex-col gap-6">
          {[
            {
              mark: 'A',
              title: 'Sinyal permintaan, sebelum tanam',
              desc: 'Pembeli memasang kebutuhan sebelum musim tanam dimulai. Petani merespons permintaan nyata lewat kartu geser sederhana, bukan menebak dari harga musim lalu.',
              theory: 'Teori Cobweb · memutus lag informasi'
            },
            {
              mark: 'B',
              title: 'Transparansi sesama petani',
              desc: 'Setiap sinyal demand menunjukkan progres langsung — berapa persen sudah terpenuhi, berapa petani sudah berkomitmen — agar keputusan tanam tidak lagi buta terhadap keputusan petani lain.',
              theory: 'Teori Cobweb · mencegah pasokan berlebih serentak'
            },
            {
              mark: 'C',
              title: 'Harga sebagai pola, bukan snapshot',
              desc: 'Grafik tren historis dari data PIHPS Bank Indonesia membaca harga sebagai siklus musiman, bukan angka sesaat yang mudah menyesatkan keputusan.',
              theory: 'Teori Cobweb · konteks siklus harga'
            },
            {
              mark: 'D',
              title: 'Harga wajar saat transaksi',
              desc: 'PriceGauge membandingkan harga tiap produk terhadap acuan secara langsung, menutup celah informasi antara petani dan pembeli saat transaksi berlangsung.',
              theory: 'Asimetri informasi · Akerlof'
            }
          ].map((entry, idx) => (
            <div key={idx} className="grid grid-cols-[52px_1fr] gap-5 py-6 border-b border-gr-line last:border-0">
              <span className="font-display font-bold text-[26px] text-gr-down">{entry.mark}</span>
              <div>
                <h3 className="font-display font-semibold text-lg text-gr-ink m-0 mb-2">{entry.title}</h3>
                <p className="font-sans text-[14.5px] leading-relaxed text-gr-ink-soft max-w-[580px] m-0 mb-2.5">{entry.desc}</p>
                <span className="font-mono text-[10px] tracking-wider uppercase text-gr-down">{entry.theory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
