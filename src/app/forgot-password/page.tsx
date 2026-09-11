'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    const { ok, error } = await requestPasswordReset(trimmed);
    setLoading(false);
    if (!ok) {
      toast.error(error ?? 'Something went wrong. Try again.');
      return;
    }
    toast.success('If that email has an account, a code is on its way.');
    router.push(`/reset-password?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', margin: '0 auto', padding: '24px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-0)', marginBottom: '32px' }}>
            <Logo size={22} />
            <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>Invenco</span>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'var(--fg-3)', letterSpacing: '0.06em' }}>AI</span>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--fg-0)', marginBottom: '6px' }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send you a code to reset it.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label htmlFor="email" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ height: '40px', fontSize: '14px' }} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', height: '40px', marginTop: '4px', fontSize: '14px', borderRadius: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--fg-3)', marginTop: '24px' }}>
            Remembered it?{' '}
            <Link
              href="/sign-in"
              style={{ color: 'var(--fg-1)', textDecoration: 'none', fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-0)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-1)')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
