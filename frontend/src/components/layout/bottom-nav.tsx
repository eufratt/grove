'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api/auth';

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'beranda' | 'jelajah' | 'jual' | 'ajukan' | 'pesanan' | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();

    if (pathname === '/login') {
      setActiveTab(null);
      return;
    }

    if (pathname === '/jual') {
      setActiveTab('jual');
    } else if (pathname === '/ajukan-permintaan' || pathname === '/permintaan-saya') {
      setActiveTab('ajukan');
    } else if (pathname === '/pesanan') {
      setActiveTab('pesanan');
    } else if (pathname === '/jelajah') {
      setActiveTab('jelajah');
    } else if (pathname === '/beranda' || pathname === '/') {
      setActiveTab('beranda');
    } else {
      setActiveTab('beranda'); // default fallback for product details, etc.
    }
  }, [pathname]);

  // Don't show bottom nav on login page
  if (pathname === '/login') return null;

  const items = [
    {
      id: 'beranda',
      name: 'Beranda',
      href: '/beranda',
      icon: Home,
    },
    ...(user && user.role === 'PETANI' ? [{
      id: 'jelajah',
      name: 'Jelajah',
      href: '/jelajah',
      icon: Compass,
    }] : []),
    ...(user && user.role === 'PETANI' ? [{
      id: 'jual',
      name: 'Jual',
      href: '/jual',
      icon: Plus,
    }] : []),
    ...(user && user.role === 'PEMBELI' ? [{
      id: 'ajukan',
      name: 'Ajukan',
      href: '/permintaan-saya',
      icon: Plus,
    }] : []),
    ...(user ? [{
      id: 'pesanan',
      name: 'Pesanan',
      href: '/pesanan',
      icon: ClipboardList,
    }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gr-paper/95 backdrop-blur-lg border-t border-gr-line md:hidden">
      <nav className="flex justify-around items-center h-16 px-4">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full font-sans text-[10px] font-bold uppercase tracking-wider transition-all duration-300 gap-1",
                isActive 
                  ? "text-gr-board" 
                  : "text-gr-ink-soft hover:text-gr-ink"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-300",
                isActive ? "bg-gr-board/5" : ""
              )}>
                <Icon size={18} />
              </div>
              <span className="text-[9px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
