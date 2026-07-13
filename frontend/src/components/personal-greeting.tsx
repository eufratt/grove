'use client';

import React, { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { productsApi } from '@/lib/api/products';
import { Loader2 } from 'lucide-react';

export function PersonalGreeting() {
  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState<{ user_active_products_count: number; new_products_today_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGreetingData = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        
        const statsData = await productsApi.getPersonalStats();
        setStats(statsData);
      } catch (err) {
        setUser(null);
        // Try to get anonymous stats anyway (for buyer/generik products count today)
        try {
          const statsData = await productsApi.getPersonalStats();
          setStats(statsData);
        } catch (_) {}
      } finally {
        setLoading(false);
      }
    };

    fetchGreetingData();
  }, []);

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour <= 10) return "Selamat pagi";
    if (hour >= 11 && hour <= 14) return "Selamat siang";
    if (hour >= 15 && hour <= 17) return "Selamat sore";
    return "Selamat malam";
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/)[0];
  };

  const greeting = getGreetingText();
  const firstName = user ? getFirstName(user.full_name) : '';

  // Render subtext based on login status and role
  const renderSubtext = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center lg:justify-start gap-2 text-gr-text-primary/20 font-mono text-[9px] uppercase tracking-widest h-5">
          <Loader2 size={10} className="animate-spin text-gr-green" />
          Memuat sapaan...
        </div>
      );
    }

    if (!user) {
      return (
        <p className="font-sans text-xs uppercase tracking-wider text-gr-text-primary/70 mt-3">
          Temukan hasil panen segar langsung dari petani lokal di sekitarmu.
        </p>
      );
    }

    if (user.role === 'PETANI') {
      const activeCount = stats?.user_active_products_count ?? 0;
      if (activeCount === 0) {
        return (
          <p className="font-sans text-sm text-gr-text-primary/75 mt-3">
            Belum ada hasil panen yang kamu pasang. Yuk mulai jual.
          </p>
        );
      }
      return (
        <p className="font-sans text-sm text-gr-text-primary/75 mt-3">
          <span className="text-gr-green font-mono font-bold">{activeCount}</span> hasil panenmu sedang dicari pembeli.
        </p>
      );
    }

    // Default PEMBELI role or fallback
    const newCount = stats?.new_products_today_count ?? 0;
    if (newCount === 0) {
      return (
        <p className="font-sans text-sm text-gr-text-primary/70 mt-3">
          Lihat apa yang segar hari ini.
        </p>
      );
    }
    return (
      <p className="font-sans text-sm text-gr-text-primary/75 mt-3">
        <span className="text-gr-green font-mono font-bold">{newCount}</span> produk baru diposting hari ini.
      </p>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-8 text-center lg:text-left">
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-gr-live">
          Live Marketplace
        </span>
        <h1 className="mt-4 font-sans text-5xl md:text-6xl font-medium tracking-tight text-gr-text-primary">
          {user ? (
            <>
              {greeting}, <span className="font-display italic text-gr-green">{firstName}</span>
            </>
          ) : (
            `${greeting}.`
          )}
        </h1>
        <div className="mt-2 min-h-5">
          {renderSubtext()}
        </div>
      </div>
      
      <div className="lg:text-right flex items-center lg:items-end justify-center lg:justify-end">
        <p className="font-sans text-[10px] text-gr-text-primary/20 max-w-[200px] leading-normal italic mx-auto lg:ml-auto border-l lg:border-l-0 lg:border-r border-white/5 pl-4 lg:pl-0 lg:pr-4">
          "Menghubungkan langsung ladang petani dengan dapur Anda tanpa rantai tengkulak yang panjang."
        </p>
      </div>
    </div>
  );
}
