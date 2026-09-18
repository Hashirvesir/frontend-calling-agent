'use client';

import TalkToSalesForm from './TalkToSalesForm';
import { ShieldCheck, Cpu, Network } from 'lucide-react';

export default function TalkToSalesSection() {
  return (
    <section
      id="talk-to-sales"
      style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          border: '1px solid var(--border-2)',
          borderRadius: '24px',
          background: 'var(--surface-1)',
          boxShadow: 'var(--shadow-glass)',
          padding: 'clamp(32px, 5vw, 64px) clamp(20px, 4vw, 48px)',
        }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
      >
        {/* Left column: Enterprise Value Proposition */}
        <div className="lg:col-span-5 flex flex-col gap-5 text-left">
          <div className="flex items-center gap-2">
            <span className="pill" style={{ height: '22px', fontSize: '11px', gap: '6px' }}>
              <span className="dot" />
              ENTERPRISE & HIGH VOLUME
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--fg-0)',
            lineHeight: 1.15,
          }}>
            Scale your calls with bespoke Voice AI.
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'var(--fg-2)',
            lineHeight: 1.6,
          }}>
            Handling over 10,000 calls monthly? We build tailored voice pipelines with private server capacity, native Pakistani telecom integrations, and customized CRM workflows.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-chart-1/10 border border-chart-1/25 flex items-center justify-center text-chart-1 shrink-0 mt-0.5">
                <Network className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Dedicated Telnyx & SIP Capacity</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Dedicated private IP telephony trunks with zero queuing during peak sale campaigns.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-chart-4/10 border border-chart-4/25 flex items-center justify-center text-chart-4 shrink-0 mt-0.5">
                <Cpu className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Custom Model Fine-Tuning</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Tailored prompts, product catalogues, and vocabulary tuning for Roman Urdu & English.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-chart-2/10 border border-chart-2/25 flex items-center justify-center text-chart-2 shrink-0 mt-0.5">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">99.99% Uptime SLA & Dedicated Support</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Direct 24/7 Slack channel with core voice infrastructure engineers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="lg:col-span-7 bg-[var(--canvas)] border border-[var(--border-2)] rounded-2xl p-5 sm:p-7 shadow-lg">
          <div className="mb-4 text-left">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              Request Enterprise Consultation
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill out this qualification form and our lead engineer will respond within 2 hours.
            </p>
          </div>

          <TalkToSalesForm />
        </div>
      </div>
    </section>
  );
}
