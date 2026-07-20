'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { LogOut, LogIn, Leaf, PlusCircle, ClipboardList, Settings, X, AlertCircle, TrendingUp, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

      {/* Main navbar — flat editorial bar, full-width */}
      <nav className="sticky top-0 z-50 w-full bg-gr-paper/95 backdrop-blur-md border-b border-gr-line">
        <div className="mx-auto max-w-[1100px] px-8 flex h-14 items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-9 h-9 rounded-full border-2 border-gr-ink flex items-center justify-center font-display font-bold text-base text-gr-ink group-hover:bg-gr-ink group-hover:text-gr-paper transition-all duration-300">
              G
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-gr-ink">
              Grove
            </span>
          </Link>

          {/* Nav links — animated in/out (hidden on landing page) */}
          <AnimatePresence initial={false}>
            {!isLanding && (
              <motion.div
                key="nav-tabs"
                className="hidden md:flex items-stretch gap-0 h-full overflow-hidden"
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
                        'relative flex items-center gap-2 px-4 h-full font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200 select-none whitespace-nowrap border-b-2',
                        isActive
                          ? 'text-gr-ink border-gr-board'
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
                  {user.full_name || user.email || 'Pengguna'}
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
    </>
  );
}
