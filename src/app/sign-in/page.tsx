'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      toast.error(decodeURIComponent(err));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleGoogleSignIn() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initiate Google sign in');
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
          background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 65%)',
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
        }}
      >
        <div
          style={{
            background: 'rgba(10,10,11,0.70)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid var(--border-2)',
            borderRadius: '20px',
            padding: '40px 36px',
            boxShadow: 'var(--shadow-glass)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-0)', marginBottom: '32px' }}>
            <Logo size={22} />
            <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>Invenco</span>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'var(--fg-3)', letterSpacing: '0.06em' }}>AI</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--fg-0)', marginBottom: '6px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Sign in to your Invenco account
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--tint-2)',
              border: '1px solid var(--border-3)',
              color: 'var(--fg-1)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms, border-color 150ms',
              marginBottom: '20px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--tint-4)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--tint-2)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-3)';
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
            <span style={{ fontSize: '12px', color: 'var(--fg-4)', fontFamily: 'var(--font-geist-mono)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label htmlFor="email" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ height: '40px', fontSize: '14px' }} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label htmlFor="password" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>Password</Label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '12px', color: 'var(--fg-3)', textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-1)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-3)')}
                >
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ height: '40px', fontSize: '14px' }} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', height: '40px', marginTop: '4px', fontSize: '14px', borderRadius: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--fg-3)', marginTop: '24px' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              style={{ color: 'var(--fg-1)', textDecoration: 'none', fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-0)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-1)')}
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Legal */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--fg-4)', marginTop: '20px', lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <Link href="#" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="#" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
