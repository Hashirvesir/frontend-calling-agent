'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { submitSalesLead } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  className?: string;
};

export default function TalkToSalesForm({ onSuccess, className }: Props) {
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
      toast.error('Please enter your phone or WhatsApp number');
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
        name,
        email,
        phone_number: phone,
        company_name: company,
        use_case: useCase,
        call_volume: callVolume,
        notes,
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Inquiry submitted! Our team will contact you shortly.');
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Failed to submit form. Please try again.');
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border border-[var(--border-2)] bg-[var(--surface-1)] shadow-[var(--shadow-glass)]', className)}>
        <div className="size-14 rounded-full bg-chart-1/10 border border-chart-1/30 flex items-center justify-center text-chart-1 mb-4 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="size-7" />
        </div>
        <Badge variant="outline" className="font-mono text-xs mb-3 border-chart-1/30 text-chart-1">
          LEAD RECEIVED · HIGH PRIORITY
        </Badge>
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Thank you, {name}!
        </h3>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
          We received your enterprise inquiry for <span className="text-foreground font-medium">{callVolume}</span>. Our voice solution specialist will reach out to you at <span className="text-foreground font-medium font-mono">{phone}</span> or <span className="text-foreground font-medium">{email}</span> within 2 business hours.
        </p>
        <Button
          variant="outline"
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
          className="text-xs font-mono"
        >
          Submit another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4 text-left', className)}>
      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <User className="size-3.5 text-chart-1" /> Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            className="h-9 bg-[var(--surface-2)] border-[var(--border-2)] text-sm placeholder:text-muted-foreground/50 focus-visible:border-chart-1"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Mail className="size-3.5 text-chart-1" /> Work Email <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tariq@company.com"
            className="h-9 bg-[var(--surface-2)] border-[var(--border-2)] text-sm placeholder:text-muted-foreground/50 focus-visible:border-chart-1"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Phone className="size-3.5 text-chart-1" /> Phone / WhatsApp <span className="text-destructive">*</span>
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="h-9 font-mono bg-[var(--surface-2)] border-[var(--border-2)] text-sm placeholder:text-muted-foreground/50 focus-visible:border-chart-1"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-muted-foreground" /> Company / Brand Name
          </Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Khaadi / Daraz Seller"
            className="h-9 bg-[var(--surface-2)] border-[var(--border-2)] text-sm placeholder:text-muted-foreground/50 focus-visible:border-chart-1"
          />
        </div>
      </div>

      {/* Qualification Fields Box */}
      <div className="p-3.5 rounded-xl border border-chart-1/25 bg-chart-1/[0.03] space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-chart-1 flex items-center gap-1.5 font-medium">
            <Sparkles className="size-3" /> Qualification Details
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Helps us prioritize your lead</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Primary Use-Case Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Headphones className="size-3.5 text-chart-1" /> Primary Use-Case <span className="text-destructive">*</span>
            </Label>
            <Select value={useCase} onValueChange={(val) => setUseCase(val ?? '')}>
              <SelectTrigger className="h-9 bg-[var(--surface-2)] border-[var(--border-2)] text-xs text-left focus-visible:border-chart-1">
                <SelectValue placeholder="Select primary use-case..." />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="bg-[var(--surface-1)] border-[var(--border-2)]">
                {USE_CASES.map((uc) => (
                  <SelectItem key={uc} value={uc} className="text-xs focus:bg-chart-1/10 focus:text-chart-1 cursor-pointer">
                    {uc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expected Monthly Call Volume Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-chart-1" /> Monthly Call Volume <span className="text-destructive">*</span>
            </Label>
            <Select value={callVolume} onValueChange={(val) => setCallVolume(val ?? '')}>
              <SelectTrigger className="h-9 bg-[var(--surface-2)] border-[var(--border-2)] text-xs text-left focus-visible:border-chart-1">
                <SelectValue placeholder="Select expected volume..." />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="bg-[var(--surface-1)] border-[var(--border-2)]">
                {CALL_VOLUMES.map((cv) => (
                  <SelectItem key={cv} value={cv} className="text-xs focus:bg-chart-1/10 focus:text-chart-1 cursor-pointer">
                    {cv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Additional Notes / Requirements */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
          <span>Project Notes & Custom Requirements</span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">Optional</span>
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tell us about your current stack, CRM, integration requirements, or languages needed..."
          className="min-h-[70px] bg-[var(--surface-2)] border-[var(--border-2)] text-xs placeholder:text-muted-foreground/50 resize-none focus-visible:border-chart-1"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 mt-1 bg-foreground text-background hover:bg-foreground/90 font-medium text-xs sm:text-sm shadow-md transition-all gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Submitting your inquiry...</span>
          </>
        ) : (
          <>
            <span>Submit Sales Inquiry</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground/70 font-mono">
        Guaranteed response within 2 hours · Direct engineer contact
      </p>
    </form>
  );
}
