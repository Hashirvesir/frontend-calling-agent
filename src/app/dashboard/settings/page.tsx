'use client';

import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  KeyRound, Copy, Check, ExternalLink, Save, Loader2, AlertTriangle, SlidersHorizontal, Link2,
  Activity, RefreshCw, CircleCheck, CircleX, CircleSlash, CircleHelp,
} from 'lucide-react';
import { getPlatformSettings, savePlatformSettings, getSystemHealth } from '@/lib/api';
import type { PlatformSettings, SystemHealth, ProviderHealthStatus } from '@/lib/api';
import { toast } from 'sonner';

// LLM/STT/TTS/Pipeline Mode selection moved to each agent's own Model Config
// page (frontend/src/app/dashboard/agents/[id]/model/page.tsx) — every agent
// now configures these independently instead of one shared account default.
// This page keeps only account-wide concerns: Telnyx credentials and the
// system-level API-key health check.

const TABS = [
  { key: 'telnyx', label: 'Telnyx', icon: KeyRound },
  { key: 'health', label: 'API Credits', icon: Activity },
] as const;

const HEALTH_STATUS_META: Record<ProviderHealthStatus, { label: string; className: string; icon: typeof CircleCheck }> = {
  ok: { label: 'OK', className: 'border-chart-2/40 text-chart-2', icon: CircleCheck },
  exhausted: { label: 'Out of credits', className: 'border-destructive/40 text-destructive', icon: CircleX },
  no_key: { label: 'No API key', className: 'text-muted-foreground', icon: CircleSlash },
  error: { label: 'Unknown', className: 'border-yellow-500/40 text-yellow-600', icon: CircleHelp },
};
type SettingsTab = (typeof TABS)[number]['key'];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('telnyx');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [telnyxApiKey, setTelnyxApiKey] = useState('');
  const [telnyxWebhookKey, setTelnyxWebhookKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(s => { if (s) setPlatformSettings(s); }).finally(() => setLoading(false));
  }, []);

  // Lazy-loaded, not part of the initial fetch above — every provider check
  // here spends a tiny amount of real quota/characters (see
  // app/api/system_health.py), so it only runs once the user actually opens
  // this tab, not on every Settings page visit.
  async function loadHealth() {
    setLoadingHealth(true);
    const h = await getSystemHealth();
    if (h) setHealthData(h);
    setLoadingHealth(false);
  }

  useEffect(() => {
    if (activeTab === 'health' && healthData === null && !loadingHealth) {
      // Deferred to a microtask so the state update below doesn't happen
      // synchronously within the effect body itself.
      Promise.resolve().then(loadHealth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleSaveKeys(e: React.FormEvent) {
    e.preventDefault();
    setSavingKeys(true);
    const payload: { telnyx_api_key?: string; telnyx_webhook_public_key?: string } = {};
    if (telnyxApiKey.trim()) payload.telnyx_api_key = telnyxApiKey.trim();
    if (telnyxWebhookKey.trim()) payload.telnyx_webhook_public_key = telnyxWebhookKey.trim();
    const res = await savePlatformSettings(payload);
    setSavingKeys(false);
    if (res.ok) {
      toast.success('Telnyx credentials saved');
      setTelnyxApiKey('');
      setTelnyxWebhookKey('');
      getPlatformSettings().then(s => { if (s) setPlatformSettings(s); });
    } else {
      toast.error(res.error ?? 'Failed to save credentials');
    }
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setter(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <div className="flex flex-col gap-6 max-w-2xl">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and platform configuration</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(t => (
          <Button
            key={t.key}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'gap-1.5 rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent text-xs',
              activeTab === t.key && 'border-b-chart-1 text-foreground',
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'telnyx' && (
      <div className="flex flex-col gap-6 max-w-2xl">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4" />
                Telnyx Credentials
              </CardTitle>
              <CardDescription>Your account-level Telnyx API key and webhook verification key</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-5">
              {/* Signature verification warning — shown until a webhook public
                  key is set. Without it, webhook signature checks are skipped
                  entirely (fail-open), so anyone with the webhook URL could
                  send forged call events. */}
              {platformSettings && !platformSettings.has_webhook_key && (
                <div
                  className="flex items-start gap-2.5 rounded-lg border px-4 py-3"
                  style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)' }}
                >
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-medium text-foreground">Webhook signature verification is off</p>
                    <p className="text-xs text-muted-foreground">
                      Without a Webhook Public Key, Telnyx event signatures aren&apos;t checked — anyone
                      with your webhook URL could send fake call events. Add your key below to secure it.
                    </p>
                  </div>
                </div>
              )}

              {/* Current status */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-border bg-muted/10 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Telnyx API Key</span>
                  {platformSettings?.has_telnyx_api_key
                    ? <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px]">Configured</Badge>
                    : <Badge variant="outline" className="text-muted-foreground text-[10px]">Not set</Badge>
                  }
                </div>
                <div className="flex-1 rounded-lg border border-border bg-muted/10 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Webhook Key</span>
                  {platformSettings?.has_webhook_key
                    ? <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px]">Configured</Badge>
                    : <Badge variant="outline" className="text-muted-foreground text-[10px]">Not set</Badge>
                  }
                </div>
              </div>

              <Separator />

              {/* Update form */}
              <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    New Telnyx API Key <span className="text-muted-foreground/50">(leave blank to keep current)</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="KEY…"
                    value={telnyxApiKey}
                    onChange={e => setTelnyxApiKey(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    New Webhook Public Key <span className="text-muted-foreground/50">(leave blank to keep current)</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Base64-encoded Ed25519 key…"
                    value={telnyxWebhookKey}
                    onChange={e => setTelnyxWebhookKey(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <Button type="submit" size="sm" disabled={savingKeys} className="gap-1.5 self-start">
                  {savingKeys ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save Credentials
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="size-4" />
                Your Webhook URL
              </CardTitle>
              <CardDescription>
                Set this as the webhook URL in your Telnyx application
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-lg border border-input bg-muted/30 px-3 h-8 font-mono text-xs text-foreground overflow-hidden truncate">
                  {platformSettings?.webhook_url || '— Save credentials first to generate your URL —'}
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => copyText(platformSettings?.webhook_url ?? '', setCopiedWebhookUrl)}
                  disabled={!platformSettings?.webhook_url}
                >
                  {copiedWebhookUrl ? <Check className="size-3.5 text-chart-1" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="size-3 shrink-0" />
                Telnyx Dashboard → Your App → Voice → Webhook URL
              </p>
            </CardContent>
          </Card>
      </div>
      )}

      {activeTab === 'health' && (
      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              API Credits &amp; Status
            </CardTitle>
            <CardDescription>
              Live status of every system-level API key this platform uses. Most providers don&apos;t
              expose a balance API, so their status comes from a tiny real request — a 1-token
              completion or a few characters of speech, cached for 60 seconds.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={loadHealth} disabled={loadingHealth}>
            {loadingHealth ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="pt-5">
          {loadingHealth && !healthData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : !healthData ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Could not load status.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(healthData.providers).map(([key, p]) => {
                const meta = HEALTH_STATUS_META[p.status];
                const StatusIcon = meta.icon;
                return (
                  <div key={key} className="rounded-lg border border-border bg-muted/10 px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <Badge variant="outline" className={cn('text-[10px] gap-1', meta.className)}>
                        <StatusIcon className="size-3" />
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.used_for}</p>
                    {typeof p.limit === 'number' && p.unit === 'characters' && (
                      <p className="font-mono text-[11px] text-foreground">
                        {p.usage?.toLocaleString()} / {p.limit.toLocaleString()} characters this month
                      </p>
                    )}
                    {typeof p.limit === 'number' && p.unit === 'usd_remaining' && (
                      <p className="font-mono text-[11px] text-foreground">
                        ${p.limit.toLocaleString()} balance remaining
                      </p>
                    )}
                    {p.status === 'error' && p.detail && (
                      <p className="text-[11px] text-muted-foreground">{p.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </main>
  );
}
