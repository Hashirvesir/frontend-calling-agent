'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhoneMissed, PhoneOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallRecord, TurnRecord } from '@/lib/api';

const WAVEFORM_BARS = 60;

type Props = {
  call: CallRecord | null;
  turns: TurnRecord[];
  onEndCall?: () => void;
  isEnding?: boolean;
};

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function barAnimName(i: number): string {
  const zone = i % 3;
  if (zone === 0) return 'barAnimA';
  if (zone === 1) return 'barAnimB';
  return 'barAnimC';
}

export default function LiveCallPanel({ call, turns, onEndCall, isEnding }: Props) {
  const isLive = call?.status === 'in_progress';
  const displayNumber = call
    ? (call.direction === 'inbound' ? call.from_number : call.to_number) ?? '—'
    : null;

  return (
    <Card className="shadow-[var(--shadow-glass)]">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-muted-foreground">
              {isLive ? 'Live call' : call ? 'Last call' : 'No calls yet'}
            </span>
            {isLive && (
              <span className="pill live" style={{ gap: '6px' }}>
                <span className="dot" />
                LIVE · {formatDuration(call?.duration_seconds ?? null)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {displayNumber && (
              <Badge variant="outline" className="font-mono text-[11px] border-border text-foreground">
                {displayNumber}
              </Badge>
            )}
            {isLive && onEndCall && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1.5 shadow-sm font-medium"
                onClick={onEndCall}
                disabled={isEnding}
              >
                {isEnding ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PhoneOff className="size-3.5" />
                )}
                <span>End Call</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        {/* Waveform — teal bars when live */}
        {isLive && (
          <div className="flex items-center gap-[2px] h-10 overflow-hidden">
            {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-[2px] rounded-full shrink-0',
                  'bg-chart-1'
                )}
                style={{
                  animationName: barAnimName(i),
                  animationDuration: i % 3 === 0 ? '1.3s' : i % 3 === 1 ? '0.95s' : '1.7s',
                  animationTimingFunction: 'var(--ease-smooth)',
                  animationIterationCount: 'infinite',
                  animationDelay: `${(i * 1.4) / WAVEFORM_BARS}s`,
                  opacity: 0.4 + 0.6 * Math.sin((i / WAVEFORM_BARS) * Math.PI),
                }}
              />
            ))}
          </div>
        )}

        {/* Transcript */}
        {turns.length > 0 ? (
          <ScrollArea className="h-36">
            <div className="flex flex-col gap-2.5 pr-3">
              {turns.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    line.speaker !== 'BOT' && 'flex-row-reverse'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-[9px] tracking-widest shrink-0 pt-0.5',
                      line.speaker === 'BOT' ? 'text-chart-1' : 'text-muted-foreground/50'
                    )}
                  >
                    {line.speaker === 'BOT' ? 'AGT' : 'USR'}
                  </span>
                  <span
                    className={cn(
                      'text-[12px] leading-relaxed rounded-lg px-3 py-1.5',
                      line.speaker === 'BOT'
                        ? 'bg-muted/40 text-foreground'
                        : 'bg-muted/20 text-muted-foreground'
                    )}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground">
            <PhoneMissed className="size-5 opacity-30" />
            <span className="text-sm">
              {call ? 'No transcript available.' : 'Waiting for first call…'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
