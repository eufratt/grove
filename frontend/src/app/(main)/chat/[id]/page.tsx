'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { conversationsApi } from '@/lib/api/conversations';
import { useMessages } from '@/hooks/useMessages';
import { ArrowLeft, Send, AlertCircle, ShoppingBag, Loader2, Check, CheckCheck, Sparkles, Scale } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const formatMessageTime = (dateStr: string) => {
  if (!dateStr) return '';
  let safeStr = dateStr;
  if (!safeStr.endsWith('Z') && !safeStr.includes('+') && !safeStr.match(/-\d{2}:\d{2}$/)) {
    safeStr = safeStr + 'Z';
  }
  try {
    return new Date(safeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '';
  }
};

export default function ChatRoomPage({ params }: { params: React.Usable<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const conversationId = resolvedParams.id;
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState('');

  const {
    messages,
    loading,
    error,
    realtimeStatus,
    sendMessage,
    retryMessage,
    markAsRead,
  } = useMessages(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user and conversation details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, list] = await Promise.all([
          authApi.getMe(),
          conversationsApi.getConversations(),
        ]);
        setCurrentUser(u);
        const found = list.find((c: any) => c.id === conversationId);
        setConversation(found || null);
      } catch (err) {
        console.error('Failed to load chat details:', err);
      }
    };
    fetchData();
  }, [conversationId]);

  // Mark messages as read on mount and when messages change
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const text = inputMessage;
    setInputMessage('');

    try {
      // Send message. If conversation has product context, associate it
      await sendMessage(text, conversation?.last_product_id);
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const otherUser = conversation?.other_participant || {};
  const otherName = otherUser.full_name || otherUser.email || 'Pengguna';

  // Ticket calculations for product context
  const product = conversation?.last_product;
  const price = product?.price_per_kg;
  const refPrice = product?.reference_price_per_kg;
  let deltaText = '';
  let isUnderPrice = false;
  if (price && refPrice) {
    const delta = ((refPrice - price) / refPrice) * 100;
    if (delta > 0) {
      deltaText = `Hemat ${delta.toFixed(0)}% dibanding PIHPS`;
      isUnderPrice = true;
    } else if (delta < 0) {
      deltaText = `Harga Premium (+${Math.abs(delta).toFixed(0)}%)`;
    } else {
      deltaText = `Sesuai Pasar PIHPS`;
    }
  }

  const handleIcebreakerClick = (text: string) => {
    setInputMessage(text);
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex-grow flex flex-col h-full bg-white/10 dark:bg-black/5 animate-pulse min-h-0">
        {/* Header Skeleton */}
        <div className="p-4 border-b border-gr-line/50 flex items-center justify-between bg-white/40 dark:bg-black/25">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-gr-ink/10 rounded-sm md:hidden" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 bg-gr-ink/15 rounded-md" />
              <div className="h-2 w-16 bg-gr-ink/10 rounded-sm" />
            </div>
          </div>
          <div className="h-8 w-24 bg-gr-ink/10 rounded-lg" />
        </div>
        {/* Messages Skeleton */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          <div className="flex justify-start">
            <div className="h-9 w-[45%] bg-gr-ink/10 rounded-2xl rounded-tl-xs" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-[55%] bg-gr-ink/15 rounded-2xl rounded-tr-xs" />
          </div>
          <div className="flex justify-start">
            <div className="h-7 w-[30%] bg-gr-ink/10 rounded-2xl rounded-tl-xs" />
          </div>
          <div className="flex justify-end">
            <div className="h-9 w-[40%] bg-gr-ink/15 rounded-2xl rounded-tr-xs" />
          </div>
          <div className="flex justify-center my-4">
            <div className="h-6 w-[200px] bg-gr-ink/10 rounded-full" />
          </div>
          <div className="flex justify-start">
            <div className="h-10 w-[50%] bg-gr-ink/10 rounded-2xl rounded-tl-xs" />
          </div>
        </div>
        {/* Input Skeleton */}
        <div className="p-4 border-t border-gr-line/50 bg-white/40 dark:bg-black/25 flex gap-2">
          <div className="flex-grow h-10 bg-gr-ink/10 rounded-full" />
          <div className="h-10 w-10 bg-gr-ink/15 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col h-full bg-white/10 dark:bg-black/5 min-h-0 relative">
      
      {/* Header */}
      <div className="py-2 px-3 md:py-2 md:px-4 border-b border-gr-line flex items-center justify-between bg-white/80 dark:bg-[#1E1812]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/chat')}
            className="md:hidden p-2 -ml-1 text-gr-ink-soft hover:text-gr-ink hover:bg-gr-line/30 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div>
            <h4 className="font-sans text-[12px] font-bold text-gr-ink flex items-center gap-2">
              {otherName}
              {otherUser.role && (
                <span className={cn(
                  "font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 font-bold rounded-md border",
                  otherUser.role === 'PETANI' 
                    ? "bg-gr-board/10 text-gr-board border-gr-board/20" 
                    : "bg-gr-down/10 text-gr-down border-gr-down/20"
                )}>
                  {otherUser.role === 'PETANI' ? 'Penjual' : 'Pembeli'}
                </span>
              )}
            </h4>
            
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                {realtimeStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gr-up opacity-75"></span>
                )}
                <span className={cn(
                  "relative inline-flex rounded-full h-1.5 w-1.5",
                  realtimeStatus === 'connected' ? 'bg-gr-up' :
                  realtimeStatus === 'connecting' ? 'bg-[#D9A74A]' : 'bg-gr-down'
                )} />
              </span>
              <span className="font-mono text-[8px] text-gr-ink-soft uppercase tracking-wider">
                {realtimeStatus === 'connected' ? 'Aktif' :
                 realtimeStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
              </span>
            </div>
          </div>
        </div>

        {/* Removed product context banner from header as requested */}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar bg-white/20 dark:bg-black/5">
        
        {/* Permanent Product Context Card directly in the chat feed */}
        {product && (
          <div className="w-full flex flex-col items-center my-2 shrink-0">
            <div className="w-full flex items-center gap-2 mb-3">
              <div className="flex-grow h-[1px] bg-gr-line/45" />
              <span className="font-mono text-[8px] uppercase tracking-widest text-gr-ink-soft bg-[#FAF9F5] dark:bg-black/20 px-2 py-0.5 rounded-md border border-gr-line/45 select-none">
                Komoditas yang Dibahas
              </span>
              <div className="flex-grow h-[1px] bg-gr-line/45" />
            </div>
            
            <Link
              href={`/produk/${product.id}`}
              className="flex items-center gap-3.5 p-3.5 bg-[#EDE6D1]/80 dark:bg-white/5 border border-dashed border-gr-board/35 rounded-xl max-w-sm w-full text-left transition-all hover:bg-[#EDE6D1] shadow-3xs group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.02] bg-radial from-gr-board" />
              <div className="p-2.5 rounded-xl bg-gr-board/10 text-gr-board flex-shrink-0">
                <ShoppingBag size={16} className="group-hover:-rotate-12 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[7px] uppercase tracking-widest text-gr-ink-soft block mb-0.5">KOMODITAS</span>
                <h6 className="font-sans text-[12px] font-bold text-gr-ink truncate leading-tight group-hover:text-gr-board transition-colors">
                  {product.name}
                </h6>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-mono text-xs font-bold text-gr-ink">
                    Rp {product.price_per_kg?.toLocaleString('id-ID') || 0}
                    <span className="font-sans font-medium text-[9px] text-gr-ink-soft ml-0.5">/kg</span>
                  </span>
                  {deltaText && (
                    <span className={cn(
                      "font-sans text-[8px] px-1.5 py-0.5 rounded-md font-semibold border shrink-0",
                      isUnderPrice 
                        ? "bg-gr-up/10 text-gr-up border-gr-up/20" 
                        : "bg-gr-price-warn/10 text-[#B8860B] border-[#B8860B]/20"
                    )}>
                      {deltaText}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Empty state: Chat baru dimulai */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4 max-w-sm mx-auto h-full gap-5">
            {!product && (
              <div className="w-12 h-12 rounded-full bg-gr-board/5 flex items-center justify-center border border-gr-line/40 text-gr-board/40">
                <Sparkles size={20} />
              </div>
            )}

            <div className="space-y-1">
              <h5 className="font-sans text-[12px] font-bold text-gr-ink">Mulai Obrolan Baru</h5>
              <p className="font-sans text-[11px] text-gr-ink-soft leading-relaxed">
                Tanyakan ketersediaan produk, waktu panen terbaru, atau diskusikan pengiriman komoditas dengan {otherUser.role === 'PETANI' ? 'Penjual' : 'Pembeli'}.
              </p>
            </div>

            {/* Icebreakers suggestions */}
            {product && (
              <div className="w-full space-y-2">
                <span className="font-mono text-[8px] uppercase tracking-wider text-gr-ink-soft block">Saran Pesan Pembuka:</span>
                <div className="flex flex-col gap-1.5 w-full">
                  {(currentUser?.role === 'PETANI' 
                    ? [
                        `Halo, selamat datang! Ada yang bisa saya bantu terkait produk ${product.name}?`,
                        `Halo, stok untuk ${product.name} ready ${product.quantity_kg || 0} kg. Silakan dipesan.`
                      ]
                    : [
                        `Halo, apakah komoditas ${product.name} masih tersedia stoknya?`,
                        `Halo, jika beli grosir untuk ${product.name}, apakah bisa dinegosiasikan harganya?`,
                        `Apakah bisa kirim hari ini untuk produk ${product.name}?`
                      ]
                  ).map((ib, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleIcebreakerClick(ib)}
                      className="text-left px-3 py-2 bg-white/80 dark:bg-white/5 border border-gr-line/60 hover:bg-gr-board/5 hover:border-gr-board/40 rounded-xl text-[10px] text-gr-ink font-sans transition-all leading-normal cursor-pointer hover:-translate-y-px"
                    >
                      {ib}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.sender_id === currentUser?.id;
          const isOptimistic = m.id.toString().startsWith('opt-');
          const isError = m.status === 'error';
          
          return (
            <div 
              key={m.id}
              className="w-full flex flex-col"
            >
              {/* Product link tag shared in chat stream - Redesigned as a System Notice Divider */}
              {m.products && (
                <div className="w-full flex flex-col items-center my-4">
                  <div className="w-full flex items-center gap-2 mb-2">
                    <div className="flex-grow h-[1px] bg-gr-line/45" />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-gr-ink-soft bg-white/80 dark:bg-black/20 px-2 py-0.5 rounded-md border border-gr-line/45 select-none">
                      Konteks Komoditas
                    </span>
                    <div className="flex-grow h-[1px] bg-gr-line/45" />
                  </div>
                  
                  <Link
                    href={`/produk/${m.products.id}`}
                    className="flex items-center gap-3 p-3 bg-[#EDE6D1]/90 dark:bg-white/5 border border-dashed border-gr-board/40 rounded-xl max-w-xs w-full text-left transition-all hover:bg-[#EDE6D1] shadow-2xs group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-[0.02] bg-radial from-gr-board" />
                    <div className="p-2 rounded-lg bg-gr-board/10 text-gr-board flex-shrink-0">
                      <ShoppingBag size={14} className="group-hover:-rotate-12 transition-transform" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h6 className="font-sans text-[11px] font-bold text-gr-ink truncate group-hover:text-gr-board transition-colors">
                        {m.products.name}
                      </h6>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-[9px] text-gr-board font-bold">Bahas Transaksi</span>
                        <span className="w-1 h-1 rounded-full bg-gr-up animate-pulse" />
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Message Bubble wrapper */}
              <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end ml-auto" : "items-start mr-auto")}>
                <div 
                  className={cn(
                    "px-4 py-3 rounded-2xl font-sans text-[12px] leading-relaxed shadow-3xs transition-all relative border",
                    isMe 
                      ? "bg-gr-board text-gr-chalk border-gr-board/30 rounded-tr-[4px]" 
                      : "bg-white dark:bg-[#1E1812] text-gr-ink border-gr-line/50 rounded-tl-[4px]"
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{m.content}</p>

                  {/* Status indicator inside message bubble */}
                  <div className={cn(
                    "mt-1 flex items-center justify-end gap-1 font-mono text-[8px] select-none",
                    isMe ? "text-gr-chalk-soft/80" : "text-gr-ink-soft/75"
                  )}>
                    <span>
                      {formatMessageTime(m.created_at)}
                    </span>
                    {isMe && (
                      <span className="ml-0.5">
                        {isOptimistic ? (
                          <Loader2 size={8} className="animate-spin text-gr-chalk-soft" />
                        ) : isError ? (
                          <AlertCircle size={8} className="text-gr-down" />
                        ) : m.read_at ? (
                          <CheckCheck size={10} className="text-gr-up" />
                        ) : (
                          <Check size={10} className="text-gr-chalk-soft/80" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Retry button for failed messages */}
                {isMe && isError && (
                  <button
                    onClick={() => retryMessage(m.id)}
                    className="mt-1 flex items-center gap-1 font-mono text-[9px] text-gr-down hover:underline cursor-pointer bg-gr-down/5 px-2 py-0.5 rounded-md border border-gr-down/10 transition-colors"
                  >
                    <AlertCircle size={10} />
                    <span>Gagal mengirim. Klik untuk kirim ulang</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form 
        onSubmit={handleSend} 
        className="p-3 md:p-4 border-t border-gr-line bg-white/80 dark:bg-[#1E1812]/80 backdrop-blur-md z-10 sticky bottom-0"
      >
        <div className="flex gap-2 items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tulis pesan ke mitra tani..."
            className="flex-grow px-5 py-2.5 bg-gr-paper/30 border border-gr-line rounded-full font-sans text-[12px] text-gr-ink placeholder-gr-ink-soft focus:outline-none focus:border-gr-board focus:ring-2 focus:ring-gr-board/20 transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2.5 bg-gr-board text-gr-chalk hover:bg-gr-board/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </form>

    </div>
  );
}
