'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Trash2,
} from 'lucide-react';
import { getCalls, getAgents, deleteCallApi } from '@/lib/api';
import type { CallRecord, AgentRecord } from '@/lib/api';
import { toast } from 'sonner';
import DialSheet from '@/components/dashboard/DialSheet';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'inbound' | 'outbound' | 'live';

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total];
  }
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusMeta(status: string): { label: string; cls: string } {
  if (status === 'in_progress') return { label: 'Live', cls: 'border-chart-1/40 text-chart-1' };
  if (status === 'ended') return { label: 'Ended', cls: 'border-chart-2/40 text-chart-2' };
  if (status === 'dialing') return { label: 'Dialing', cls: 'border-chart-3/40 text-chart-3' };
  if (status === 'stream_failed') return { label: 'Failed', cls: 'border-chart-5/40 text-chart-5' };
  return { label: status, cls: '' };
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'inbound', label: 'Inbound' },
  { key: 'outbound', label: 'Outbound' },
  { key: 'live', label: 'Live' },
];

export default function CallsPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [dialOpen, setDialOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      Promise.all([getCalls(), getAgents()]).then(([c, a]) => {
        if (!mounted) return;
        setCalls(c);
        setAgents(a);
        setLoading(false);
      });
    };
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const filtered = calls.filter(c => {
    if (filter === 'inbound') return c.direction === 'inbound';
    if (filter === 'outbound') return c.direction === 'outbound';
    if (filter === 'live') return c.status === 'in_progress';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCalls = filtered.slice(startIndex, startIndex + pageSize);

  const liveCount = calls.filter(c => c.status === 'in_progress').length;
  const inbound = calls.filter(c => c.direction === 'inbound').length;
  const outbound = calls.filter(c => c.direction === 'outbound').length;
  const ended = calls.filter(c => c.duration_seconds);
  const avgSecs = ended.length
    ? ended.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / ended.length
    : null;

  const metrics = [
    { label: 'Total', value: calls.length, icon: Phone, delta: 'all calls', positive: calls.length > 0 },
    { label: 'Inbound', value: inbound, icon: PhoneIncoming, delta: 'received', positive: inbound > 0 },
    { label: 'Outbound', value: outbound, icon: PhoneOutgoing, delta: 'dialed', positive: outbound > 0 },
    { label: 'Avg Duration', value: formatDuration(avgSecs ? Math.round(avgSecs) : null), icon: Clock, delta: `${ended.length} completed`, positive: true },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All inbound and outbound calls</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialOpen(true)}>
          <Phone className="size-3.5" data-icon="inline-start" />
          New Call
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={m.label} size="sm" className="metric-card" style={{ animationDelay: `${i * 70}ms` }}>
            <CardHeader className="pb-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.label}
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <Skeleton className="h-8 w-14" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none text-foreground">
                  {m.value}
                </p>
              )}
              <p className={cn('mt-2 font-mono text-[11px]', m.positive ? 'text-chart-1' : 'text-muted-foreground')}>
                {m.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calls table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Call Log</span>
            <div className="flex items-center gap-1">
              {FILTERS.map(f => {
                const count = f.key === 'all' ? calls.length
                  : f.key === 'inbound' ? inbound
                  : f.key === 'outbound' ? outbound
                  : liveCount;
                return (
                  <button
                    key={f.key}
                    onClick={() => {
                      setFilter(f.key);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full font-mono text-[10px] transition-colors',
                      filter === f.key
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    {f.label}
                    {!loading && <span className="ml-1 opacity-60">{count}</span>}
                  </button>
                );
              })}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <PhoneMissed className="size-6 opacity-30" />
              <p className="text-sm">No calls found.</p>
            </div>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8 pl-4" />
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Number
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Agent
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Duration
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Started
                  </TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCalls.map(call => {
                  const status = statusMeta(call.status);
                  const number = call.direction === 'inbound' ? call.from_number : call.to_number;
                  return (
                    <TableRow
                      key={call.id}
                      className={cn(
                        'border-border cursor-pointer transition-colors',
                        call.status === 'in_progress' && 'row-live',
                      )}
                      onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                    >
                      <TableCell className="pl-4">
                        {call.direction === 'inbound'
                          ? <PhoneIncoming className="size-3.5 text-chart-2/70" />
                          : <PhoneOutgoing className="size-3.5 text-chart-4/70" />
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] text-foreground">
                            {number ?? '—'}
                          </span>
                          {call.status === 'in_progress' && (
                            <span className="pill live" style={{ height: '18px', fontSize: '10px' }}>
                              <span className="dot" />
                              LIVE
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {call.agents?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('font-mono text-[11px]', status.cls)}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        {formatDuration(call.duration_seconds)}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {formatDate(call.started_at)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <button
                          disabled={deleting === call.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Is call ka record delete karna chahte hain?')) return;
                            setDeleting(call.id);
                            const ok = await deleteCallApi(call.id);
                            if (ok) {
                              setCalls(prev => prev.filter(c => c.id !== call.id));
                              toast.success('Call record deleted');
                            } else {
                              toast.error('Failed to delete call');
                            }
                            setDeleting(null);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-4 py-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–<span className="font-medium text-foreground">{Math.min(startIndex + pageSize, filtered.length)}</span> of{' '}
                    <span className="font-medium text-foreground">{filtered.length}</span> calls
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px]">Rows:</span>
                    <NativeSelect
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-7 w-16 text-xs px-2 py-0"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </NativeSelect>
                  </div>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          disabled={safePage <= 1}
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        />
                      </PaginationItem>
                      {getPageNumbers(safePage, totalPages).map((p, idx) => (
                        <PaginationItem key={idx}>
                          {p === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={safePage === p}
                              onClick={() => setCurrentPage(Number(p))}
                            >
                              {p}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          disabled={safePage >= totalPages}
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      <DialSheet open={dialOpen} onOpenChange={setDialOpen} agents={agents} />
    </main>
  );
}
