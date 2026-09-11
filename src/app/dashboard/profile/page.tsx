'use client';

import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TIMEZONES = [
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT, UTC+5)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
];

type ProfileFields = { firstName: string; lastName: string; timezone: string };

const DEFAULT_FIELDS: ProfileFields = { firstName: '', lastName: '', timezone: 'Asia/Karachi' };

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [fields, setFields] = useState<ProfileFields>(DEFAULT_FIELDS);
  const [initialFields, setInitialFields] = useState<ProfileFields>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.email) setEmail(user.email);
        setEmailVerified(!!user.email_confirmed_at);
        const meta = (user.user_metadata ?? {}) as Record<string, string>;
        const loaded: ProfileFields = {
          firstName: meta.first_name ?? '',
          lastName: meta.last_name ?? '',
          timezone: meta.timezone ?? 'Asia/Karachi',
        };
        setFields(loaded);
        setInitialFields(loaded);
      }
      setLoading(false);
    });
  }, []);

  const dirty = JSON.stringify(fields) !== JSON.stringify(initialFields);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: fields.firstName,
        last_name: fields.lastName,
        timezone: fields.timezone,
      },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInitialFields(fields);
    setSaved(true);
    toast.success('Profile saved');
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDiscard() {
    setFields(initialFields);
  }

  const initials = `${fields.firstName[0] ?? ''}${fields.lastName[0] ?? ''}`.toUpperCase() || '—';
  const fullName = fields.firstName || fields.lastName ? `${fields.firstName} ${fields.lastName}`.trim() : 'Your Name';
  const timezoneLabel = TIMEZONES.find(tz => tz.value === fields.timezone)?.label ?? fields.timezone;

  const accountInfo = [
    { label: 'Full Name', value: fullName },
    { label: 'Email', value: email || '—' },
    { label: 'Timezone', value: timezoneLabel },
    { label: 'Status', value: emailVerified ? 'Verified' : 'Unverified' },
  ];

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
        </div>
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-chart-1/15 text-chart-1 font-semibold text-base ring-1 ring-chart-1/30">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
              {emailVerified ? (
                <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px]">Verified</Badge>
              ) : (
                <Badge variant="outline" className="border-chart-3/40 text-chart-3 text-[10px]">Unverified</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{email || 'your@email.com'}</p>
          </div>
        </div>
      </div>

      {/* Account overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Overview</CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {accountInfo.map(({ label, value }) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-0.5 font-mono text-[12px] text-foreground truncate" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Editable settings */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name — shown to you across the dashboard</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">First name</Label>
                <Input
                  value={fields.firstName}
                  onChange={e => setFields(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Last name</Label>
                <Input
                  value={fields.lastName}
                  onChange={e => setFields(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex gap-2">
                <Input value={email} disabled className="flex-1 opacity-70" />
                {emailVerified ? (
                  <Badge variant="outline" className="border-chart-2/40 text-chart-2 self-center shrink-0">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-chart-3/40 text-chart-3 self-center shrink-0">Unverified</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Email is tied to your login and can&apos;t be changed here.</p>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button size="sm" className="gap-1.5 min-w-24" onClick={handleSave} disabled={!dirty || saving}>
              {saving
                ? <Loader2 className="size-3.5 animate-spin" />
                : saved
                  ? <><Check className="size-3.5" /> Saved</>
                  : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Regional and display settings</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Timezone</Label>
              <Select value={fields.timezone} onValueChange={v => setFields(f => ({ ...f, timezone: v }))}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
