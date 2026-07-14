'use client';

import React from 'react';
import Link from 'next/link';
import { BgPattern } from '@/components/effects/bg-pattern';
import { FilmGrain } from '@/components/effects/film-grain';
import { Glow } from '@/components/effects/glow';
import { Leaf, ArrowRight, ShieldAlert, MapPin, MessageCircle, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gr-bg text-gr-text-primary flex flex-col justify-between overflow-hidden">
      <BgPattern />
      <FilmGrain />
      <Glow color="var(--gr-green)" position="top" className="opacity-10 scale-110 pointer-events-none" />
      <Glow color="var(--gr-orange)" position="bottom" className="opacity-5 scale-90 pointer-events-none" />

      {/* Header / Brand Logo */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gr-green/20 bg-gr-green/5 text-gr-green transition-all duration-300 group-hover:border-gr-green/50 group-hover:bg-gr-green/10">
            <Leaf size={18} className="transition-transform group-hover:rotate-12" />
          </div>
          <span className="font-display text-2xl font-medium tracking-tight text-gr-text-primary">
            Grove
          </span>
        </Link>

        <Link
          href="/login"
          className="rounded-full border border-white/10 hover:border-gr-green/30 bg-white/2 hover:bg-gr-green/5 px-5 py-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/70 hover:text-gr-green transition-all duration-300 cursor-pointer"
        >
          Masuk
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 md:py-20 text-center flex-1 flex flex-col justify-center items-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live px-3 py-1 rounded-full border border-gr-live/20 bg-gr-live/5 mb-6 animate-pulse">
          Marketplace Pangan Transparan
        </span>
        
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-gr-text-primary max-w-4xl leading-tight">
          Hancurkan Monopoli Harga, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gr-green via-gr-live to-[#a6ffd0]">
            Sejahterakan Petani Lokal.
          </span>
        </h1>
        
        <p className="mt-6 font-sans text-base md:text-lg text-gr-text-primary/60 max-w-2xl leading-relaxed">
          Selamat tinggal permainan harga tengkulak. Grove menghubungkan petani secara langsung dengan pembeli menggunakan acuan harga pangan nasional (PIHPS) yang transparan dan akurat.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/beranda"
            className="group flex items-center gap-2 bg-gr-green hover:bg-gr-green/90 text-gr-bg font-sans text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-full shadow-lg shadow-gr-green/20 hover:shadow-gr-green/30 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
          >
            <span>Jelajahi Marketplace</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gr-text-primary font-sans text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-full transition-all duration-300 cursor-pointer"
          >
            Mulai Menjual
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 border-t border-white/5 bg-white/[0.01] backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-gr-green/20 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gr-green/5 border border-gr-green/10 text-gr-green mb-4">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-display text-lg font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
              Acuan Harga Transparan
            </h3>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/55 leading-relaxed">
              Mencegah manipulasi harga tengkulak dengan data referensi harga pangan nasional (PIHPS) yang di-update otomatis.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-gr-green/20 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gr-green/5 border border-gr-green/10 text-gr-green mb-4">
              <MapPin size={20} />
            </div>
            <h3 className="font-display text-lg font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
              Pencarian Berbasis Lokasi
            </h3>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/55 leading-relaxed">
              Cari dan temukan hasil panen segar langsung dari kebun terdekat dari posisi Anda dengan jangkauan radius dinamis.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-gr-green/20 transition-all duration-300">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gr-green/5 border border-gr-green/10 text-gr-green mb-4">
              <MessageCircle size={20} />
            </div>
            <h3 className="font-display text-lg font-medium text-gr-text-primary group-hover:text-gr-green transition-colors">
              Transaksi Direct WA
            </h3>
            <p className="mt-2 font-sans text-sm text-gr-text-primary/55 leading-relaxed">
              Tanpa perantara komisi. Lakukan transaksi langsung dengan petani atau pembeli via WhatsApp dalam hitungan detik.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gr-text-primary/30">
          © {new Date().getFullYear()} Grove Marketplace. Powered by Real-Time PIHPS Data scraping.
        </p>
      </footer>
    </main>
  );
}
