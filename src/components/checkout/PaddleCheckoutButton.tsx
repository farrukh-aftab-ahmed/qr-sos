'use client';

import React, { useEffect, useState } from 'react';

// Extend window interface to define Paddle types
declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string }) => void;
      Environment: {
        set: (env: 'sandbox' | 'production') => void;
      };
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email: string };
          customData?: Record<string, any>;
          settings?: {
            displayMode?: 'overlay' | 'inline';
            theme?: 'light' | 'dark';
            locale?: string;
          };
        }) => void;
      };
      initialized?: boolean;
    };
  }
}

interface PaddleCheckoutButtonProps {
  priceId?: string;
  userId: string;
  userEmail: string;
  className?: string;
  children?: React.ReactNode;
}

export function PaddleCheckoutButton({
  priceId,
  userId,
  userEmail,
  className = '',
  children,
}: PaddleCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. If Paddle is already loaded globally, skip creating script tag
    if (window.Paddle) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if the script is already added in the page to prevent duplicate script tags
    const existingScript = document.querySelector('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]');
    if (existingScript) {
      const handleLoad = () => setIsScriptLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    // 2. Append Paddle v2 CDN Script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('[Paddle Client] Failed to load Paddle v2 SDK from CDN.');
      setError('Failed to load payment processor');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !window.Paddle) return;

    // 3. Initialize Paddle V2 once globally
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    if (!token) {
      console.error('[Paddle Client] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured.');
      setError('Payment config error');
      return;
    }

    if (!window.Paddle.initialized) {
      try {
        if (environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        }
        window.Paddle.Initialize({
          token: token,
        });
        window.Paddle.initialized = true;
        console.log(`[Paddle Client] Paddle ${environment} initialized successfully.`);
      } catch (err) {
        console.error('[Paddle Client] Error initializing Paddle:', err);
        setError('Failed to initialize billing');
      }
    }
  }, [isScriptLoaded]);

  const handleCheckout = () => {
    if (error) {
      alert(`Billing Error: ${error}`);
      return;
    }

    if (!window.Paddle || !window.Paddle.initialized) {
      alert('The payment system is loading, please try again in a moment.');
      return;
    }

    // Use price ID from prop, or fallback to environment variable
    const targetPriceId = priceId || process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

    if (!targetPriceId) {
      console.error('[Paddle Client] Paddle Price ID is missing.');
      alert('Pricing configuration is missing. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: targetPriceId,
            quantity: 1,
          },
        ],
        customer: {
          email: userEmail,
        },
        customData: {
          userId: userId,
        },
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
        },
      });
    } catch (err) {
      console.error('[Paddle Client] Checkout failed to open:', err);
      alert('Failed to launch the checkout overlay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sleek default class with rich gradients and micro-animations
  const defaultClass =
    'relative px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-[#FF2D55] to-[#FF6B35] hover:from-[#e02447] hover:to-[#e65a25] transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={handleCheckout}
      disabled={!isScriptLoaded || loading || !!error}
      className={className || defaultClass}
    >
      {children || (loading ? 'Launching Checkout...' : 'Pay to Generate QR Code')}
    </button>
  );
}
