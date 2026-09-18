'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Phone, Globe, Zap, Bot, PhoneIncoming, Check } from '../Icons';
import { API_BASE } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WAVEFORM_BARS = 40;

const transcript = [
  { speaker: 'USER', text: 'Hi, I need to book a service appointment for my Civic.' },
  { speaker: 'AGENT', text: "Of course. I can see your last visit was in March. What kind of service do you need?" },
  { speaker: 'USER', text: 'It is making a strange noise on the left turn.' },
  { speaker: 'AGENT', text: 'I will schedule a 30 minute diagnostic. Thursday at 10 a.m. or Friday at 2 p.m.?' },
  { speaker: 'USER', text: 'Friday works.' },
  { speaker: 'AGENT', text: 'Booked. You will receive a confirmation by SMS in a moment.' },
];

const COUNTRY_CODES = [
  { code: '+92', placeholder: '300 1234567', label: '🇵🇰 +92' },
  { code: '+1',  placeholder: '555 000 0000', label: '🇺🇸 +1' },
  { code: '+44', placeholder: '7911 123456', label: '🇬🇧 +44' },
  { code: '+971', placeholder: '50 123 4567', label: '🇦🇪 +971' },
  { code: '+966', placeholder: '50 123 4567', label: '🇸🇦 +966' },
];

export default function VoiceDemo() {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  // Call widget state
  const [countryCode, setCountryCode] = useState('+92');
  const [phone, setPhone] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'done'>('idle');
  const [countdown, setCountdown] = useState(15);
  const [error, setError] = useState('');

  // Transcript player
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= transcript.length - 1) { setPlaying(false); return 0; }
        return s + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [playing]);

  // Countdown timer
  useEffect(() => {
    if (callStatus !== 'calling') return;
    if (countdown <= 0) { setCallStatus('done'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [callStatus, countdown]);

  const handleToggle = () => {
    if (!playing) { setStep(0); setPlaying(true); }
    else setPlaying(false);
  };

    const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length < 7) { setError('Please enter a valid phone number.'); return; }
    setError('');
    setCallStatus('calling');
    setCountdown(15);
    try {
      const res = await fetch(`${API_BASE}/api/public-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: `${countryCode}${clean}`, agent_id: 'sana_bank', language: 'auto' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Call request rejected by carrier');
        setCallStatus('idle');
      }
    } catch (err) {
      console.error('Call request error:', err);
      setError('Could not reach call server. Make sure backend is running.');
      setCallStatus('idle');
    }
  };

  const currentPlaceholder = COUNTRY_CODES.find(c => c.code === countryCode)?.placeholder ?? '300 1234567';

  return (
    <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'var(--fg-3)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px',
        }}>
          LIVE DEMO
        </div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600,
          letterSpacing: '-0.03em', color: 'var(--fg-0)', marginBottom: '12px',
        }}>
          Try a real conversation.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fg-2)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Press play to hear the AI — or enter your number and receive a live call from{' '}
          <span style={{ color: 'var(--status-live)', fontFamily: 'var(--font-geist-mono)' }}>+1 (202) 919-6011</span>{' '}
          in 15 seconds.
        </p>
      </div>

      {/* ── Glass Shell ── */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid var(--border-2)',
        borderRadius: '24px',
        padding: 'clamp(18px, 4vw, 32px)',
        boxShadow: 'var(--shadow-glass)',
      }}>

        {/* Top row: player + transcript */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(18px, 3vw, 32px)',
          marginBottom: '28px',
        }} className="demo-grid">

          {/* ── Player Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            {/* Play button */}
            <button
              onClick={handleToggle}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'transform 150ms, opacity 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {playing ? <Pause size={28} strokeWidth={2} /> : <Play size={28} strokeWidth={2} />}
            </button>

            {/* Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '40px', width: '100%' }}>
              {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
                <div key={i} style={{
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
                }} />
              ))}
            </div>

            {/* Metadata pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <span className="pill"><Phone size={11} /> Inbound</span>
              <span className="pill"><Globe size={11} /> EN·UR·SD·BAL</span>
              <span className="pill"><Zap size={11} /> 312ms p50</span>
              <span className="pill"><Bot size={11} /> agent_8f3c91</span>
            </div>

            {/* Call meta */}
            <div style={{
              fontFamily: 'var(--font-geist-mono)', fontSize: '12px',
              color: 'var(--fg-3)', textAlign: 'center', lineHeight: 2,
            }}>
              <div>+1 (415) 555-0142</div>
              <div>Resolved by: Inbound triage</div>
              <div>Duration: 02:47</div>
            </div>
          </div>

          {/* ── Transcript Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              fontSize: '11px', fontFamily: 'var(--font-geist-mono)', color: 'var(--fg-3)',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px',
            }}>
              Transcript
            </div>
            {transcript.map((line, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px',
                opacity: !playing ? 0.5 : i <= step ? 1 : 0.25,
                transition: 'opacity 400ms var(--ease-smooth)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-geist-mono)', fontSize: '10px',
                  color: line.speaker === 'AGENT' ? 'var(--fg-2)' : 'var(--fg-3)',
                  flexShrink: 0, paddingTop: '2px', width: '44px',
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

        {/* ── Divider ── */}
        <div style={{
          height: '1px',
          background: 'var(--border-1)',
          margin: '0 0 28px',
        }} />

        {/* ── Live Call Row ── */}
        <div>
          {/* Row header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '18px',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="pill live" style={{ height: '24px', fontSize: '11px', flexShrink: 0 }}>
                <span className="dot" />
                CALL ME NOW
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--fg-1)',
                fontWeight: 500,
              }}>
                Live AI Voice Demo
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '12px',
              color: 'var(--fg-3)',
              background: 'rgba(0,229,160,0.06)',
              border: '1px solid rgba(0,229,160,0.2)',
              padding: '4px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <PhoneIncoming size={13} style={{ color: 'var(--status-live)' }} />
              Caller ID: <strong style={{ color: 'var(--status-live)' }}>+1 (202) 919-6011</strong>
            </div>
          </div>

          {/* IDLE — phone form */}
          {callStatus === 'idle' && (
            <form onSubmit={handleCall} className="demo-call-form" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Country select using shadcn/ui */}
              <div className="w-full sm:w-[130px] shrink-0">
                <Select value={countryCode} onValueChange={(v) => { if (v) setCountryCode(v); }}>
                  <SelectTrigger className="h-10 bg-[var(--tint-3)] border-[var(--border-2)] text-[var(--fg-0)] font-mono rounded-[10px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-2)] border-[var(--border-2)] text-[var(--fg-1)]">
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="font-mono text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone input */}
              <input
                type="tel"
                placeholder={currentPlaceholder}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{
                  flex: 1, minWidth: '160px', height: '40px', padding: '0 14px',
                  borderRadius: '10px', background: 'var(--tint-3)',
                  border: '1px solid var(--border-2)', color: 'var(--fg-0)',
                  fontSize: '14px', fontFamily: 'var(--font-geist-mono)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              {/* Submit */}
              <button type="submit" className="btn btn-primary" style={{ height: '40px', paddingInline: '20px', gap: '8px' }}>
                <PhoneIncoming size={15} />
                Get a call in 15s
              </button>

              {error && (
                <span style={{ width: '100%', fontSize: '12px', color: 'var(--status-danger)', paddingTop: '2px' }}>
                  {error}
                </span>
              )}
            </form>
          )}

          {/* CALLING — countdown */}
          {callStatus === 'calling' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Pulsing icon */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(0,229,160,0.12)',
                border: '1px solid rgba(0,229,160,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--status-live)', animation: 'pulse 1.4s ease infinite',
              }}>
                <PhoneIncoming size={18} />
              </div>

              {/* Mini waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '28px' }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} style={{
                    width: '2px', height: '10px', borderRadius: '1px',
                    background: 'var(--status-live)',
                    animationName: 'barAnimA',
                    animationDuration: '1.1s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDelay: `${(i * 1.1) / 20}s`,
                  }} />
                ))}
              </div>

              <div>
                <div style={{ fontSize: '14px', color: 'var(--fg-0)', fontWeight: 500 }}>
                  Connecting{' '}
                  <span style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--status-live)' }}>
                    {countryCode}{phone}
                  </span>
                  {'  '}
                  <span style={{ color: 'var(--fg-2)', fontWeight: 400 }}>
                    · Call arrives in <strong style={{ color: 'var(--status-live)' }}>{countdown}s</strong>
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--fg-3)', fontFamily: 'var(--font-geist-mono)', marginTop: '2px' }}>
                  Voice prompt loading from +1 (202) 919-6011 …
                </div>
              </div>
            </div>
          )}

          {/* DONE — success */}
          {callStatus === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(134,239,172,0.1)',
                border: '1px solid rgba(134,239,172,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--status-success)',
              }}>
                <Check size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--fg-0)', fontWeight: 500 }}>
                  Call dispatched!
                </div>
                <div style={{ fontSize: '12px', color: 'var(--fg-3)', marginTop: '2px' }}>
                  Your phone is ringing from{' '}
                  <span style={{ color: 'var(--status-live)', fontFamily: 'var(--font-geist-mono)' }}>
                    +1 (202) 919-6011
                  </span>. Answer to speak with the AI Agent.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setCallStatus('idle'); setPhone(''); }}
                style={{ marginLeft: 'auto' }}
              >
                Another Call
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
