import Link from 'next/link';
import { Check, ArrowRight } from '../Icons';

const plans = [
  {
    name: 'Starter',
    price: '$120',
    period: '/mo',
    desc: 'Includes 300 minutes. Extra minutes billed at $0.14/min.',
    cta: 'Get started',
    ctaClass: 'btn btn-ghost btn-lg',
    href: '/sign-up',
    featured: false,
    features: [
      '300 included minutes / month',
      '$0.14/min extra minute rate',
      'Urdu, English & regional languages',
      'Live call metrics & transcripts',
      'Community & email support',
    ],
  },
  {
    name: 'Business',
    price: '$399',
    period: '/mo',
    desc: 'Includes 3,000 minutes. Extra minutes billed at $0.12/min.',
    cta: 'Start free trial',
    ctaClass: 'btn btn-primary btn-lg',
    href: '/sign-up',
    featured: true,
    badge: 'Most popular',
    features: [
      '3,000 included minutes / month',
      '$0.12/min extra minute rate',
      'Speech-to-speech (STS) models',
      'Mid-call multilingual switching',
      'Calendar · CRM · Webhook tools',
      'Priority email & Slack support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'High-volume 10,000+ minutes package with custom integrations.',
    cta: 'Talk to sales',
    ctaClass: 'btn btn-secondary btn-lg',
    href: '#',
    featured: false,
    features: [
      '10,000+ included minutes',
      '$0.10/min extra minute rate',
      'Dedicated private server capacity',
      'SOC 2 · HIPAA · Custom SLA',
      'Dedicated account manager & 24/7 support',
    ],
  },
];

export default function Pricing() {
  return (
    <section style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '11px',
          color: 'var(--fg-3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          PRICING
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
          marginBottom: '12px',
        }}>
          Pay for what your agents say.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fg-2)', maxWidth: '480px', margin: '0 auto' }}>
          Simple usage-based pricing. Start free, scale to enterprise.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        alignItems: 'start',
      }} className="pricing-grid">
        {plans.map(plan => (
          <div
            key={plan.name}
            style={{
              borderRadius: '16px',
              padding: '32px',
              border: plan.featured ? '1px solid var(--border-4)' : '1px solid var(--border-2)',
              background: plan.featured ? 'var(--tint-3)' : 'var(--tint-2)',
              position: 'relative',
            }}
          >
            {plan.badge && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '999px',
                padding: '3px 12px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}>
                {plan.badge}
              </div>
            )}

            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--fg-2)' }}>
              {plan.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '40px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: 'var(--fg-0)',
              }}>
                {plan.price}
              </span>
              {plan.period && (
                <span style={{ fontSize: '14px', color: 'var(--fg-3)', fontFamily: 'var(--font-geist-mono)' }}>
                  {plan.period}
                </span>
              )}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: '24px' }}>
              {plan.desc}
            </p>

            <Link href={plan.href} className={plan.ctaClass} style={{ width: '100%' }}>
              {plan.cta} {plan.featured && <ArrowRight size={16} />}
            </Link>

            <div style={{
              height: '1px',
              background: 'var(--border-2)',
              margin: '24px 0',
            }} />

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '1px' }}>
                    <Check size={14} strokeWidth={2} />
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--fg-2)', lineHeight: 1.4 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
