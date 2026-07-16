'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { LogOut, LogIn, Leaf, PlusCircle, ClipboardList, Settings, X, AlertCircle, TrendingUp, LineChart } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        if (!userData.phone_whatsapp) {
          const isDismissed = localStorage.getItem('phone_warning_dismissed');
          if (!isDismissed) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        } else {
          setShowBanner(false);
        }
      } catch (err) {
        setUser(null);
        setShowBanner(false);
      }
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { name: 'Beranda', href: '/beranda', icon: Leaf },
    { name: 'Harga Pasar', href: '/harga-pasar', icon: TrendingUp },
    { name: 'Tren Harga', href: '/tren-harga', icon: LineChart },
    ...(user && user.role === 'PETANI' ? [{ name: 'Mulai Jual', href: '/jual', icon: PlusCircle }] : []),
    ...(user && user.role === 'PEMBELI' ? [{ name: 'Ajukan Permintaan', href: '/permintaan-saya', icon: PlusCircle }] : []),
    ...(user ? [{ name: 'Pesanan Saya', href: '/pesanan', icon: ClipboardList }] : []),
  ];

  return (
    <>
      {showBanner && (
        <div className="w-full bg-gradient-to-r from-gr-orange/95 to-gr-orange/40 border-b border-white/5 px-4 py-2.5 text-center text-xs font-sans text-gr-text-primary flex items-center justify-between gap-4 transition-all duration-300 relative z-50">
          <div className="flex-1 flex items-center justify-center gap-2">
            <AlertCircle size={14} className="text-gr-text-primary animate-pulse" />
            <span>
              Lengkapi nomor WA kamu untuk pengalaman belanja lebih lancar.{' '}
              <Link href="/settings" className="underline font-bold hover:text-white transition-colors">
                Lengkapi Sekarang
              </Link>
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('phone_warning_dismissed', 'true');
              setShowBanner(false);
            }}
            className="text-gr-text-primary/70 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <nav className="sticky top-0 z-50 w-full bg-transparent border-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
        <div className="flex h-14 items-center justify-between bg-[#07080F]/70 border border-white/5 rounded-full px-6 backdrop-blur-md shadow-lg">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gr-green/20 bg-gr-green/5 text-gr-green transition-all duration-300 group-hover:border-gr-green/50 group-hover:bg-gr-green/10">
                <Leaf size={16} className="transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 rounded-lg bg-gr-green/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-display text-xl font-medium tracking-tight text-gr-text-primary">
                Grove
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <LayoutGroup id="navbar">
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm relative">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                pathname.startsWith(item.href + '/') ||
                (item.href === '/permintaan-saya' && pathname === '/ajukan-permintaan');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 select-none z-10",
                    isActive 
                      ? "text-gr-bg" 
                      : "text-gr-text-primary/50 hover:text-gr-text-primary hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      initial={false}
                      className="absolute inset-0 bg-gr-green rounded-full -z-10 shadow-lg shadow-gr-green/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={12} className="relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>
          </LayoutGroup>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'PETANI' && (
                  <span className="hidden xl:inline-flex items-center justify-center h-8 font-sans text-[10px] font-bold uppercase tracking-widest text-gr-green bg-gr-green/10 border border-gr-green/20 px-3 rounded-full">
                    Farmer
                  </span>
                )}
                <span className="hidden lg:inline-flex items-center justify-center h-8 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/60 bg-white/5 border border-white/10 px-3 rounded-full">
                  {user.full_name || user.email || 'Pengguna'}
                </span>
                <Link
                  href="/settings"
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 hover:border-gr-green/30 bg-white/2 hover:bg-gr-green/5 text-gr-text-primary/70 hover:text-gr-green transition-all duration-300 cursor-pointer"
                  title="Pengaturan Profil"
                >
                  <Settings size={14} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 hover:border-gr-orange/30 bg-white/2 hover:bg-gr-orange/5 text-gr-text-primary/70 hover:text-gr-orange transition-all duration-300 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center h-8 gap-2 rounded-full border border-white/10 hover:border-gr-green/30 bg-white/2 hover:bg-gr-green/5 px-4 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/70 hover:text-gr-green transition-all duration-300 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
