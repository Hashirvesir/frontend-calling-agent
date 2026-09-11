'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, PhoneIncoming, PhoneOutgoing, Phone, Download, Mic } from 'lucide-react';
import { getCalls, getConversation, getCallMetrics, getRecordingUrl } from '@/lib/api';
import type { CallRecord, TurnRecord, CallMetrics } from '@/lib/api';
import { cn } from '@/lib/utils';
import CallMetricsTab from '@/components/dashboard/CallMetricsTab';

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusLabel(status: string): string {
  if (status === 'in_progress') return 'Live';
  if (status === 'ended') return 'Ended';
  if (status === 'dialing') return 'Dialing';
  if (status === 'stream_failed') return 'Failed';
  return status;
}

function statusCls(status: string): string {
  if (status === 'in_progress') return 'border-chart-1/40 text-chart-1';
  if (status === 'ended') return 'border-chart-2/40 text-chart-2';
  if (status === 'dialing') return 'border-chart-3/40 text-chart-3';
  if (status === 'stream_failed') return 'border-chart-5/40 text-chart-5';
  return '';
}

function RecordingCard({ call }: { call: CallRecord }) {
  const isLive = call.status === 'in_progress';
  const hasRecording = Boolean(call.recording_storage_path);
  const audioUrl = hasRecording ? getRecordingUrl(call.recording_storage_path!) : null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Mic className="size-4 text-muted-foreground" />
            Recording
          </div>
          {audioUrl && (
            <a
              href={audioUrl}
              download
              className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="size-3.5" />
              Download MP3
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLive && !hasRecording ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-3">
            <span className="pill live" style={{ height: '20px', fontSize: '10px' }}>
              <span className="dot" />
              LIVE
            </span>
            <span className="text-sm text-chart-1">
              Call in progress — recording will appear when the call ends.
            </span>
          </div>
        ) : !hasRecording ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Mic className="size-5 opacity-30" />
            <p className="text-sm">No recording available for this call.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <audio
                controls
                src={audioUrl!}
                preload="metadata"
                className="w-full"
                style={{ colorScheme: 'dark', accentColor: 'var(--chart-1)' }}
              />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">{call.recording_storage_path}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [call, setCall] = useState<CallRecord | null | undefined>(undefined);
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'metrics'>('overview');

  useEffect(() => {
    Promise.all([getCalls(), getConversation(id), getCallMetrics(id)]).then(([calls, t, m]) => {
      setCall(calls.find(c => c.id === id) ?? null);
      setTurns(t);
      setMetrics(m);
      setLoading(false);
    });
  }, [id]);

  const number = call
    ? (call.direction === 'inbound' ? call.from_number : call.to_number) ?? '—'
    : '—';

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-[1fr_1.4fr] gap-5">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!call) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
        <Phone className="size-8 opacity-30" />
        <p className="text-sm">Call not found.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/calls')}>
          Back to Calls
        </Button>
      </main>
    );
  }

  const meta = [
    { label: 'From', value: call.from_number ?? '—' },
    { label: 'To', value: call.to_number ?? '—' },
    { label: 'Agent', value: call.agents?.name ?? '—' },
    { label: 'Duration', value: formatDuration(call.duration_seconds) },
    { label: 'Started', value: formatDate(call.started_at) },
    { label: 'Ended', value: formatDate(call.ended_at) },
    { label: 'Turns', value: String(call.turn_count ?? 0) },
    { label: 'Direction', value: call.direction === 'inbound' ? 'Inbound' : 'Outbound' },
  ];

  return (
    <main className="flex flex-1 flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard/calls')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            {call.direction === 'inbound'
              ? <PhoneIncoming className="size-4 text-chart-2/80" />
              : <PhoneOutgoing className="size-4 text-chart-4/80" />
            }
          </div>
          <div>
            <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground">{number}</h1>
            <p className="text-xs text-muted-foreground capitalize">{call.direction} · {formatDate(call.started_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {call.status === 'in_progress' && (
            <span className="pill live" style={{ fontSize: '10px' }}>
              <span className="dot" /> LIVE
            </span>
          )}
          <Badge variant="outline" className={cn('font-mono text-[11px]', statusCls(call.status))}>
            {statusLabel(call.status)}
          </Badge>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        {(['overview', 'metrics'] as const).map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="sm"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-none border-b-2 border-transparent font-mono text-xs capitalize',
              tab === t && 'border-chart-1 text-foreground',
            )}
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === 'overview' ? (
        /* 2-col grid: left = meta + recording, right = transcript */
        <div className="grid grid-cols-[1fr_1.4fr] gap-5 items-start">

          {/* LEFT column */}
          <div className="flex flex-col gap-5">
            {/* Call metadata */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Call Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {meta.map(({ label, value }) => (
                    <div key={label}>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 font-mono text-[13px] font-medium text-foreground truncate">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* Recording */}
            <RecordingCard call={call} />
          </div>

          {/* RIGHT column — transcript */}
          <Card className="flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Transcript</span>
                <span className="font-mono text-[11px] text-muted-foreground font-normal">
                  {turns.length} turn{turns.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              {turns.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Phone className="size-5 opacity-30" />
                  <p className="text-sm">No transcript available.</p>
                </div>
              ) : (
                <ScrollArea className="h-[560px]">
                  <div className="flex flex-col gap-3 pr-4">
                    {turns.map((turn, i) => {
                      const isAgent = turn.speaker === 'BOT';
                      return (
                        <div key={i} className={cn('flex gap-3', !isAgent && 'flex-row-reverse')}>
                          <div className={cn(
                            'size-7 shrink-0 rounded-full flex items-center justify-center font-mono text-[9px] mt-0.5',
                            isAgent ? 'bg-chart-1/10 text-chart-1' : 'bg-muted text-muted-foreground',
                          )}>
                            {isAgent ? 'AI' : 'U'}
                          </div>
                          <div className={cn(
                            'rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[80%]',
                            isAgent
                              ? 'bg-muted/40 text-foreground rounded-tl-sm'
                              : 'bg-muted/20 text-muted-foreground rounded-tr-sm',
                          )}>
                            {turn.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <CallMetricsTab metrics={metrics} />
      )}
    </main>
  );
}
