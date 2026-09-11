'use client';

import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Gauge } from 'lucide-react';
import type { CallMetrics, LlmProviderUsed, SttProviderUsed } from '@/lib/api';

const SLOW_THRESHOLD_MS = 2500;

const LLM_PROVIDER_LABELS: Record<LlmProviderUsed, string> = {
  groq: 'Groq LLM',
  cerebras: 'Cerebras LLM',
  together: 'Together AI LLM',
  openai: 'OpenAI LLM',
  openai_realtime: 'OpenAI Realtime',
  unknown: 'LLM',
};

const STT_PROVIDER_LABELS: Record<SttProviderUsed, string> = {
  groq: 'Groq STT',
  deepgram: 'Deepgram STT',
  together: 'Together AI STT',
};

function formatUsd(v: number): string {
  return `$${v.toFixed(4)}`;
}

const chartConfig: ChartConfig = {
  stt_ms: { label: 'STT', color: 'var(--chart-1)' },
  llm_ms: { label: 'LLM', color: 'var(--chart-2)' },
  tts_ms: { label: 'TTS', color: 'var(--chart-3)' },
};

function CostCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-lg font-semibold text-foreground">{formatUsd(value)}</p>
      </CardContent>
    </Card>
  );
}

export default function CallMetricsTab({ metrics }: { metrics: CallMetrics | null }) {
  const turns = metrics?.latency.turns ?? [];

  if (!metrics || turns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Gauge className="size-5 opacity-30" />
        <p className="text-sm">No metrics captured for this call.</p>
      </div>
    );
  }

  const { usage, cost, llm_provider, stt_provider } = metrics;
  const isRealtime = llm_provider === 'openai_realtime';

  return (
    <div className="flex flex-col gap-5">
      {/* Cost breakdown */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-7">
        <CostCard label="Telnyx" value={cost.telnyx_usd} />
        <CostCard label="Telnyx Recording" value={cost.telnyx_recording_usd} />
        <CostCard label={LLM_PROVIDER_LABELS[llm_provider] ?? 'LLM'} value={cost.llm_usd} />
        {/* Realtime has no separate STT stage — its audio understanding is
            priced into the LLM cost above, not a standalone transcription fee,
            so an STT card here would just show a confusing $0. */}
        {!isRealtime && <CostCard label={STT_PROVIDER_LABELS[stt_provider] ?? 'STT'} value={cost.stt_usd} />}
        <CostCard label="ElevenLabs" value={cost.tts_elevenlabs_usd} />
        <CostCard label="UpliftAI" value={cost.tts_uplift_usd} />
        <CostCard label="Total" value={cost.total_usd} />
      </div>

      {/* Usage */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Token &amp; Character Usage</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
            {[
              { label: 'Input Tokens', value: usage.llm_prompt_tokens },
              { label: 'Output Tokens', value: usage.llm_completion_tokens },
              { label: 'UpliftAI Chars', value: usage.tts_uplift_characters },
              { label: 'ElevenLabs Chars', value: usage.tts_elevenlabs_characters },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-[13px] font-medium text-foreground">
                  {value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Latency */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Response Latency per Turn</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={turns} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="turn"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="stt_ms" stackId="latency" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="llm_ms" stackId="latency" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="tts_ms" stackId="latency" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="flex flex-col gap-1.5">
            {turns.map((t) => (
              <div
                key={t.turn}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-[12px]"
              >
                <span className="font-mono text-muted-foreground">Turn {t.turn + 1}</span>
                <span className="font-mono text-muted-foreground">
                  {/* Realtime turns have no separate stt_ms/tts_ms (one
                      speech-to-speech stage, not three) — only show the
                      segments this turn actually has instead of "null". */}
                  {[
                    t.stt_ms != null && `STT ${t.stt_ms}ms`,
                    t.llm_ms != null && `LLM ${t.llm_ms}ms`,
                    t.tts_ms != null && `TTS ${t.tts_ms}ms`,
                  ].filter(Boolean).join(' · ')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-medium text-foreground">{t.total_ms}ms</span>
                  {t.total_ms > SLOW_THRESHOLD_MS && (
                    <Badge variant="destructive" className="text-[10px]">
                      Slow
                    </Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
