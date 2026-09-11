'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import LiveCallPanelClient from '@/components/dashboard/LiveCallPanelClient';
import AgentsCard from '@/components/dashboard/AgentsCard';
import CallTable from '@/components/dashboard/CallTable';
import ChartCard from '@/components/dashboard/ChartCard';
import { getStats, getCalls, getAgents } from '@/lib/api';
import type { CallRecord, StatsRecord, AgentRecord } from '@/lib/api';
import { Phone, Activity, Clock, Bot } from 'lucide-react';

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildChartData(calls: CallRecord[]) {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts: Record<string, number> = {};
  const now = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
    counts[key] = 0;
  }
  calls.forEach(c => {
    if (!c.started_at) return;
    const key = c.started_at.slice(0, 10);
    if (key in counts) counts[key]++;
  });
  return days.map(key => ({
    day: DAY_LABELS[new Date(key + 'T12:00:00').getDay()],
    calls: counts[key],
  }));
}

function mapOutcome(status: string) {
  if (status === 'in_progress') return 'Live';
  if (status === 'ended') return 'Ended';
  if (status === 'initiated' || status === 'dialing') return 'Dialing';
  if (status === 'stream_failed' || status === 'unknown') return 'Failed';
  return status;
}

const EMPTY_STATS: StatsRecord = { total: 0, inbound: 0, outbound: 0, active: 0 };

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsRecord>(EMPTY_STATS);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);

  useEffect(() => {
    Promise.all([getStats(), getCalls(), getAgents()]).then(([s, c, a]) => {
      setStats(s);
      setCalls(c);
      setAgents(a);
    });
  }, []);

  const endedCalls = calls.filter(c => c.duration_seconds);
  const avgSecs = endedCalls.length
    ? endedCalls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / endedCalls.length
    : null;

  const metrics = [
    { label: 'Total Calls', value: String(stats.total), delta: `${stats.inbound} in · ${stats.outbound} out`, positive: stats.total > 0, icon: Phone, index: 0 },
    { label: 'Active Now', value: String(stats.active), delta: stats.active > 0 ? 'call in progress' : 'no active calls', positive: stats.active > 0, icon: Activity, index: 1 },
    { label: 'Avg Duration', value: formatDuration(avgSecs ? Math.round(avgSecs) : null), delta: `${endedCalls.length} completed`, positive: true, icon: Clock, index: 2 },
    { label: 'Agents', value: String(agents.length), delta: `${agents.length} configured`, positive: agents.length > 0, icon: Bot, index: 3 },
  ];

  const tableRows = calls.slice(0, 20).map(c => ({
    dir: c.direction === 'inbound' ? 'in' as const : 'out' as const,
    number: c.direction === 'inbound' ? (c.from_number ?? '—') : (c.to_number ?? '—'),
    agent: c.agents?.name ?? '—',
    outcome: mapOutcome(c.status),
    dur: formatDuration(c.duration_seconds),
    live: c.status === 'in_progress',
  }));

  const agentRows = agents.map(a => {
    const agentCalls = calls.filter(c => c.agent_id === a.id);
    return {
      name: a.name,
      status: agentCalls.some(c => c.status === 'in_progress') ? 'live' as const : 'idle' as const,
      calls: agentCalls.length,
    };
  });

  return (
    <main className="flex flex-1 flex-col gap-5 p-6 overflow-auto">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>
      <ChartCard data={buildChartData(calls)} />
      <div className="grid grid-cols-2 gap-4">
        <LiveCallPanelClient />
        <AgentsCard agents={agentRows} />
      </div>
      <CallTable calls={tableRows} />
    </main>
  );
}
