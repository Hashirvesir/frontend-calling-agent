"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Pencil,
  PhoneIncoming,
  PhoneOutgoing,
  Bot,
  PhoneMissed,
  FlaskConical,
} from "lucide-react";
import { getAgentById, getCalls } from "@/lib/api";
import type { AgentRecord, CallRecord } from "@/lib/api";
import { cn } from "@/lib/utils";
import AgentTabs from "@/components/dashboard/AgentTabs";

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }
  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function formatDuration(secs: number | null): string {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string): string {
  if (status === "in_progress") return "Live";
  if (status === "ended") return "Ended";
  if (status === "dialing") return "Dialing";
  if (status === "stream_failed") return "Failed";
  return status;
}

function statusCls(status: string): string {
  if (status === "in_progress") return "border-chart-1/40 text-chart-1";
  if (status === "ended") return "border-chart-2/40 text-chart-2";
  if (status === "dialing") return "border-chart-3/40 text-chart-3";
  if (status === "stream_failed") return "border-chart-5/40 text-chart-5";
  return "";
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agent, setAgent] = useState<AgentRecord | null | undefined>(undefined);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    Promise.all([getAgentById(id), getCalls()]).then(([a, allCalls]) => {
      setAgent(a);
      setCalls(allCalls.filter((c) => c.agent_id === id));
      setLoading(false);
    });
  }, [id]);

  const totalPages = Math.max(1, Math.ceil(calls.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCalls = calls.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
        <Bot className="size-8 opacity-30" />
        <p className="text-sm">Agent not found.</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/agents")}
        >
          Back to Agents
        </Button>
      </main>
    );
  }

  const liveCount = calls.filter((c) => c.status === "in_progress").length;
  const inboundCount = calls.filter((c) => c.direction === "inbound").length;
  const outboundCount = calls.filter((c) => c.direction === "outbound").length;
  const ended = calls.filter((c) => c.duration_seconds);
  const avgSecs = ended.length
    ? ended.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / ended.length
    : null;

  const metrics = [
    { label: "Total Calls", value: String(calls.length) },
    { label: "Inbound", value: String(inboundCount) },
    { label: "Outbound", value: String(outboundCount) },
    { label: "Live Now", value: String(liveCount) },
    {
      label: "Avg Duration",
      value: formatDuration(avgSecs ? Math.round(avgSecs) : null),
    },
  ];

  const agentInfo = [
    { label: "Telnyx Number", value: agent.telnyx_number },
    { label: "App ID", value: agent.telnyx_app_id ?? "—" },
    {
      label: "Script",
      value:
        (agent.scripts as { name: string } | null | undefined)?.name ?? "—",
    },
    { label: "Status", value: agent.is_active ? "Active" : "Inactive" },
    { label: "Voice (Urdu)", value: agent.voice_urdu },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/dashboard/agents")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                {agent.name}
              </h1>
              <Badge
                variant="outline"
                className={
                  agent.is_active
                    ? "border-chart-2/40 text-chart-2"
                    : "text-muted-foreground"
                }
              >
                {agent.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground mt-0.5">
              {agent.telnyx_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/dashboard/agents/${id}/test`)}
          >
            <FlaskConical className="size-3.5" />
            Test Agent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(`/dashboard/agents/${id}/edit`)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <AgentTabs agentId={id} />

      {/* Metric cards */}
      <div className="grid grid-cols-5 mt-5 gap-4">
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

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>Agent settings and voice IDs</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {agentInfo.map(({ label, value }) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </dt>
                <dd
                  className="mt-0.5 font-mono text-[12px] text-foreground truncate"
                  title={value}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Call History</span>
            <span className="font-mono text-[11px] text-muted-foreground font-normal">
              {calls.length} call{calls.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
              <PhoneMissed className="size-5 opacity-30" />
              <p className="text-sm">No calls for this agent yet.</p>
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
                      Status
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Duration
                    </TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground pr-4">
                      Started
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCalls.map((call) => {
                    const number =
                      call.direction === "inbound"
                        ? call.from_number
                        : call.to_number;
                    return (
                      <TableRow
                        key={call.id}
                        className={cn(
                          "border-border cursor-pointer transition-colors",
                          call.status === "in_progress" && "row-live",
                        )}
                        onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                      >
                        <TableCell className="pl-4">
                          {call.direction === "inbound" ? (
                            <PhoneIncoming className="size-3.5 text-chart-2/70" />
                          ) : (
                            <PhoneOutgoing className="size-3.5 text-chart-4/70" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] text-foreground">
                              {number ?? "—"}
                            </span>
                            {call.status === "in_progress" && (
                              <span
                                className="pill live"
                                style={{ height: "18px", fontSize: "10px" }}
                              >
                                <span className="dot" />
                                LIVE
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[11px]",
                              statusCls(call.status),
                            )}
                          >
                            {statusLabel(call.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] tabular-nums text-muted-foreground">
                          {formatDuration(call.duration_seconds)}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground pr-4">
                          {formatDate(call.started_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {calls.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-4 py-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–<span className="font-medium text-foreground">{Math.min(startIndex + pageSize, calls.length)}</span> of{" "}
                      <span className="font-medium text-foreground">{calls.length}</span> calls
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[11px]">Rows:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                          if (v) {
                            setPageSize(Number(v));
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <SelectTrigger size="sm" className="h-7 w-[68px] text-xs font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top" align="start">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
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
                            {p === "ellipsis" ? (
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
    </main>
  );
}
