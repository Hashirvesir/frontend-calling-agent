'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Bot, FlaskConical } from 'lucide-react';
import { getAgents, deleteAgentApi } from '@/lib/api';
import type { AgentRecord } from '@/lib/api';
import { toast } from 'sonner';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgents().then(data => { setAgents(data); setLoading(false); });
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    const ok = await deleteAgentApi(id);
    if (ok) {
      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success(`Agent "${name}" deleted`);
    } else {
      toast.error('Failed to delete agent');
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your AI call agents</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => router.push('/dashboard/agents/create')}>
          <Plus className="size-3.5" />
          New Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-muted-foreground" />
            All Agents
          </CardTitle>
          <CardDescription>{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : agents.length === 0 ? (
            <div className="py-12 text-center">
              <Bot className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No agents yet.</p>
              <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={() => router.push('/dashboard/agents/create')}>
                <Plus className="size-3.5" /> Create your first agent
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Number</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Script</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Voice (Urdu)</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="pr-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.id} className="border-border">
                    <TableCell className="pl-6">
                      <button
                        className="font-medium text-foreground text-[13px] hover:text-chart-1 transition-colors text-left"
                        onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                      >
                        {agent.name}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">{agent.telnyx_number}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {(agent.scripts as { name: string } | null | undefined)?.name ?? <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{agent.voice_urdu}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={agent.is_active ? 'border-chart-2/40 text-chart-2' : 'text-muted-foreground'}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" title="Test Agent" onClick={() => router.push(`/dashboard/agents/${agent.id}/test`)}>
                          <FlaskConical className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/dashboard/agents/${agent.id}/edit`)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(agent.id, agent.name)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
