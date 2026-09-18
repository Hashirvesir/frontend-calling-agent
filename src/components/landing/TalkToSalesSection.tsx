'use client';

import TalkToSalesForm from './TalkToSalesForm';

export default function TalkToSalesSection() {
  return (
    <section
      id="talk-to-sales"
      style={{
        padding: '80px 24px',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: 'rgba(10,10,11,0.70)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid var(--border-2)',
          borderRadius: '20px',
          padding: 'clamp(28px, 5vw, 40px) clamp(20px, 4vw, 36px)',
          boxShadow: 'var(--shadow-glass)',
        }}
      >
        <TalkToSalesForm showLogo={true} />
      </div>
    </section>
  );
}
