'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { Wand2, Loader2 } from 'lucide-react';

export default function GenerateScriptDialog({
  open, onOpenChange, generating, onGenerate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  generating: boolean;
  onGenerate: (topic: string) => void;
}) {
  const [topic, setTopic] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(560px,92vw)] p-6 flex flex-col gap-4">
        <div>
          <DialogTitle>Generate script with AI</DialogTitle>
          <DialogDescription className="mt-1">
            Describe the business and what this agent should handle — AI drafts a full
            script (services, FAQs, required steps) plus suggested extraction fields.
            Any price, address, or number it doesn&apos;t know becomes a placeholder for
            you to fill in.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Describe this agent&apos;s business *</Label>
          <Textarea
            rows={5}
            autoFocus
            placeholder="e.g. A rent-a-car service in Karachi offering self-drive and with-driver options, daily/weekly rental, security deposit required."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="text-[13px] leading-relaxed resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!topic.trim() || generating}
            onClick={() => onGenerate(topic.trim())}
          >
            {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {generating ? 'Generating…' : 'Generate'}
          </Button>
          <DialogClose render={<Button type="button" variant="ghost" size="sm" disabled={generating}>Cancel</Button>} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
