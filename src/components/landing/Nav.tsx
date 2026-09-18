'use client';

import Link from 'next/link';
import { Logo, ArrowRight } from '../Icons';

export default function Nav() {
  return (
    <header className="landing-header" style={{
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '1200px',
      zIndex: 50,
    }}>
      <nav className="landing-nav" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '52px',
        background: 'rgba(10,10,11,0.55)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--border-2)',
        borderRadius: '14px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-0)', flexShrink: 0 }}>
          <Logo size={20} />
          <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>Invenco</span>
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'var(--fg-3)', letterSpacing: '0.06em' }}>AI</span>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="nav-links">
          {['Platform', 'Features', 'Pricing', 'Customers', 'Docs'].map(link => (
            <a
              key={link}
              href="#"
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                color: 'var(--fg-2)',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-0)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-2)')}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/sign-up" className="btn btn-primary btn-sm">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
