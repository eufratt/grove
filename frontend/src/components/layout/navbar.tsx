'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { LogOut, LogIn, Leaf, Compass, PlusCircle, ClipboardList, Settings, X, AlertCircle, TrendingUp, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { GroveLogo } from '@/components/ui/grove-logo';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === '/';
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

  const getFirstName = (name?: string | null) => {
    if (!name) return '';
    const firstWord = name.trim().split(/\s+/)[0];
    if (firstWord.includes('@')) {
      return firstWord.split('@')[0];
    }
    return firstWord;
  };

  const navItems = [
    { name: 'Beranda', href: '/beranda', icon: Leaf },
    { name: 'Jelajah', href: '/jelajah', icon: Compass },
    { name: 'Harga Pasar', href: '/harga-pasar', icon: TrendingUp },
    { name: 'Tren Harga', href: '/tren-harga', icon: LineChart },
    ...(user && user.role === 'PETANI' ? [{ name: 'Jual', href: '/jual', icon: PlusCircle }] : []),
    ...(user && user.role === 'PEMBELI' ? [{ name: 'Ajukan Permintaan', href: '/permintaan-saya', icon: PlusCircle }] : []),
    ...(user ? [{ name: 'Pesanan', href: '/pesanan', icon: ClipboardList }] : []),
  ];

  return (
    <>
      {/* Phone warning banner */}
      {showBanner && (
        <div className="w-full bg-gradient-to-r from-gr-down/95 to-gr-down/40 border-b border-gr-line px-4 py-2.5 text-center text-xs font-sans text-gr-chalk flex items-center justify-between gap-4 transition-all duration-300 relative z-50">
          <div className="flex-1 flex items-center justify-center gap-2">
            <AlertCircle size={14} className="text-gr-chalk animate-pulse" />
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
            className="text-gr-chalk/70 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main navbar — floating pill island on map page, flat editorial bar on regular pages */}
      {pathname === '/harga-pasar' ? (
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gr-paper/95 backdrop-blur-md border border-gr-line rounded-sm shadow-md px-5 py-2 flex items-center justify-between gap-5 max-w-[90vw]">
          {/* Logo */}
          <div className="flex items-center">
            <GroveLogo href="/" size="sm" />
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-gr-line hidden md:block" />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === '/harga-pasar';
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 select-none whitespace-nowrap',
                    isActive
                      ? 'text-gr-chalk bg-gr-board font-bold'
                      : 'text-gr-ink-soft hover:text-gr-ink hover:bg-gr-ink/5'
                  )}
                >
                  <Icon size={11} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-gr-line hidden md:block" />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                  {getFirstName(user.full_name || user.email) || 'Pengguna'}
                </span>
                <Link
                  href="/settings"
                  className="flex items-center justify-center h-7 w-7 rounded-sm border border-gr-line hover:border-gr-board/40 text-gr-ink-soft hover:text-gr-board transition-all duration-200 cursor-pointer"
                  title="Pengaturan Profil"
                >
                  <Settings size={13} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-7 w-7 rounded-sm border border-gr-line hover:border-gr-down/40 text-gr-ink-soft hover:text-gr-down transition-all duration-200 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="font-mono text-[10px] uppercase tracking-wider bg-gr-board text-gr-chalk hover:bg-gr-board/90 px-3.5 py-1.5 rounded-sm transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <LogIn size={11} />
                  Masuk
                </span>
              </Link>
            )}
          </div>
        </nav>
      ) : (
        <nav className="sticky top-0 z-50 w-full bg-gr-paper/95 backdrop-blur-md border-b border-gr-line">
          <div className="mx-auto max-w-[1100px] px-8 py-3.5 flex items-center justify-between gap-8">

            {/* Logo */}
            <GroveLogo href="/" size="md" />

            {/* Nav links — animated in/out (hidden on landing page) */}
            <AnimatePresence initial={false}>
              {!isLanding && (
                <motion.div
                  key="nav-tabs"
                  className="hidden md:flex items-center gap-1 overflow-hidden"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + '/') ||
                      (item.href === '/permintaan-saya' && pathname === '/ajukan-permintaan');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'relative flex items-center gap-2 px-3.5 py-1.5 font-mono text-[10px] font-normal uppercase tracking-widest transition-colors duration-200 select-none whitespace-nowrap border-b-2',
                          isActive
                            ? 'text-gr-ink border-gr-board font-bold'
                            : 'text-gr-ink-soft border-transparent hover:text-gr-ink hover:border-gr-line'
                        )}
                      >
                        <Icon size={11} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.role === 'PETANI' && (
                    <span className="hidden xl:inline font-mono text-[9px] font-bold uppercase tracking-widest text-gr-board border border-gr-board/30 px-2 py-1">
                      Farmer
                    </span>
                  )}
                  <span className="hidden lg:inline font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
                    {getFirstName(user.full_name || user.email) || 'Pengguna'}
                  </span>
                  <Link
                    href="/settings"
                    className="flex items-center justify-center h-8 w-8 border border-gr-line hover:border-gr-board/40 text-gr-ink-soft hover:text-gr-board transition-all duration-200 cursor-pointer"
                    title="Pengaturan Profil"
                  >
                    <Settings size={14} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center h-8 w-8 border border-gr-line hover:border-gr-down/40 text-gr-ink-soft hover:text-gr-down transition-all duration-200 cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="font-mono text-[10px] uppercase tracking-wider border border-gr-ink bg-transparent hover:bg-gr-ink hover:text-gr-paper px-4 py-2 transition-all duration-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={12} />
                    Masuk
                  </span>
                </Link>
              )}
            </div>

          </div>
        </nav>
      )}
    </>
  );
}
