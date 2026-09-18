'use client';

import TalkToSalesForm from './TalkToSalesForm';

export default function TalkToSalesSection() {
  return (
    <section
      id="talk-to-sales"
      style={{
        padding: '80px 24px',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          background: '#000000',
          padding: 'clamp(24px, 4vw, 40px)',
        }}
        className="shadow-2xl text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
          Talk to Sales
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          Tell us about your business and expected call volume.
        </p>

        <TalkToSalesForm />
      </div>
    </section>
  );
}
