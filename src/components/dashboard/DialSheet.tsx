'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2, Phone, CheckCircle2, AlertCircle, PhoneOutgoing, Bot, ChevronDown,
} from 'lucide-react';
import { dialOutbound } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AgentRecord } from '@/lib/api';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AgentRecord[];
};

export default function DialSheet({ open, onOpenChange, agents }: Props) {
  const activeAgents = agents.filter(a => a.is_active && a.telnyx_number);

  const [to, setTo] = useState('');
  const [fromAgentId, setFromAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selectedAgent = activeAgents.find(a => a.id === fromAgentId);
  const canDial = !loading && to.trim().length > 4 && !!fromAgentId && activeAgents.length > 0;

  async function handleDial(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !selectedAgent) return;
    setLoading(true);
    setResult(null);
    const res = await dialOutbound(to.trim(), selectedAgent.telnyx_number);
    setLoading(false);
    if (res.ok) {
      setResult({ ok: true, msg: 'Call initiated — it will appear in the call log shortly.' });
      setTo('');
    } else {
      setResult({ ok: false, msg: res.error ?? 'Unknown error' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 gap-0 flex flex-col border-l border-sidebar-border/60 bg-sidebar">

        {/* ── Header ── */}
        <SheetHeader className="px-4 py-4 border-b border-sidebar-border/60 gap-0">
          <div className="flex items-center gap-3">
            {/* Icon — same glow layers as sidebar logo */}
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg">
              <div className="absolute inset-0 rounded-lg bg-chart-1/15 ring-1 ring-chart-1/40" />
              <div className="absolute inset-0 rounded-lg bg-chart-1/8 blur-sm" />
              <PhoneOutgoing className="relative size-[14px] text-chart-1" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
                New Outbound Call
              </SheetTitle>
              <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/60 uppercase">
                Dial · Telnyx
              </span>
            </div>
          </div>
          <SheetDescription className="sr-only">
            Select an agent and enter the destination number to place an outbound call.
          </SheetDescription>
        </SheetHeader>

        {/* ── Body ── */}
        <form
          id="dial-form"
          onSubmit={handleDial}
          className="flex flex-col gap-5 px-4 py-5 flex-1 overflow-y-auto min-h-0"
        >
          {activeAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <div className="relative flex size-10 items-center justify-center rounded-lg">
                <div className="absolute inset-0 rounded-lg bg-muted/40 ring-1 ring-border/60" />
                <Bot className="relative size-4 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-sidebar-foreground">No active agents</p>
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 mt-1 uppercase">
                  Create an agent first
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Agent selector ── */}
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/40 uppercase">
                  From · Agent
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-150',
                          'bg-sidebar-accent/60 ring-1 ring-sidebar-border/60',
                          'hover:bg-sidebar-accent hover:ring-sidebar-border',
                          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-chart-1/50',
                        )}
                      />
                    }
                  >
                    <Bot className={cn(
                      'size-3.5 shrink-0',
                      selectedAgent ? 'text-chart-1' : 'text-muted-foreground/50',
                    )} />
                    <span className={cn(
                      'flex-1 text-[13px] truncate',
                      selectedAgent ? 'text-sidebar-foreground' : 'text-muted-foreground/50',
                    )}>
                      {selectedAgent
                        ? <>{selectedAgent.name} <span className="font-mono text-[11px] text-muted-foreground ml-1">{selectedAgent.telnyx_number}</span></>
                        : 'Select agent…'
                      }
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/40" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start" sideOffset={4}>
                    <DropdownMenuRadioGroup
                      value={fromAgentId}
                      onValueChange={v => { setFromAgentId(v); setResult(null); }}
                    >
                      {activeAgents.map(agent => (
                        <DropdownMenuRadioItem key={agent.id} value={agent.id}>
                          <div className="flex flex-col">
                            <span className="text-[13px]">{agent.name}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{agent.telnyx_number}</span>
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ── Destination number ── */}
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/40 uppercase">
                  To · Customer Number
                </p>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40 pointer-events-none" />
                  <Input
                    id="dial-to"
                    type="tel"
                    placeholder="+923001234567"
                    value={to}
                    onChange={e => { setTo(e.target.value); setResult(null); }}
                    required
                    className="pl-9 font-mono text-[13px]"
                  />
                </div>
                <p className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground/40 uppercase">
                  E.164 format · include country code
                </p>
              </div>

              {/* ── Call preview ── */}
              {selectedAgent && to.trim().length > 2 && (
                <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-3 py-2.5">
                  <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/40 uppercase mb-1.5">
                    Preview
                  </p>
                  <div className="flex items-center gap-2">
                    <PhoneOutgoing className="size-3 text-chart-1 shrink-0" />
                    <span className="font-mono text-[12px] text-chart-1 truncate">
                      {selectedAgent.telnyx_number}
                      <span className="text-muted-foreground/50 mx-1.5">→</span>
                      {to}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Result feedback ── */}
          {result && (
            <div className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3 py-2.5',
              result.ok
                ? 'border-chart-2/25 bg-chart-2/5 text-chart-2'
                : 'border-chart-5/25 bg-chart-5/5 text-chart-5',
            )}>
              {result.ok
                ? <CheckCircle2 className="size-3.5 shrink-0 mt-px" />
                : <AlertCircle className="size-3.5 shrink-0 mt-px" />
              }
              <span className="text-[12px] leading-relaxed">{result.msg}</span>
            </div>
          )}
        </form>

        {/* ── Footer ── */}
        <SheetFooter className="px-4 py-3 border-t border-sidebar-border/60 flex-row gap-2">
          <Button
            type="submit"
            form="dial-form"
            size="sm"
            disabled={!canDial}
            className={cn(
              'flex-1 gap-2 font-medium transition-colors',
              canDial
                ? 'bg-chart-1/10 border border-chart-1/35 text-chart-1 hover:bg-chart-1/15 hover:border-chart-1/50 shadow-none'
                : '',
            )}
            variant="outline"
          >
            {loading
              ? <Loader2 className="size-3.5 animate-spin" />
              : <PhoneOutgoing className="size-3.5" />
            }
            {loading ? 'Dialing…' : 'Dial Now'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
