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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bot, TableProperties, FlaskConical, Pencil } from "lucide-react";
import { getAgentById, getAgentExtractionData } from "@/lib/api";
import type { AgentRecord, AgentExtractionData } from "@/lib/api";
import AgentTabs from "@/components/dashboard/AgentTabs";
import ExtractionGrid from "@/components/dashboard/ExtractionGrid";

export default function AgentExtractionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<AgentRecord | null | undefined>(undefined);
  const [extraction, setExtraction] = useState<AgentExtractionData>({
    extraction_columns: [],
    rows: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAgentById(id), getAgentExtractionData(id)]).then(
      ([a, ext]) => {
        setAgent(a);
        setExtraction(ext);
        setLoading(false);
      },
    );
  }, [id]);

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[500px] rounded-xl" />
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

  const hasSchema = extraction.extraction_columns.length > 0;

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
                className={agent.is_active ? "border-chart-2/40 text-chart-2" : "text-muted-foreground"}
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

      {/* Stats bar */}
      <div className="flex items-center mt-5 gap-6 text-[12px] text-muted-foreground font-mono">
        <span>
          <span className="text-foreground font-semibold">
            {extraction.rows.length}
          </span>{" "}
          records
        </span>
        <span>
          <span className="text-foreground font-semibold">
            {extraction.extraction_columns.length}
          </span>{" "}
          fields
        </span>
        {hasSchema && (
          <span>
            <span className="text-[#00E5A0] font-semibold">
              {extraction.rows.filter((r) => r.confidence === "high").length}
            </span>{" "}
            high confidence
          </span>
        )}
      </div>

      {/* Grid card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TableProperties className="size-4 text-muted-foreground" />
            Extracted Data
          </CardTitle>
          <CardDescription>
            {hasSchema
              ? `${extraction.extraction_columns.length} fields extracted from call transcripts`
              : "No extraction fields defined — edit the agent's script to add fields"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractionGrid
            extractionColumns={extraction.extraction_columns}
            rows={extraction.rows}
          />
        </CardContent>
      </Card>
    </main>
  );
}
