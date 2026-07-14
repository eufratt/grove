'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { authApi } from '@/lib/api/auth';
import { BgPattern } from '@/components/effects/bg-pattern';
import { Glow } from '@/components/effects/glow';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gr-green/20 bg-gr-green/5 text-gr-green transition-all duration-300 group-hover:border-gr-green/50 group-hover:bg-gr-green/10">
            <Leaf size={18} className="transition-transform group-hover:rotate-12" />
          </div>
          <span className="font-display text-2xl font-medium tracking-tight text-gr-text-primary">
            Grove
          </span>
        </Link>
      </header>

      <BgPattern />
      <Glow color="var(--gr-green)" position="center" className="opacity-15" />
      
      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-gr-bg-elevated p-10 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gr-green/20 bg-gr-green/5 text-gr-green mb-6 shadow-[0_0_15px_rgba(92,255,158,0.1)]">
            <Leaf size={24} />
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-gr-text-primary">
            Masuk ke Grove
          </h2>
          <p className="mt-3 font-sans text-sm text-gr-text-primary/60 max-w-xs leading-relaxed">
            Akses marketplace hasil panen transparan menggunakan akun Google Anda
          </p>
        </div>

        {error && (
          <div className="rounded bg-gr-price-unfair/10 p-4 text-xs text-gr-price-unfair border border-gr-price-unfair/20 animate-pulse">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center py-4 border-t border-white/5 gap-4">
          {loading ? (
            <div className="flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest text-gr-text-primary/40 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-gr-green" />
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
                <div className="w-full border-t border-white/5 pt-4 mt-2">
                  <p className="text-center font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30 mb-2">
                    Mode Pengembang (Bypass Google Auth)
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleMockLogin('existing')}
                      className="px-3 py-1.5 rounded-full border border-white/10 hover:border-gr-green/30 bg-white/5 hover:bg-gr-green/5 text-[10px] font-bold uppercase tracking-wider text-gr-text-primary/70 hover:text-gr-green transition-all cursor-pointer"
                    >
                      Masuk Langsung (User Terdaftar)
                    </button>
                    <button
                      onClick={() => handleMockLogin('new')}
                      className="px-3 py-1.5 rounded-full border border-white/10 hover:border-gr-orange/30 bg-white/5 hover:bg-gr-orange/5 text-[10px] font-bold uppercase tracking-wider text-gr-text-primary/70 hover:text-gr-orange transition-all cursor-pointer"
                    >
                      Daftar Baru (Onboarding)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="text-center font-sans text-[10px] uppercase tracking-widest text-gr-text-primary/30">
          Dilindungi oleh sistem Google OAuth
        </div>
      </div>
    </main>
  );
}
