import { Zap, Languages, Calendar, Bot, Shield } from '../Icons';
import React from 'react';

const features = [
  {
    icon: <Zap size={20} />,
    title: 'Sub-400ms latency',
    desc: 'Streamed TTS, interruption handling, and warm-pooled models keep the conversation feeling instant.',
    large: false,
  },
  {
    icon: <Languages size={20} />,
    title: 'Multilingual, switchable mid-call',
    desc: 'Switch languages mid-call without any interruption.',
    large: false,
  },
  {
    icon: <Calendar size={20} />,
    title: 'Calendar-aware scheduling',
    desc: 'Google, Microsoft, and Calendly out of the box. Books, reschedules, and confirms without a human.',
    large: false,
  },
  {
    icon: <Bot size={20} />,
    title: 'Build agents in plain language',
    desc: 'Describe what the agent should do. Invenco compiles it to a flow with tool calls, fallbacks, and an evaluation harness — no diagram editor required.',
    large: true,
    code: true,
  },
  {
    icon: <Shield size={20} />,
    title: 'SOC 2, HIPAA-ready',
    desc: 'Encrypted in transit and at rest. Regional data residency for EU and APAC.',
    large: false,
  },
];

function CodeSnippet() {
  return (
    <div style={{
      marginTop: '24px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid var(--border-2)',
      padding: '16px 20px',
      fontFamily: 'var(--font-geist-mono)',
      fontSize: '13px',
      lineHeight: 1.8,
    }}>
      <div style={{ color: 'var(--fg-3)' }}># agent.md</div>
      <div style={{ color: 'var(--fg-0)' }}>You answer inbound calls for Khan Auto.</div>
      <div style={{ color: 'var(--fg-0)' }}>Book service appointments using our calendar.</div>
      <div style={{ color: 'var(--fg-0)' }}>Switch languages mid-call automatically.</div>
      <div style={{ color: 'var(--fg-0)' }}>Hand off to Ahmad for engine complaints.</div>
      <div style={{ marginTop: '8px', color: 'var(--fg-3)' }}>$ invenco deploy</div>
      <div style={{ color: 'var(--status-success)' }}>✓ compiled · 4 tools · 2 fallbacks · ready</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, large, code }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  large?: boolean;
  code?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--tint-2)',
      border: '1px solid var(--border-2)',
      borderRadius: '14px',
      padding: '32px',
      gridColumn: large ? 'span 2' : undefined,
    }} className={large ? 'feature-large' : ''}>
      <div style={{ color: 'var(--fg-2)', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--fg-0)',
        letterSpacing: '-0.02em',
        marginBottom: '8px',
      }}>{title}</h3>
      <p style={{
        fontSize: '15px',
        color: 'var(--fg-2)',
        lineHeight: 1.6,
        maxWidth: large ? '520px' : undefined,
      }}>{desc}</p>
      {code && <CodeSnippet />}
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      scrollMarginTop: '80px',
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
          PLATFORM
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
          marginBottom: '12px',
        }}>
          Production-grade voice, by default.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fg-2)', maxWidth: '520px', margin: '0 auto' }}>
          Everything you need to deploy a voice agent that reliably handles real calls at scale.
        </p>
      </div>

      {/* Feature grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }} className="features-grid">
        {/* Top 3 */}
        {features.slice(0, 3).map(f => (
          <FeatureCard key={f.title} {...f} />
        ))}
        {/* Bottom row: large + 1 */}
        <FeatureCard {...features[3]} />
        <FeatureCard {...features[4]} />
      </div>
    </section>
  );
}
