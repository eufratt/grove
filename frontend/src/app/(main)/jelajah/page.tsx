'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function JelajahPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/harga-pasar?tab=demands');
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gr-paper">
      <Loader2 className="h-8 w-8 text-gr-board animate-spin opacity-60" />
      <span className="mt-4 font-mono text-[9px] uppercase tracking-widest text-gr-ink-soft">
        Mengalihkan ke Pusat Niaga...
      </span>
    </main>
  );
}
