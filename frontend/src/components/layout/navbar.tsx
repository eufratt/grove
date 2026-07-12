'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { LogOut, LogIn, Leaf, PlusCircle, ClipboardList } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.getMe();
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { name: 'Beranda', href: '/beranda', icon: Leaf },
    { name: 'Mulai Jual', href: '/jual', icon: PlusCircle },
    { name: 'Pesanan Saya', href: '/pesanan', icon: ClipboardList },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-gr-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/beranda" className="flex items-center gap-2 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gr-green/20 bg-gr-green/5 text-gr-green transition-all duration-300 group-hover:border-gr-green/50 group-hover:bg-gr-green/10">
                <Leaf size={18} className="transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 rounded-lg bg-gr-green/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-display text-2xl font-medium tracking-tight text-gr-text-primary">
                Grove
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex sm:space-x-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300",
                    isActive 
                      ? "bg-gr-green text-gr-bg shadow-lg shadow-gr-green/25" 
                      : "text-gr-text-primary/50 hover:text-gr-text-primary hover:bg-white/5"
                  )}
                >
                  <Icon size={14} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-white/10 hover:border-gr-orange/30 bg-white/2 hover:bg-gr-orange/5 px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/70 hover:text-gr-orange transition-all duration-300 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full border border-white/10 hover:border-gr-green/30 bg-white/2 hover:bg-gr-green/5 px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/70 hover:text-gr-green transition-all duration-300 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation bar */}
      <div className="sm:hidden flex justify-around border-t border-white/5 bg-gr-bg/95 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider transition-all",
                isActive ? "text-gr-green" : "text-gr-text-primary/45"
              )}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
