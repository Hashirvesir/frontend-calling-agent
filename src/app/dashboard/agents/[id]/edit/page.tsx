'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
import { ArrowLeft, Loader2, ChevronDown, Bot, Phone, Mic2, SlidersHorizontal } from 'lucide-react';
import { getAgentById, getScripts, updateAgentApi } from '@/lib/api';
import type { ScriptRecord } from '@/lib/api';
import { toast } from 'sonner';

export default function AgentEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

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
    is_active: true,
  });

  useEffect(() => {
    Promise.all([getAgentById(id), getScripts()]).then(([agent, scriptList]) => {
      if (agent) {
        setForm({
          name: agent.name,
          telnyx_number: agent.telnyx_number,
          telnyx_app_id: agent.telnyx_app_id ?? '',
          script_id: agent.script_id ?? '',
          system_prompt_override: agent.system_prompt_override ?? '',
          voice_urdu: agent.voice_urdu,
          voice_english: agent.voice_english,
          default_language: agent.default_language ?? 'ur',
          greeting_text: agent.greeting_text ?? '',
          is_active: agent.is_active,
        });
      }
      setScripts(scriptList);
      setFetching(false);
    });
  }, [id]);

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setError('');
    setLoading(true);
    const result = await updateAgentApi(id, {
      name: form.name.trim(),
      telnyx_number: form.telnyx_number.trim(),
      telnyx_app_id: form.telnyx_app_id.trim() || null,
      script_id: form.script_id || null,
      system_prompt_override: form.system_prompt_override.trim() || null,
      voice_urdu: form.voice_urdu,
      voice_english: form.voice_english,
      default_language: form.default_language,
      greeting_text: form.greeting_text.trim() || null,
      is_active: form.is_active,
    });
    setLoading(false);
    if (result) {
      toast.success('Agent updated successfully');
      router.push('/dashboard/agents');
    } else {
      toast.error('Failed to update agent');
      setError('Failed to update agent.');
    }
  }

  if (fetching) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
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
          <h1 className="text-xl font-semibold text-foreground">Edit Agent</h1>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 2-col grid */}
        <div className="grid grid-cols-2 gap-5 items-start">

          {/* LEFT */}
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
                  <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="number" className="text-xs text-muted-foreground">Telnyx Number *</Label>
                  <Input id="number" value={form.telnyx_number} onChange={e => set('telnyx_number', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="app_id" className="text-xs text-muted-foreground">
                    Telnyx App ID <span className="text-muted-foreground/50 font-normal">(optional)</span>
                  </Label>
                  <Input id="app_id" value={form.telnyx_app_id} onChange={e => set('telnyx_app_id', e.target.value)} />
                </div>
                {/* Active toggle */}
                <div
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer"
                  onClick={() => set('is_active', !form.is_active)}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Agent will accept and handle calls</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_active}
                    onClick={e => { e.stopPropagation(); set('is_active', !form.is_active); }}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none"
                    style={{ background: form.is_active ? 'var(--chart-1)' : 'var(--border)' }}
                  >
                    <span
                      className="pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform duration-200"
                      style={{ background: 'var(--fg-0)', transform: form.is_active ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
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
                <CardDescription>Default language for this agent</CardDescription>
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
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
                  <SlidersHorizontal className="size-3.5 shrink-0 mt-0.5" />
                  <span>
                    Voice selection moved to{' '}
                    <Link href={`/dashboard/agents/${id}/model`} className="text-foreground underline underline-offset-2">
                      Model Config
                    </Link>{' '}
                    — set it there alongside this agent&apos;s TTS provider.
                  </span>
                </div>
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

          {/* RIGHT */}
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
                  <Label className="text-xs text-muted-foreground">Script</Label>
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
                    rows={16}
                    value={form.system_prompt_override}
                    onChange={e => set('system_prompt_override', e.target.value)}
                    className="font-mono text-[12px] leading-relaxed resize-none"
                  />
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
            Save Changes
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard/agents')}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
