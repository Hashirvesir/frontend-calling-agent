'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CallRow = {
  dir: 'in' | 'out';
  number: string;
  agent: string;
  outcome: string;
  dur: string;
  live: boolean;
};

function outcomeVariant(outcome: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (outcome === 'Ended') return 'outline';
  if (outcome === 'Live') return 'outline';
  if (outcome === 'Failed') return 'destructive';
  return 'secondary';
}

function outcomeTw(outcome: string) {
  if (outcome === 'Ended') return 'border-chart-2/40 text-chart-2';
  if (outcome === 'Live') return 'border-chart-1/40 text-chart-1';
  if (outcome === 'Failed') return 'border-chart-5/40 text-chart-5';
  return '';
}

export default function CallTable({ calls }: { calls: CallRow[] }) {
  if (calls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 pb-6 text-muted-foreground">
          <PhoneMissed className="size-5 opacity-30" />
          <span className="text-sm">No calls yet.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Calls</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10 pl-4" />
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Number
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground pr-4">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((row, i) => (
              <TableRow
                key={i}
                className={cn(
                  'border-border transition-colors',
                  row.live ? 'row-live' : ''
                )}
              >
                <TableCell className="pl-4">
                  {row.dir === 'in' ? (
                    <PhoneIncoming className="size-3.5 text-chart-2/70" />
                  ) : (
                    <PhoneOutgoing className="size-3.5 text-chart-4/70" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-foreground">{row.number}</span>
                    {row.live && (
                      <span className="pill live" style={{ height: '18px', fontSize: '10px' }}>
                        <span className="dot" />
                        LIVE
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {row.agent}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={outcomeVariant(row.outcome)}
                    className={cn('font-mono text-[11px]', outcomeTw(row.outcome))}
                  >
                    {row.outcome}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[12px] tabular-nums text-muted-foreground pr-4">
                  {row.dur}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
