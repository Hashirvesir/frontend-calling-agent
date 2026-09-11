'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Loader2, ChevronDown, Bot, Phone, Mic2 } from 'lucide-react';
import { getScripts, createAgentApi, getTtsConfig } from '@/lib/api';
import type { ScriptRecord, TtsProvider } from '@/lib/api';
import AgentVoicePicker from '@/components/dashboard/AgentVoicePicker';
import { toast } from 'sonner';

export default function AgentCreatePage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // New agents always start out inheriting the account's TTS provider (no
  // per-agent override exists until this agent is created) — used only to
  // show the right voice list while picking voice_urdu/voice_english below.
  const [ttsProvider, setTtsProvider] = useState<TtsProvider | null>(null);

  const [form, setForm] = useState({
    name: '',
    telnyx_number: '',
    telnyx_app_id: '',
    script_id: '',
    system_prompt_override: '',
    voice_urdu: 'v_8eelc901',
    voice_english: 'v_8eelc901',
    default_language: 'ur',
    greeting_text: '',
  });

  useEffect(() => {
    getScripts().then(setScripts);
    getTtsConfig().then(cfg => setTtsProvider(cfg?.provider ?? null));
  }, []);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.telnyx_number.trim()) { setError('Telnyx number is required.'); return; }
    setError('');
    setLoading(true);
    const result = await createAgentApi({
      name: form.name.trim(),
      telnyx_number: form.telnyx_number.trim(),
      telnyx_app_id: form.telnyx_app_id.trim() || null,
      script_id: form.script_id || null,
      system_prompt_override: form.system_prompt_override.trim() || null,
      voice_urdu: form.voice_urdu,
      voice_english: form.voice_english,
      default_language: form.default_language,
      greeting_text: form.greeting_text.trim() || null,
    });
    setLoading(false);
    if (result) {
      toast.success('Agent created successfully');
      router.push('/dashboard/agents');
    } else {
      toast.error('Failed to create agent');
      setError('Failed to create agent. Check the API and try again.');
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard/agents')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Bot className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Agent</h1>
          <p className="text-sm text-muted-foreground">Configure a new AI call agent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 2-col grid */}
        <div className="grid grid-cols-2 gap-5 items-start">

          {/* LEFT — identity + number */}
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="size-3.5 text-muted-foreground" />
                  Identity
                </CardTitle>
                <CardDescription>Agent name and Telnyx credentials</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Agent Name *</Label>
                  <Input id="name" placeholder="e.g. Hassan - Restaurant Agent" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="number" className="text-xs text-muted-foreground">Telnyx Number *</Label>
                  <Input id="number" placeholder="+12029196011" value={form.telnyx_number} onChange={e => set('telnyx_number', e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">E.164 format — must match your Telnyx number exactly</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="app_id" className="text-xs text-muted-foreground">
                    Telnyx App ID <span className="text-muted-foreground/50 font-normal">(optional)</span>
                  </Label>
                  <Input id="app_id" placeholder="29277952-..." value={form.telnyx_app_id} onChange={e => set('telnyx_app_id', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Voice & Language */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mic2 className="size-3.5 text-muted-foreground" />
                  Voice & Language
                </CardTitle>
                <CardDescription>Default language and voice for this agent</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-5">
                {/* Default language */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">Default Language</Label>
                  <div className="flex gap-2">
                    {([{ id: 'ur', label: 'Urdu' }, { id: 'en', label: 'English' }]).map(lang => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => set('default_language', lang.id)}
                        className="flex-1 rounded-lg border py-2 text-sm font-medium transition-all"
                        style={{
                          borderColor: form.default_language === lang.id ? 'var(--chart-1)' : 'var(--border)',
                          background: form.default_language === lang.id ? 'rgba(0,229,160,0.08)' : 'transparent',
                          color: form.default_language === lang.id ? 'var(--chart-1)' : 'var(--fg-2)',
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
                <AgentVoicePicker
                  provider={ttsProvider}
                  language={form.default_language}
                  voiceUrdu={form.voice_urdu}
                  voiceEnglish={form.voice_english}
                  onChange={(field, value) => set(field, value)}
                />
                {/* Greeting message */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="greeting" className="text-xs text-muted-foreground">
                    Greeting Message <span className="text-muted-foreground/50 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="greeting"
                    placeholder="Leave empty to use the default greeting…"
                    rows={3}
                    value={form.greeting_text}
                    onChange={e => set('greeting_text', e.target.value)}
                    className="text-[13px] leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    What the agent says first on every inbound call — pre-synthesized at startup so it plays instantly
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — script + prompt */}
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Script & Prompt
                </CardTitle>
                <CardDescription>Assign a script for RAG-based answers</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Script <span className="text-muted-foreground/50 font-normal">(optional)</span>
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button type="button" className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-[13px] text-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      }
                    >
                      <span className="flex-1 text-left truncate">
                        {scripts.find(s => s.id === form.script_id)?.name ?? <span className="text-muted-foreground">No script</span>}
                      </span>
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup value={form.script_id} onValueChange={v => set('script_id', v)}>
                        <DropdownMenuRadioItem value="">No script</DropdownMenuRadioItem>
                        {scripts.map(s => (
                          <DropdownMenuRadioItem key={s.id} value={s.id}>{s.name}</DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prompt" className="text-xs text-muted-foreground">
                    System Prompt Override <span className="text-muted-foreground/50 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Leave empty to use the default system prompt…"
                    rows={14}
                    value={form.system_prompt_override}
                    onChange={e => set('system_prompt_override', e.target.value)}
                    className="font-mono text-[12px] leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">Overrides the default agent prompt when set</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <Button type="submit" size="sm" disabled={loading} className="gap-2">
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Create Agent
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard/agents')}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
