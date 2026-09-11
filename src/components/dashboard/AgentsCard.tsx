import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentRow = {
  name: string;
  status: 'live' | 'idle';
  calls: number;
};

export default function AgentsCard({ agents }: { agents: AgentRow[] }) {
  const liveCount = agents.filter(a => a.status === 'live').length;

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 pb-6 text-muted-foreground">
          <Bot className="size-5 opacity-30" />
          <span className="text-sm">No agents configured.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Agents</span>
          <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">
            {liveCount > 0 ? `${liveCount} live · ` : ''}{agents.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {agents.map(agent => (
          <div
            key={agent.name}
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2 transition-colors',
              agent.status === 'live'
                ? 'bg-chart-1/5 ring-1 ring-chart-1/20'
                : 'bg-muted/30 hover:bg-muted/50'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'pill',
                  agent.status === 'live' && 'live'
                )}
                style={{ height: '20px', fontSize: '10px' }}
              >
                <span className="dot" />
                {agent.status}
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {agent.name}
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {agent.calls} calls
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
