'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { authApi } from '@/lib/api/auth';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

import { Navbar } from '@/components/layout/navbar';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError('Token Google tidak valid');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.loginWithGoogle(credentialResponse.credential);
      if (res.need_onboarding) {
        router.push('/lengkapi-profil');
      } else {
        router.push('/beranda');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setLoading(false);
    }
  };

  // Mock login for development bypass when Client ID is missing
  const handleMockLogin = async (role: string) => {
    setLoading(true);
    setError('');
    try {
      const mockToken = role === 'new' ? 'mock_token_new' : 'mock_token_existing';
      const res = await authApi.loginWithGoogle(mockToken);
      if (res.need_onboarding) {
        router.push('/lengkapi-profil');
      } else {
        router.push('/beranda');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mock login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gr-paper">
      <Navbar />

      <main className="flex-1 flex items-center justify-center relative py-12 px-4 sm:px-6 lg:px-8">
        <BgPattern />
        <Glow color="var(--gr-board)" position="center" className="opacity-10 pointer-events-none" />
        
        <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-gr-line bg-gr-paper/95 backdrop-blur-xl p-8 sm:p-10 shadow-xl relative">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gr-board/20 bg-gr-board/5 text-gr-board mb-6 shadow-sm">
              <Leaf size={24} />
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-gr-ink">
              Masuk ke Grove
            </h2>
            <p className="mt-3 font-sans text-sm text-gr-ink-soft max-w-xs leading-relaxed">
              Akses marketplace hasil panen transparan menggunakan akun Google Anda
            </p>
          </div>

          {error && (
            <div className="rounded bg-gr-down/10 p-4 text-xs text-gr-down border border-gr-down/20 animate-pulse">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center py-4 border-t border-gr-line gap-4">
            {loading ? (
              <div className="flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest text-gr-ink-soft py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-gr-board" />
                <span>Memproses...</span>
              </div>
            ) : (
              <>
                <div className="w-full flex justify-center [&_iframe]:!w-full">
                  <GoogleSignInButton
                    onSuccess={(credential) =>
                      handleGoogleSuccess({ credential })
                    }
                    onError={() => setError('Google Sign-In failed. Please try again.')}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    width={320}
                  />
                </div>

                {/* Dev/Demo Bypass Mode */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="w-full border-t border-gr-line pt-4 mt-2">
                    <p className="text-center font-sans text-[10px] uppercase tracking-widest text-gr-ink-soft/60 mb-2">
                      Mode Pengembang (Bypass Google Auth)
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleMockLogin('existing')}
                        className="px-3 py-1.5 rounded-full border border-gr-line hover:border-gr-board/30 bg-gr-paper hover:bg-gr-board/5 text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft hover:text-gr-board transition-all cursor-pointer"
                      >
                        Masuk Langsung (User Terdaftar)
                      </button>
                      <button
                        onClick={() => handleMockLogin('new')}
                        className="px-3 py-1.5 rounded-full border border-gr-line hover:border-gr-board/30 bg-gr-paper hover:bg-gr-board/5 text-[10px] font-bold uppercase tracking-wider text-gr-ink-soft hover:text-gr-board transition-all cursor-pointer"
                      >
                        Daftar Baru (Onboarding)
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="text-center font-sans text-[10px] uppercase tracking-widest text-gr-ink-soft/60">
            Dilindungi oleh sistem Google OAuth
          </div>
        </div>
      </main>
    </div>
  );
}
