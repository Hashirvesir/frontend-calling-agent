'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { getTtsVoices } from '@/lib/api';
import type { TtsProvider, TtsVoice } from '@/lib/api';

// Voice selection only has an effect for whichever TTS provider is actually
// resolved for this agent (account default, or this agent's own override —
// see the Model Config page's Voice (TTS) tab) — a value that isn't a real
// voice_id for that provider gets silently ignored on live calls (falls back
// to the system default). `provider` is passed in by the caller (the
// resolved provider), not fetched here, so this component works correctly
// whether the caller is showing the account default or an agent override.
export default function AgentVoicePicker({
  provider, language, voiceUrdu, voiceEnglish, onChange,
}: {
  provider: TtsProvider | null;
  language: string;
  voiceUrdu: string;
  voiceEnglish: string;
  onChange: (field: 'voice_urdu' | 'voice_english', value: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<TtsVoice[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getTtsVoices();
      if (cancelled) return;
      setVoices(provider ? (list?.providers[provider] ?? null) : null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [provider]);

  const field = language === 'en' ? 'voice_english' : 'voice_urdu';
  const value = language === 'en' ? voiceEnglish : voiceUrdu;
  const langLabel = language === 'en' ? 'English' : 'Urdu';

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">{langLabel} Voice</Label>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading voices…
        </div>
      </div>
    );
  }

  if (!provider || voices === null) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">{langLabel} Voice</Label>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span>
            {provider === 'elevenlabs'
              ? 'ElevenLabs voices unavailable — check the backend ELEVENLABS_API_KEY.'
              : provider === 'uplift'
                ? 'UpliftAI voices unavailable — check the backend UPLIFT_API_KEY.'
                : 'Could not load your TTS provider (Settings → Voice Engine) — voice selection is unavailable.'}
          </span>
        </div>
      </div>
    );
  }

  if (provider === 'uplift') {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">{langLabel} Voice</Label>
        <div className="grid grid-cols-2 gap-2">
          {voices.map(v => {
            const active = value === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange(field, v.id)}
                className="flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-all"
                style={{
                  borderColor: active ? 'var(--chart-1)' : 'var(--border)',
                  background: active ? 'rgba(0,229,160,0.06)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{v.name}</span>
                  {active && <Check className="size-3 text-chart-1" strokeWidth={3} />}
                </div>
                <span className="text-[11px] text-muted-foreground">{v.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ElevenLabs — account-specific voice library, shown as a searchable-feeling
  // dropdown list rather than a grid (can easily be 20+ voices).
  const selected = voices.find(v => v.id === value);
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">{langLabel} Voice</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-[13px] text-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          }
        >
          <span className="flex-1 text-left truncate">
            {selected ? selected.name : <span className="text-muted-foreground">Select a voice…</span>}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72">
          <DropdownMenuRadioGroup value={value} onValueChange={v => onChange(field, v)}>
            {voices.map(v => (
              <DropdownMenuRadioItem key={v.id} value={v.id}>
                {v.name}
                {v.description && <span className="text-muted-foreground/60"> — {v.description}</span>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {!selected && value && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Current value doesn&apos;t match a real ElevenLabs voice — pick one above so this agent&apos;s
          voice selection actually takes effect on calls.
        </p>
      )}
    </div>
  );
}
