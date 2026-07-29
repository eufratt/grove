'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { conversationsApi } from '@/lib/api/conversations';
import { useMessages } from '@/hooks/useMessages';
import { ArrowLeft, Send, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gr-ink-soft gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-gr-board" />
        <span className="font-mono text-[10px] uppercase tracking-wider">Memuat pesan...</span>
      </div>
    );
  }

  const otherUser = conversation?.other_participant || {};
  const otherName = otherUser.full_name || otherUser.email || 'Pengguna';

  return (
    <div className="flex-grow flex flex-col h-full bg-gr-paper/10 min-h-0">
      
      {/* Header */}
      <div className="p-4 border-b border-gr-line flex items-center justify-between bg-gr-paper/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/chat')}
            className="md:hidden p-1 text-gr-ink-soft hover:text-gr-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div>
            <h4 className="font-sans text-[11px] font-bold text-gr-ink flex items-center gap-2">
              {otherName}
              {otherUser.role && (
                <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-gr-board/10 border border-gr-board/25 text-gr-board font-bold rounded-xs">
                  {otherUser.role === 'PETANI' ? 'Penjual' : 'Pembeli'}
                </span>
              )}
            </h4>
            
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-gr-up animate-pulse' :
                realtimeStatus === 'connecting' ? 'bg-[#D9A74A] animate-pulse' : 'bg-gr-down'
              }`} />
              <span className="font-mono text-[8px] text-gr-ink-soft uppercase tracking-widest">
                {realtimeStatus === 'connected' ? 'Tersambung' :
                 realtimeStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
              </span>
            </div>
          </div>
        </div>

        {/* Product context banner if any */}
        {conversation?.last_product && (
          <Link 
            href={`/produk/${conversation.last_product.id}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-gr-board/5 hover:bg-gr-board/10 border border-gr-line rounded-sm transition-all duration-150 max-w-[180px] sm:max-w-xs cursor-pointer"
          >
            <ShoppingBag size={12} className="text-gr-board" />
            <div className="min-w-0">
              <p className="font-mono text-[8px] uppercase tracking-widest text-gr-ink-soft">Membahas Produk</p>
              <p className="font-sans text-[9px] font-bold text-gr-ink truncate">{conversation.last_product.name}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser?.id;
          const isOptimistic = m.id.toString().startsWith('opt-');
          const isError = m.status === 'error';
          
          return (
            <div 
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Product link tag if attached inside message */}
              {m.products && (
                <Link
                  href={`/produk/${m.products.id}`}
                  className="mb-1 flex items-center gap-1.5 px-2 py-1 bg-gr-chalk/60 hover:bg-gr-chalk/90 border border-gr-line text-gr-ink text-[9px] rounded-sm transition-all cursor-pointer font-sans font-bold"
                >
                  <ShoppingBag size={10} />
                  <span>Konteks Produk: <strong>{m.products.name}</strong></span>
                </Link>
              )}

              {/* Message Bubble */}
              <div 
                className={`max-w-[75%] px-3.5 py-2.5 rounded-sm font-sans text-[11px] leading-relaxed relative ${
                  isMe 
                    ? 'bg-gr-board text-gr-chalk border border-gr-board/10 rounded-tr-none' 
                    : 'bg-gr-bg-elevated text-gr-ink border border-gr-line/10 rounded-tl-none'
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{m.content}</p>

                {/* Status indicator on message bubble */}
                <div className="mt-1 flex items-center justify-end gap-1 font-mono text-[8px] opacity-70">
                  <span>
                    {formatMessageTime(m.created_at)}
                  </span>
                  {isMe && (
                    <span>
                      {isOptimistic ? '• Mengirim...' : 
                       isError ? '• Gagal' : 
                       m.read_at ? '• Dibaca' : '• Terkirim'}
                    </span>
                  )}
                </div>
              </div>

              {/* Retry button for failed messages */}
              {isMe && isError && (
                <button
                  onClick={() => retryMessage(m.id)}
                  className="mt-1 flex items-center gap-1 font-mono text-[9px] text-gr-down hover:underline cursor-pointer"
                >
                  <AlertCircle size={10} />
                  <span>Gagal mengirim. Klik untuk kirim ulang</span>
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="p-3 border-t border-gr-line bg-gr-paper/60 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 px-4 py-2 bg-gr-paper border border-gr-line rounded-sm font-sans text-[11px] text-gr-ink placeholder-gr-ink-soft focus:outline-none focus:border-gr-board focus:ring-1 focus:ring-gr-board"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-gr-board text-gr-chalk hover:bg-gr-board/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center justify-center cursor-pointer transition-colors font-bold"
          >
            <Send size={14} />
          </button>
        </div>
      </form>

    </div>
  );
}
