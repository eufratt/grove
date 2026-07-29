'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { MessageCircle, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { conversations, loading, error, refetch } = useConversations();

  // Extract active conversation ID from path
  const pathParts = pathname.split('/');
  const activeId = pathParts.length > 2 ? pathParts[2] : null;
  const isChatRoomPage = !!activeId;

  // Poll or refresh list on navigation changes
  useEffect(() => {
    refetch();
  }, [pathname, refetch]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="w-full flex bg-gr-paper border border-gr-line h-[calc(100vh-160px)] min-h-[450px] max-h-[700px] rounded-sm overflow-hidden shadow-sm">
        
        {/* Left Pane: Inbox / Conversation List */}
        <div 
          className={cn(
            "w-full md:w-80 border-r border-gr-line flex flex-col h-full bg-gr-paper/30",
            isChatRoomPage && "hidden md:flex"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-gr-line flex items-center gap-2 bg-gr-board text-gr-chalk">
            <MessageCircle size={16} />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Kotak Masuk</span>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gr-line/30">
            {loading && conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gr-ink-soft gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Memuat obrolan...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-gr-down font-mono">
                {error}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gr-ink-soft gap-2 h-48">
                <MessageCircle size={24} className="opacity-30" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Belum ada percakapan</span>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeId === c.id;
                const otherUser = c.other_participant || {};
                const lastMsg = c.last_message;
                const name = otherUser.full_name || otherUser.email || 'Pengguna';
                
                return (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    className={cn(
                      "block p-4 transition-all duration-150 relative hover:bg-gr-chalk/40 cursor-pointer",
                      isActive && "bg-gr-chalk/60 font-medium"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar placeholder */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gr-board/10 flex items-center justify-center border border-gr-board/20 text-gr-board">
                        <User size={14} />
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-sans text-[11px] font-bold text-gr-ink truncate">
                            {name}
                          </span>
                          <span className="font-mono text-[9px] text-gr-ink-soft whitespace-nowrap">
                            {c.last_message_at ? formatTime(c.last_message_at) : ''}
                          </span>
                        </div>

                        {/* Last message snippet */}
                        <p className="font-sans text-[10px] text-gr-ink-soft truncate pr-4">
                          {lastMsg ? lastMsg.content : 'Belum ada pesan'}
                        </p>

                        {/* Badge role */}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-gr-board/10 border border-gr-board/25 text-gr-board font-bold">
                            {otherUser.role === 'PETANI' ? 'Penjual' : 'Pembeli'}
                          </span>
                          
                          {/* Unread badge */}
                          {c.unread_count > 0 && (
                            <span className="bg-gr-down text-gr-chalk text-[8px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-gr-paper">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window / Content */}
        <div 
          className={cn(
            "flex-1 flex flex-col h-full bg-gr-paper/10",
            !isChatRoomPage && "hidden md:flex"
          )}
        >
          {children}
        </div>

      </div>
    </div>
  );
}
