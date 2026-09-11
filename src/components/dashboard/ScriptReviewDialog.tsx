'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';

// Shared before/after review UI for both "Optimize with AI" (rewrites
// existing content) and "Generate with AI" (drafts new content from a
// topic) — same review-then-apply shape either way, just different copy
// and an optional extraction-fields preview for the generate case.
export default function ScriptReviewDialog({
  open, onOpenChange, title, description, originalContent, newContent, extractionFields, onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  originalContent: string;
  newContent: string;
  extractionFields?: string[];
  onApply: (content: string, fields?: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(920px,92vw)] max-h-[85vh] flex flex-col p-0">
        <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <Sparkles className="size-4 text-muted-foreground" />
          </div>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-0.5">{description}</DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-4 overflow-hidden flex-1 min-h-0">
          <div className="flex flex-col gap-1.5 min-h-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0">
              Before
            </p>
            <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/10 p-3">
              {originalContent ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-muted-foreground">
                  {originalContent}
                </pre>
              ) : (
                <p className="text-[12px] text-muted-foreground/50 italic">Empty</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-h-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-chart-1 shrink-0">
              After
            </p>
            <div className="flex-1 overflow-y-auto rounded-lg border border-chart-1/30 bg-[rgba(0,229,160,0.04)] p-3">
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground">
                {newContent}
              </pre>
            </div>
          </div>
        </div>

        {extractionFields && extractionFields.length > 0 && (
          <div className="flex flex-col gap-1.5 px-6 pb-4 shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Suggested extraction fields ({extractionFields.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {extractionFields.map(f => (
                <span key={f} className="inline-flex items-center px-2.5 py-1 rounded-md bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.2)] text-[11px] font-mono text-[#00E5A0]">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { onApply(newContent, extractionFields); onOpenChange(false); }}
          >
            <Sparkles className="size-3.5" />
            Use this version
          </Button>
          <DialogClose render={<Button type="button" variant="ghost" size="sm">Discard</Button>} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
