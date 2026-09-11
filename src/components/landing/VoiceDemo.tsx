'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Phone, Globe, Zap, Bot } from '../Icons';

const WAVEFORM_BARS = 40;

const transcript = [
  { speaker: 'USER', text: 'Hi, I need to book a service appointment for my Civic.' },
  { speaker: 'AGENT', text: "Of course. I can see your last visit was in March. What kind of service do you need?" },
  { speaker: 'USER', text: 'It is making a strange noise on the left turn.' },
  { speaker: 'AGENT', text: 'I will schedule a 30 minute diagnostic. Thursday at 10 a.m. or Friday at 2 p.m.?' },
  { speaker: 'USER', text: 'Friday works.' },
  { speaker: 'AGENT', text: 'Booked. You will receive a confirmation by SMS in a moment.' },
];

export default function VoiceDemo() {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= transcript.length - 1) {
          setPlaying(false);
          return 0;
        }
        return s + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [playing]);

  const handleToggle = () => {
    if (!playing) {
      setStep(0);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

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
          LIVE DEMO
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--fg-0)',
          marginBottom: '12px',
        }}>
          Try a real conversation.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fg-2)', maxWidth: '500px', margin: '0 auto' }}>
          Press play to hear a live call recording — real-time AI handling a service booking request.
        </p>
      </div>

      {/* Glass Shell */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid var(--border-2)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-glass)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
      }} className="demo-grid">
        {/* Player Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          {/* Play/Pause Button */}
          <button
            onClick={handleToggle}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 150ms, opacity 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {playing ? <Pause size={28} strokeWidth={2} /> : <Play size={28} strokeWidth={2} />}
          </button>

          {/* Waveform */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            height: '40px',
            width: '100%',
          }}>
            {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: playing ? undefined : '4px',
                  minHeight: playing ? '6px' : undefined,
                  maxHeight: playing ? '36px' : undefined,
                  borderRadius: '1px',
                  background: playing ? 'var(--fg-2)' : 'var(--fg-4)',
                  animationName: playing ? 'barAnim' : 'none',
                  animationDuration: '1.4s',
                  animationTimingFunction: 'var(--ease-smooth)',
                  animationIterationCount: 'infinite',
                  animationDelay: playing ? `${(i * 1.4) / WAVEFORM_BARS}s` : '0s',
                  transition: 'background 300ms',
                }}
              />
            ))}
          </div>

          {/* Metadata Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <span className="pill"><Phone size={11} /> Inbound</span>
            <span className="pill"><Globe size={11} /> EN·UR·SD·BAL</span>
            <span className="pill"><Zap size={11} /> 312ms p50</span>
            <span className="pill"><Bot size={11} /> agent_8f3c91</span>
          </div>

          {/* Call Metadata */}
          <div style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '12px',
            color: 'var(--fg-3)',
            textAlign: 'center',
            lineHeight: 2,
          }}>
            <div>+1 (415) 555-0142</div>
            <div>Resolved by: Inbound triage</div>
            <div>Duration: 02:47</div>
          </div>
        </div>

        {/* Transcript Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-geist-mono)',
            color: 'var(--fg-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Transcript
          </div>
          {transcript.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '10px',
                opacity: !playing ? 0.5 : i <= step ? 1 : 0.25,
                transition: 'opacity 400ms var(--ease-smooth)',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10px',
                color: line.speaker === 'AGENT' ? 'var(--fg-2)' : 'var(--fg-3)',
                flexShrink: 0,
                paddingTop: '2px',
                width: '44px',
              }}>
                {line.speaker}
              </span>
              <span style={{
                fontSize: '14px',
                color: line.speaker === 'AGENT' ? 'var(--fg-1)' : 'var(--fg-2)',
                lineHeight: 1.5,
              }}>
                &ldquo;{line.text}&rdquo;
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
