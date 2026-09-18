'use client';

import { useState } from 'react';
import { Logo } from '@/components/Icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { submitSalesLead } from '@/lib/api';
import { toast } from 'sonner';

const USE_CASES = [
  'E-commerce COD / Order Verification',
  'Inbound/Outbound Lead Qualification',
  'Appointment Booking & Reminders',
  'Financial / Insurance Collections & Renewals',
  'Customer Support Automation',
  'Other',
];

const CALL_VOLUMES = [
  '1,000 – 10,000 calls / month',
  '10,000 – 50,000 calls / month',
  '50,000+ calls / month (Enterprise)',
];

type Props = {
  onSuccess?: () => void;
  showLogo?: boolean;
};

export default function TalkToSalesForm({ onSuccess, showLogo = true }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [callVolume, setCallVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid work email');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!useCase) {
      toast.error('Please select your primary use-case');
      return;
    }
    if (!callVolume) {
      toast.error('Please select your expected monthly call volume');
      return;
    }

    setLoading(true);
    try {
      const res = await submitSalesLead({
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        company_name: company.trim(),
        use_case: useCase,
        call_volume: callVolume,
        notes: notes.trim(),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Inquiry submitted successfully.');
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Failed to submit. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--status-live)' }}>
          <CheckCircle2 size={44} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--fg-0)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Thank you, {name}!
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.6, marginBottom: '24px' }}>
          Your inquiry has been received. Our team will review your details and contact you.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSubmitted(false);
            setName('');
            setEmail('');
            setPhone('');
            setCompany('');
            setUseCase('');
            setCallVolume('');
            setNotes('');
          }}
          style={{ cursor: 'pointer' }}
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div>
      {showLogo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--fg-0)', marginBottom: '24px' }}>
          <Logo size={22} />
          <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>Invenco</span>
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'var(--fg-3)', letterSpacing: '0.06em' }}>AI</span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--fg-0)', marginBottom: '6px' }}>
          Talk to Sales
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--fg-3)', lineHeight: 1.5 }}>
          Tell us about your business and expected call volume
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label htmlFor="sales-name" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Full name <span style={{ color: 'var(--fg-0)' }}>*</span>
            </Label>
            <Input
              id="sales-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              style={{ height: '42px', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label htmlFor="sales-email" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Work email <span style={{ color: 'var(--fg-0)' }}>*</span>
            </Label>
            <Input
              id="sales-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              style={{ height: '42px', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label htmlFor="sales-phone" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Phone / WhatsApp <span style={{ color: 'var(--fg-0)' }}>*</span>
            </Label>
            <Input
              id="sales-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              style={{ height: '42px', fontSize: '14px', fontFamily: 'var(--font-geist-mono)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label htmlFor="sales-company" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Company name
            </Label>
            <Input
              id="sales-company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Inc."
              style={{ height: '42px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Primary Use-Case <span style={{ color: 'var(--fg-0)' }}>*</span>
            </Label>
            <Select value={useCase} onValueChange={(val) => setUseCase(val ?? '')}>
              <SelectTrigger style={{ height: '42px', fontSize: '14px' }}>
                <SelectValue placeholder="Select use-case" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                {USE_CASES.map((uc) => (
                  <SelectItem key={uc} value={uc} style={{ fontSize: '13px', cursor: 'pointer' }}>
                    {uc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Expected Monthly Call Volume <span style={{ color: 'var(--fg-0)' }}>*</span>
            </Label>
            <Select value={callVolume} onValueChange={(val) => setCallVolume(val ?? '')}>
              <SelectTrigger style={{ height: '42px', fontSize: '14px' }}>
                <SelectValue placeholder="Select call volume" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                {CALL_VOLUMES.map((cv) => (
                  <SelectItem key={cv} value={cv} style={{ fontSize: '13px', cursor: 'pointer' }}>
                    {cv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label htmlFor="sales-notes" style={{ color: 'var(--fg-2)', fontSize: '13px' }}>
              Notes (optional)
            </Label>
            <Textarea
              id="sales-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tell us about your requirements..."
              style={{ minHeight: '80px', fontSize: '14px', resize: 'none' }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            fontSize: '15px',
            fontWeight: 500,
            borderRadius: '10px',
            opacity: loading ? 0.7 : 1,
            cursor: 'pointer',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={16} />
              <span>Submitting…</span>
            </div>
          ) : (
            'Submit'
          )}
        </button>
      </form>
    </div>
  );
}
