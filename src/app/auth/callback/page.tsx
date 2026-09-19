'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Icons';
import { supabase } from '@/lib/supabase';

/**
 * Auth callback landing page.
 *
 * Supabase redirects here after the user clicks the email-confirmation link
 * (or completes an OAuth / magic-link flow). With the implicit flow the session
 * tokens arrive in the URL hash (`#access_token=...`); with PKCE they arrive as
 * `?code=...`. We process whichever is present, then forward to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);

      // 1. Surface any error Supabase passed back (expired/invalid link, etc.)
      const errDesc =
        hashParams.get('error_description') || queryParams.get('error_description');
      if (errDesc) {
        if (!cancelled) setError(errDesc.replace(/\+/g, ' '));
        return;
      }

      // 2. PKCE flow — exchange the code for a session.
      const code = queryParams.get('code');
      if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
        if (data?.session) {
          if (!cancelled) router.replace('/dashboard');
          return;
        }
      }

      // 3. Implicit flow — detectSessionInUrl parses the hash on its own, but
      //    that happens asynchronously, so poll getSession until it lands.
      for (let i = 0; i < 25 && !cancelled; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!cancelled) router.replace('/dashboard');
          return;
        }
        await new Promise(r => setTimeout(r, 120));
      }

      if (!cancelled) {
        setError('We could not sign you in. The link may have expired — please try signing in.');
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--fg-0)', marginBottom: '24px' }}>
          <Logo size={22} />
          <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>Invenco</span>
        </div>

        {error ? (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-0)', marginBottom: '8px' }}>
              Verification failed
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5, marginBottom: '20px' }}>
              {error}
            </p>
            <Link
              href="/sign-in"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', height: '40px', padding: '0 20px', fontSize: '14px', borderRadius: '10px', textDecoration: 'none' }}
            >
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-0)', marginBottom: '8px' }}>
              Confirming your account…
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Hang tight, you&apos;ll be redirected in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
