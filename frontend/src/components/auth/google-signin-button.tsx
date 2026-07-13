'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Module-level singleton — survives component remounts across the entire browser session.
// initialize() is called exactly ONCE no matter how many times the button mounts/unmounts.
let gsiInitialized = false;
let pendingCallback: ((response: { credential?: string }) => void) | null = null;

// Stable top-level handler passed to initialize() — delegates to whatever the current
// pendingCallback is, so handlers can be updated on remount without re-initializing.
function handleCredentialResponse(response: { credential?: string }) {
  pendingCallback?.(response);
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  size?: 'large' | 'medium' | 'small';
  width?: number;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  theme = 'filled_black',
  shape = 'pill',
  size = 'large',
  width = 320,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  // Keep the pending callback up-to-date with current props on every render.
  pendingCallback = (response) => {
    if (response?.credential) {
      onSuccess(response.credential);
    } else {
      onError();
    }
  };

  const initAndRender = () => {
    if (!buttonRef.current || !window.google?.accounts?.id) return;

    if (!gsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
      });
      gsiInitialized = true;
    }

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme,
      shape,
      size,
      width,
    });
  };

  useEffect(() => {
    // Script may already be loaded on remounts
    if (window.google?.accounts?.id) {
      initAndRender();
    }
    // Otherwise the Script onLoad below will trigger initAndRender
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initAndRender}
      />
      <div ref={buttonRef} />
    </>
  );
}
