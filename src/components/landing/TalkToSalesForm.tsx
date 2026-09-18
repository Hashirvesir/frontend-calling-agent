'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
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
      <div className={cn('flex flex-col items-center justify-center text-center p-8 rounded-xl border border-white/10 bg-black text-white', className)}>
        <h3 className="text-xl font-semibold mb-2">
          Thank you, {name}!
        </h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
          Your inquiry has been received. Our team will review your details and get in touch with you.
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
          className="text-xs bg-transparent border-white/20 text-white hover:bg-white/10"
        >
          Submit another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4 text-left text-white', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Full Name <span className="text-white">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="h-10 bg-black border-white/15 text-white placeholder:text-neutral-500 focus-visible:border-white focus-visible:ring-0"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Work Email <span className="text-white">*</span>
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
            className="h-10 bg-black border-white/15 text-white placeholder:text-neutral-500 focus-visible:border-white focus-visible:ring-0"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Phone / WhatsApp <span className="text-white">*</span>
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="h-10 bg-black border-white/15 text-white placeholder:text-neutral-500 focus-visible:border-white focus-visible:ring-0 font-mono text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Company Name
          </Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="h-10 bg-black border-white/15 text-white placeholder:text-neutral-500 focus-visible:border-white focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Primary Use-Case <span className="text-white">*</span>
          </Label>
          <Select value={useCase} onValueChange={(val) => setUseCase(val ?? '')}>
            <SelectTrigger className="h-10 bg-black border-white/15 text-white text-xs text-left focus-visible:border-white focus-visible:ring-0">
              <SelectValue placeholder="Select use-case" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="bg-black border-white/15 text-white">
              {USE_CASES.map((uc) => (
                <SelectItem key={uc} value={uc} className="text-xs text-neutral-200 focus:bg-white focus:text-black cursor-pointer">
                  {uc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-300">
            Monthly Call Volume <span className="text-white">*</span>
          </Label>
          <Select value={callVolume} onValueChange={(val) => setCallVolume(val ?? '')}>
            <SelectTrigger className="h-10 bg-black border-white/15 text-white text-xs text-left focus-visible:border-white focus-visible:ring-0">
              <SelectValue placeholder="Select call volume" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="bg-black border-white/15 text-white">
              {CALL_VOLUMES.map((cv) => (
                <SelectItem key={cv} value={cv} className="text-xs text-neutral-200 focus:bg-white focus:text-black cursor-pointer">
                  {cv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-neutral-300">
          Notes
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tell us about your requirements..."
          className="min-h-[80px] bg-black border-white/15 text-white text-xs placeholder:text-neutral-500 resize-none focus-visible:border-white focus-visible:ring-0"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 mt-2 bg-white text-black hover:bg-neutral-200 font-medium text-sm transition-all cursor-pointer"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span>Submitting...</span>
          </div>
        ) : (
          <span>Submit</span>
        )}
      </Button>
    </form>
  );
}
