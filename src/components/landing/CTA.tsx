import Link from 'next/link';
import { ArrowRight } from '../Icons';

export default function CTA() {
  return (
    <section style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{
        border: '1px solid var(--border-2)',
        borderRadius: '20px',
        background: 'var(--tint-1)',
        padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 40px)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '11px',
          color: 'var(--fg-3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          GET STARTED
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
          marginBottom: '16px',
        }}>
          Pick up the phone, faster.
        </h2>
        <p style={{
          fontSize: '17px',
          color: 'var(--fg-2)',
          maxWidth: '440px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Deploy a voice agent in under five minutes. No credit card to start.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start free trial <ArrowRight size={16} />
          </Link>
          <button className="btn btn-secondary btn-lg">
            Book a demo
          </button>
        </div>
      </div>
    </section>
  );
}
