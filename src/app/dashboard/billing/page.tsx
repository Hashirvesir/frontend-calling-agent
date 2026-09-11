'use client';

import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getBillingUsage } from '@/lib/api';
import type { BillingUsage } from '@/lib/api';

function formatUsd(v: number): string {
  return `$${v.toFixed(v < 1 ? 4 : 2)}`;
}

export default function BillingPage() {
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBillingUsage().then(u => {
      setUsage(u);
      setLoading(false);
    });
  }, []);

  const monthLabel = usage
    ? new Date(usage.period_start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const metrics = [
    { label: 'Calls This Month', value: usage ? String(usage.total_calls) : '—' },
    { label: 'Minutes', value: usage ? String(usage.total_minutes) : '—' },
    { label: 'Total Cost', value: usage ? formatUsd(usage.cost.total_usd) : '—' },
    { label: 'Plan', value: 'Pay-as-you-go' },
  ];

  const costBreakdown = usage
    ? [
        { label: 'Telnyx', value: formatUsd(usage.cost.telnyx_usd) },
        { label: 'Telnyx Recording', value: formatUsd(usage.cost.telnyx_recording_usd) },
        // Generic labels, not "Groq LLM"/"Groq STT" — a month can mix calls
        // across Groq/Cerebras/OpenAI-failover/OpenAI-Realtime, each billed
        // differently (see app/api/billing.py's per-call provider branching).
        { label: 'LLM', value: formatUsd(usage.cost.llm_usd) },
        { label: 'STT', value: formatUsd(usage.cost.stt_usd) },
        { label: 'ElevenLabs', value: formatUsd(usage.cost.tts_elevenlabs_usd) },
        { label: 'UpliftAI', value: formatUsd(usage.cost.tts_uplift_usd) },
      ]
    : [];

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your plan and usage — {monthLabel || 'this month'}</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground text-[10px] shrink-0">No plan required</Badge>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card
            key={m.label}
            size="sm"
            className="metric-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardHeader className="pb-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.label}
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-semibold tracking-tight tabular-nums leading-none text-foreground">
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
          <CardDescription>Per-provider usage cost for {monthLabel || 'this month'}</CardDescription>
        </CardHeader>
        <CardContent>
          {usage ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              {costBreakdown.map(({ label, value }) => (
                <div key={label}>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-mono text-lg font-semibold text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground py-6 text-center">Could not load usage data.</p>
          )}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription>How you&apos;re billed today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Pay-as-you-go</span>
              <span className="text-xs text-muted-foreground">
                Subscription billing isn&apos;t set up yet — usage above is shown for visibility only.
              </span>
            </div>
            <Badge variant="outline" className="text-muted-foreground text-[10px] shrink-0">No plan required</Badge>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
