'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gr-paper/5">
      <div className="w-16 h-16 rounded-full bg-gr-board/5 border border-gr-board/10 flex items-center justify-center text-gr-board/60 mb-4 animate-pulse">
        <MessageCircle size={28} />
      </div>
      <h3 className="font-mono text-[11px] uppercase tracking-widest font-bold text-gr-ink mb-1">
        Mulai Obrolan
      </h3>
      <p className="font-sans text-[10px] text-gr-ink-soft max-w-[260px]">
        Pilih salah satu percakapan di sebelah kiri untuk mulai berkirim pesan dengan pembeli atau penjual.
      </p>
    </div>
  );
}
