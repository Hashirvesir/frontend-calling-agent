'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Icons';
import { supabase } from '@/lib/supabase';

/**
 * Success page shown after login / sign-up / OAuth callback.
 * Shows a branded welcome message with a checkmark animation,
 * then auto-redirects to /dashboard after a short delay.
 */
export default function AuthSuccessPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Grab the user's name or email to personalize the greeting
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/sign-in');
        return;
      }
      const name =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        '';
      setUserName(name);
    });

    // Auto-redirect to dashboard after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Grid background */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 80%)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          padding: '24px',
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes checkPop {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 229, 160, 0.3); }
            50% { box-shadow: 0 0 0 12px rgba(0, 229, 160, 0); }
          }
        `}</style>

        <div
          style={{
            background: 'rgba(10,10,11,0.70)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid var(--border-2)',
            borderRadius: '20px',
            padding: '48px 36px',
            boxShadow: 'var(--shadow-glass)',
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--fg-0)',
              marginBottom: '32px',
            }}
          >
            <Logo size={22} />
            <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>
              Invenco
            </span>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10px',
                color: 'var(--fg-3)',
                letterSpacing: '0.06em',
              }}
            >
              AI
            </span>
          </div>

          {/* Checkmark circle */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 160, 0.12)',
              border: '2px solid rgba(0, 229, 160, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'checkPop 0.6s ease-out 0.15s both, pulse 2s ease-in-out 0.8s infinite',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(0, 229, 160)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: 'var(--fg-0)',
              marginBottom: '8px',
            }}
          >
            {userName ? `Welcome, ${userName}!` : 'Welcome!'}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--fg-3)',
              lineHeight: 1.5,
              marginBottom: '28px',
            }}
          >
            You&apos;re all set. Redirecting to your dashboard…
          </p>

          {/* Loading dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'rgba(0, 229, 160, 0.5)',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Manual link */}
          <p style={{ fontSize: '12px', color: 'var(--fg-4)', marginTop: '24px' }}>
            Not redirecting?{' '}
            <a
              href="/dashboard"
              style={{
                color: 'var(--fg-2)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Go to dashboard →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
