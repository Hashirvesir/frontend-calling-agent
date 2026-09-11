'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Icons';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { resendVerification, verifyEmailCode } from '@/lib/api';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    if (!e) {
      router.replace('/sign-up');
      return;
    }
    setEmail(e);
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    const { ok, error } = await verifyEmailCode(email, code);
    setLoading(false);
    if (!ok) {
      toast.error(error ?? 'Invalid code.');
      return;
    }
    toast.success('Email verified! Sign in to continue.');
    router.push('/sign-in');
  }

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    const { ok, error } = await resendVerification(email);
    setResending(false);
    if (!ok) {
      toast.error(error ?? 'Could not resend code.');
      return;
    }
    toast.success('New code sent.');
    setCode('');
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
              Verify your email
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5 }}>
              We sent a 6-digit code to <span style={{ color: 'var(--fg-1)' }}>{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}
              style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying…' : 'Verify email'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--fg-3)' }}>
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--fg-1)', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            </p>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--fg-3)', marginTop: '24px' }}>
            <Link
              href="/sign-in"
              style={{ color: 'var(--fg-1)', textDecoration: 'none', fontWeight: 500, transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-0)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-1)')}
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
