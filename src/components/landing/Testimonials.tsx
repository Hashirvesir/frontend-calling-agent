const testimonials = [
  {
    quote: 'We replaced an overnight call center with three Invenco agents. Resolution rates went up and our after-hours bill went down 78%.',
    name: 'Sara Aslam',
    role: 'VP Operations',
    company: 'Khan Auto Group',
    initials: 'SA',
  },
  {
    quote: 'Mid-call language switching changed everything. Our callers switch languages mid-call — Invenco handles every transition without missing a beat.',
    name: 'Bilal Rehman',
    role: 'Head of CX',
    company: 'Daraz',
    initials: 'BR',
  },
  {
    quote: 'Our customers finally get support in their own language. Invenco handles multilingual calls without any custom work on our side.',
    name: 'Zara Khan',
    role: 'Founder',
    company: 'HamSafar Logistics',
    initials: 'ZK',
  },
];

export default function Testimonials() {
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
          CUSTOMERS
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
        }}>
          Teams shipping real voice.
        </h2>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }} className="testimonials-grid">
        {testimonials.map(t => (
          <div
            key={t.name}
            style={{
              background: 'var(--tint-2)',
              border: '1px solid var(--border-2)',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            {/* Quote mark */}
            <div style={{
              fontSize: '48px',
              lineHeight: 1,
              color: 'var(--fg-4)',
              fontFamily: 'Georgia, serif',
              marginBottom: '16px',
              userSelect: 'none',
            }}>
              &ldquo;
            </div>

            <p style={{
              fontSize: '15px',
              color: 'var(--fg-1)',
              lineHeight: 1.65,
              marginBottom: '24px',
            }}>
              {t.quote}
            </p>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--tint-4)',
                border: '1px solid var(--border-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--fg-1)',
                flexShrink: 0,
              }}>
                {t.initials}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-0)' }}>{t.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--fg-3)' }}>{t.role}, {t.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
