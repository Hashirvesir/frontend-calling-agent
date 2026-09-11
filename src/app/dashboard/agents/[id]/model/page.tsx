'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Bot, Cpu, Mic, AudioLines, Radio, Save, Loader2, RotateCcw, Thermometer, Gauge, Timer,
  Pencil, FlaskConical,
} from 'lucide-react';
import {
  getAgentById,
  getAgentPipelineConfig, setAgentPipelineConfig,
  getAgentLlmConfig, setAgentLlmConfig, getLlmModels,
  getAgentSttConfig, setAgentSttConfig, getSttModels,
  getAgentTtsConfig, setAgentTtsConfig, getTtsModels,
} from '@/lib/api';
import type {
  AgentRecord,
  AgentPipelineConfig, PipelineMode, RealtimeProvider,
  AgentLlmConfig, LlmModels, LlmProvider,
  AgentSttConfig, SttModels, SttProvider,
  AgentTtsConfig, TtsModels, TtsProvider,
} from '@/lib/api';
import AgentTabs from '@/components/dashboard/AgentTabs';
import AgentVoicePicker from '@/components/dashboard/AgentVoicePicker';
import { toast } from 'sonner';

// Sentinel for the "Use account default" option — Select values must be
// strings, so `null` (the API's own "revert to default" sentinel) is
// represented as this string in the UI and mapped back to null on save.
const DEFAULT_SENTINEL = '__default__';

// Slider ranges — mirror the backend's MIN_*/MAX_* constants in
// app/core/{llm,tts,stt}_config.py. Fallback values seed the slider the
// first time an override is turned on when no value exists anywhere yet.
const MIN_TEMPERATURE = 0.0;
const MAX_TEMPERATURE = 2.0;
const FALLBACK_TEMPERATURE = 0.7;

const MIN_SPEED = 0.7;
const MAX_SPEED = 1.2;
const FALLBACK_SPEED = 1.0;

const MIN_ENDPOINTING_MS = 300;
const MAX_ENDPOINTING_MS = 2500;
const FALLBACK_ENDPOINTING_MS = 1000;

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  groq: 'Groq', cerebras: 'Cerebras', together: 'Together AI',
};
const STT_PROVIDER_LABELS: Record<SttProvider, string> = {
  groq: 'Groq Whisper', deepgram: 'Deepgram', together: 'Together AI',
};
const TTS_PROVIDER_LABELS: Record<TtsProvider, string> = {
  elevenlabs: 'ElevenLabs', uplift: 'UpliftAI',
};

const SIDEBAR_TABS = [
  { key: 'pipeline', label: 'Pipeline Mode', icon: Radio },
  { key: 'llm', label: 'Model (LLM)', icon: Cpu },
  { key: 'stt', label: 'Speech recognition (STT)', icon: Mic },
  { key: 'tts', label: 'Voice (TTS)', icon: AudioLines },
] as const;
type SidebarTab = (typeof SIDEBAR_TABS)[number]['key'];

export default function AgentModelConfigPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<AgentRecord | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('pipeline');

  const [pipelineConfig, setPipelineConfigState] = useState<AgentPipelineConfig | null>(null);
  const [pipelineModeSelection, setPipelineModeSelection] = useState('');
  const [pipelineVoiceSelection, setPipelineVoiceSelection] = useState('');
  const [savingPipeline, setSavingPipeline] = useState(false);

  const [llmConfig, setLlmConfigState] = useState<AgentLlmConfig | null>(null);
  const [llmModels, setLlmModels] = useState<LlmModels | null>(null);
  const [loadingLlmModels, setLoadingLlmModels] = useState(false);
  const [llmSelection, setLlmSelection] = useState('');
  const [savingLlm, setSavingLlm] = useState(false);
  const [llmTempOverride, setLlmTempOverride] = useState(false);
  const [llmTempValue, setLlmTempValue] = useState(FALLBACK_TEMPERATURE);

  const [sttConfig, setSttConfigState] = useState<AgentSttConfig | null>(null);
  const [sttModels, setSttModels] = useState<SttModels | null>(null);
  const [loadingSttModels, setLoadingSttModels] = useState(false);
  const [sttProviderSelection, setSttProviderSelection] = useState('');
  const [sttModelSelection, setSttModelSelection] = useState('');
  const [savingStt, setSavingStt] = useState(false);
  const [sttEndpointingOverride, setSttEndpointingOverride] = useState(false);
  const [sttEndpointingValue, setSttEndpointingValue] = useState(FALLBACK_ENDPOINTING_MS);

  const [ttsConfig, setTtsConfigState] = useState<AgentTtsConfig | null>(null);
  const [ttsModels, setTtsModels] = useState<TtsModels | null>(null);
  const [loadingTtsModels, setLoadingTtsModels] = useState(false);
  const [ttsProviderSelection, setTtsProviderSelection] = useState('');
  const [ttsModelSelection, setTtsModelSelection] = useState('');
  const [savingTts, setSavingTts] = useState(false);
  const [ttsSpeedOverride, setTtsSpeedOverride] = useState(false);
  const [ttsSpeedValue, setTtsSpeedValue] = useState(FALLBACK_SPEED);

  // Just this agent's current selections — fast (plain DB reads). Each
  // provider's live model LIST is fetched separately, lazily, only once its
  // tab is actually opened (see the effect below) — those listing calls
  // probe real provider APIs (Together does a live per-model call, ElevenLabs
  // opens a websocket per model) and can take several seconds, so eagerly
  // fetching all three up front made this whole page slow to open even when
  // the user only wants to look at, say, Pipeline Mode.
  useEffect(() => {
    Promise.all([
      getAgentById(id),
      getAgentPipelineConfig(id).then(c => {
        if (c) {
          setPipelineConfigState(c);
          setPipelineModeSelection(c.is_override ? c.mode : DEFAULT_SENTINEL);
          setPipelineVoiceSelection(c.voice);
        }
      }),
      getAgentLlmConfig(id).then(c => {
        if (c) {
          setLlmConfigState(c);
          setLlmSelection(c.is_override ? `${c.provider}::${c.model}` : DEFAULT_SENTINEL);
          setLlmTempOverride(c.temperature_is_override);
          setLlmTempValue(c.temperature ?? c.account_default.temperature ?? FALLBACK_TEMPERATURE);
        }
      }),
      getAgentSttConfig(id).then(c => {
        if (c) {
          setSttConfigState(c);
          setSttProviderSelection(c.is_override ? c.provider : DEFAULT_SENTINEL);
          setSttModelSelection(c.model);
          setSttEndpointingOverride(c.endpointing_is_override);
          setSttEndpointingValue(c.endpointing_ms);
        }
      }),
      getAgentTtsConfig(id).then(c => {
        if (c) {
          setTtsConfigState(c);
          setTtsProviderSelection(c.is_override ? c.provider : DEFAULT_SENTINEL);
          setTtsModelSelection(c.model);
          setTtsSpeedOverride(c.speed_is_override);
          setTtsSpeedValue(c.speed);
        }
      }),
    ]).then(([a]) => { setAgent(a); setLoading(false); });
  }, [id]);

  async function loadLlmModels() {
    setLoadingLlmModels(true);
    const m = await getLlmModels();
    if (m) setLlmModels(m);
    setLoadingLlmModels(false);
  }
  async function loadSttModels() {
    setLoadingSttModels(true);
    const m = await getSttModels();
    if (m) setSttModels(m);
    setLoadingSttModels(false);
  }
  async function loadTtsModels() {
    setLoadingTtsModels(true);
    const m = await getTtsModels();
    if (m) setTtsModels(m);
    setLoadingTtsModels(false);
  }

  useEffect(() => {
    // Deferred to a microtask so the loading-flag update below doesn't
    // happen synchronously within the effect body itself.
    if (activeTab === 'llm' && llmModels === null && !loadingLlmModels) {
      Promise.resolve().then(loadLlmModels);
    } else if (activeTab === 'stt' && sttModels === null && !loadingSttModels) {
      Promise.resolve().then(loadSttModels);
    } else if (activeTab === 'tts' && ttsModels === null && !loadingTtsModels) {
      Promise.resolve().then(loadTtsModels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // The resolved mode — whichever mode this agent will actually run under
  // once the current selection is saved — gates the other 3 tabs, same
  // relationship as the account Settings page's isRealtimeSelected.
  const resolvedMode = pipelineModeSelection === DEFAULT_SENTINEL
    ? (pipelineConfig?.account_default.mode ?? 'cascaded')
    : (pipelineModeSelection as PipelineMode);
  const isRealtimeSelected = resolvedMode !== 'cascaded';

  async function handleSavePipeline() {
    setSavingPipeline(true);
    const mode = pipelineModeSelection === DEFAULT_SENTINEL ? null : (pipelineModeSelection as PipelineMode);
    const voice = mode && mode !== 'cascaded' ? pipelineVoiceSelection : null;
    const res = await setAgentPipelineConfig(id, mode, voice);
    setSavingPipeline(false);
    if (res.ok) {
      toast.success(mode ? `Pipeline mode set to ${pipelineConfig?.labels[mode] ?? mode}` : 'Reverted to account default');
      const fresh = await getAgentPipelineConfig(id);
      if (fresh) {
        setPipelineConfigState(fresh);
        setPipelineModeSelection(fresh.is_override ? fresh.mode : DEFAULT_SENTINEL);
        setPipelineVoiceSelection(fresh.voice);
      }
    } else {
      toast.error(res.error ?? 'Failed to save pipeline mode');
    }
  }

  async function handleSaveLlm() {
    setSavingLlm(true);
    const temperature = llmTempOverride ? llmTempValue : null;
    let res;
    if (llmSelection === DEFAULT_SENTINEL) {
      res = await setAgentLlmConfig(id, null, null, temperature);
    } else {
      const [provider, model] = llmSelection.split('::') as [LlmProvider, string];
      res = await setAgentLlmConfig(id, provider, model, temperature);
    }
    setSavingLlm(false);
    if (res.ok) {
      toast.success(llmSelection === DEFAULT_SENTINEL ? 'Reverted to account default' : 'AI model updated');
      const fresh = await getAgentLlmConfig(id);
      if (fresh) {
        setLlmConfigState(fresh);
        setLlmSelection(fresh.is_override ? `${fresh.provider}::${fresh.model}` : DEFAULT_SENTINEL);
        setLlmTempOverride(fresh.temperature_is_override);
        setLlmTempValue(fresh.temperature ?? fresh.account_default.temperature ?? FALLBACK_TEMPERATURE);
      }
    } else {
      toast.error(res.error ?? 'Failed to save AI model');
    }
  }

  async function handleSaveStt() {
    setSavingStt(true);
    const endpointingMs = sttEndpointingOverride ? sttEndpointingValue : null;
    const res = sttProviderSelection === DEFAULT_SENTINEL
      ? await setAgentSttConfig(id, null, null, endpointingMs)
      : await setAgentSttConfig(id, sttProviderSelection as SttProvider, sttModelSelection || undefined, endpointingMs);
    setSavingStt(false);
    if (res.ok) {
      toast.success(sttProviderSelection === DEFAULT_SENTINEL ? 'Reverted to account default' : 'STT engine updated');
      const fresh = await getAgentSttConfig(id);
      if (fresh) {
        setSttConfigState(fresh);
        setSttProviderSelection(fresh.is_override ? fresh.provider : DEFAULT_SENTINEL);
        setSttModelSelection(fresh.model);
        setSttEndpointingOverride(fresh.endpointing_is_override);
        setSttEndpointingValue(fresh.endpointing_ms);
      }
    } else {
      toast.error(res.error ?? 'Failed to save STT engine');
    }
  }

  async function handleSaveTts() {
    setSavingTts(true);
    const speed = ttsSpeedOverride ? ttsSpeedValue : null;
    const res = ttsProviderSelection === DEFAULT_SENTINEL
      ? await setAgentTtsConfig(id, null, null, speed)
      : await setAgentTtsConfig(id, ttsProviderSelection as TtsProvider, ttsModelSelection, speed);
    setSavingTts(false);
    if (res.ok) {
      toast.success(ttsProviderSelection === DEFAULT_SENTINEL ? 'Reverted to account default' : 'Voice engine updated');
      const fresh = await getAgentTtsConfig(id);
      if (fresh) {
        setTtsConfigState(fresh);
        setTtsProviderSelection(fresh.is_override ? fresh.provider : DEFAULT_SENTINEL);
        setTtsModelSelection(fresh.model);
        setTtsSpeedOverride(fresh.speed_is_override);
        setTtsSpeedValue(fresh.speed);
      }
    } else {
      toast.error(res.error ?? 'Failed to save voice engine');
    }
  }

  async function handleVoicePickerChange(field: 'voice_urdu' | 'voice_english', value: string) {
    if (!agent) return;
    const { updateAgentApi } = await import('@/lib/api');
    const updated = await updateAgentApi(id, { [field]: value });
    if (updated) {
      setAgent(updated);
      toast.success('Voice updated');
    } else {
      toast.error('Failed to update voice');
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex mt-10 items-center gap-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
        <Bot className="size-8 opacity-30" />
        <p className="text-sm">Agent not found.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/agents')}>
          Back to Agents
        </Button>
      </main>
    );
  }

  const llmDirty = llmSelection !== '' && llmConfig !== null
    && (llmSelection !== (llmConfig.is_override ? `${llmConfig.provider}::${llmConfig.model}` : DEFAULT_SENTINEL)
      || llmTempOverride !== llmConfig.temperature_is_override
      || (llmTempOverride && llmTempValue !== llmConfig.temperature));
  const sttDirty = sttConfig !== null && sttProviderSelection !== ''
    && (sttProviderSelection !== (sttConfig.is_override ? sttConfig.provider : DEFAULT_SENTINEL)
      || sttModelSelection !== sttConfig.model
      || sttEndpointingOverride !== sttConfig.endpointing_is_override
      || (sttEndpointingOverride && sttEndpointingValue !== sttConfig.endpointing_ms));
  const ttsDirty = ttsConfig !== null && ttsProviderSelection !== ''
    && (ttsProviderSelection !== (ttsConfig.is_override ? ttsConfig.provider : DEFAULT_SENTINEL)
      || ttsModelSelection !== ttsConfig.model
      || ttsSpeedOverride !== ttsConfig.speed_is_override
      || (ttsSpeedOverride && ttsSpeedValue !== ttsConfig.speed));
  const pipelineDirty = pipelineConfig !== null && pipelineModeSelection !== ''
    && (pipelineModeSelection !== (pipelineConfig.is_override ? pipelineConfig.mode : DEFAULT_SENTINEL)
      || (pipelineModeSelection !== 'cascaded' && pipelineModeSelection !== DEFAULT_SENTINEL
        && pipelineVoiceSelection !== pipelineConfig.voice));

  const resolvedTtsProvider = ttsProviderSelection === DEFAULT_SENTINEL || ttsProviderSelection === ''
    ? (ttsConfig?.account_default.provider ?? null)
    : (ttsProviderSelection as TtsProvider);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{agent.name}</h1>
              <Badge
                variant="outline"
                className={agent.is_active ? 'border-chart-2/40 text-chart-2' : 'text-muted-foreground'}
              >
                {agent.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground mt-0.5">{agent.telnyx_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/dashboard/agents/${id}/test`)}>
            <FlaskConical className="size-3.5" />
            Test Agent
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/dashboard/agents/${id}/edit`)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <AgentTabs agentId={id} />

      <div className="grid grid-cols-[220px_1fr] mt-5 gap-6 items-start">
        {/* Left vertical sidebar */}
        <div className="flex flex-col gap-1">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors"
              style={{
                background: activeTab === tab.key ? 'var(--muted)' : 'transparent',
                color: activeTab === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              <tab.icon className="size-3.5 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right panel */}
        <Card>
          {activeTab === 'pipeline' && (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Radio className="size-4" />
                  Pipeline Mode
                </CardTitle>
                <CardDescription>
                  Cascaded (separate STT/LLM/TTS, customizable in the other tabs) or a
                  speech-to-speech model for this agent specifically.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Resolved mode</span>
                  <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px] font-mono self-start">
                    {pipelineConfig?.labels[resolvedMode] ?? resolvedMode}
                    {pipelineModeSelection === DEFAULT_SENTINEL && ' (account default)'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Mode for this agent</Label>
                  <Select
                    value={pipelineModeSelection}
                    onValueChange={v => {
                      setPipelineModeSelection(v);
                      const mode = v as PipelineMode;
                      const validVoices = pipelineConfig?.voices?.[mode as RealtimeProvider] ?? [];
                      if (!validVoices.includes(pipelineVoiceSelection)) {
                        setPipelineVoiceSelection(validVoices[0] ?? '');
                      }
                    }}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_SENTINEL}>
                        Use account default ({pipelineConfig?.labels[pipelineConfig.account_default.mode] ?? '—'})
                      </SelectItem>
                      {(Object.keys(pipelineConfig?.labels ?? { cascaded: 0 }) as PipelineMode[]).map(mode => {
                        const configured = mode === 'cascaded'
                          || (pipelineConfig?.keys_configured[mode as RealtimeProvider] ?? false);
                        return (
                          <SelectItem key={mode} value={mode} disabled={!configured}>
                            {pipelineConfig?.labels[mode] ?? mode}
                            {!configured && ' (no API key)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {pipelineModeSelection !== '' && pipelineModeSelection !== DEFAULT_SENTINEL && pipelineModeSelection !== 'cascaded' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Voice</Label>
                    <Select value={pipelineVoiceSelection} onValueChange={setPipelineVoiceSelection}>
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(pipelineConfig?.voices?.[pipelineModeSelection as RealtimeProvider] ?? []).map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={handleSavePipeline} disabled={!pipelineDirty || savingPipeline}>
                    {savingPipeline ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save changes
                  </Button>
                  {pipelineConfig?.is_override && (
                    <Button
                      size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"
                      onClick={() => setPipelineModeSelection(DEFAULT_SENTINEL)}
                      disabled={savingPipeline}
                    >
                      <RotateCcw className="size-3.5" />
                      Use account default
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {activeTab === 'llm' && (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="size-4" />
                  Model (LLM)
                </CardTitle>
                <CardDescription>Choose the language model that powers this agent&apos;s reasoning and responses.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Resolved model</span>
                  <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px] font-mono self-start">
                    {llmConfig ? `${PROVIDER_LABELS[llmConfig.provider]} / ${llmConfig.model}` : '—'}
                    {llmSelection === DEFAULT_SENTINEL && ' (account default)'}
                  </Badge>
                </div>
                <Separator />
                {isRealtimeSelected && (
                  <p className="text-[11px] text-muted-foreground rounded-lg border border-border bg-muted/10 px-3 py-2">
                    No effect while this agent&apos;s Pipeline Mode is a speech-to-speech model —
                    switch it to Cascaded to use this.
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Provider / model for this agent</Label>
                  {loadingLlmModels && llmModels === null ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading available models…
                    </div>
                  ) : (
                  <Select value={llmSelection} onValueChange={setLlmSelection} disabled={isRealtimeSelected}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_SENTINEL}>
                        Use account default ({llmConfig ? `${PROVIDER_LABELS[llmConfig.account_default.provider]} / ${llmConfig.account_default.model}` : '—'})
                      </SelectItem>
                      {(Object.keys(PROVIDER_LABELS) as LlmProvider[]).map(provider => {
                        const models = llmModels?.providers[provider];
                        return (
                          <SelectGroup key={provider}>
                            <SelectLabel>{PROVIDER_LABELS[provider]}</SelectLabel>
                            {models === undefined || models === null ? (
                              <div className="px-1.5 py-1 text-xs text-muted-foreground/60">API key not configured</div>
                            ) : models.length === 0 ? (
                              <div className="px-1.5 py-1 text-xs text-muted-foreground/60">No chat models available</div>
                            ) : (
                              models.map(m => (
                                <SelectItem key={`${provider}::${m}`} value={`${provider}::${m}`}>{m}</SelectItem>
                              ))
                            )}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  )}
                </div>
                <Separator />
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="llm-temp-override"
                        checked={llmTempOverride}
                        disabled={isRealtimeSelected}
                        onCheckedChange={checked => setLlmTempOverride(checked === true)}
                      />
                      <Label htmlFor="llm-temp-override" className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Thermometer className="size-3.5" />
                        Override temperature for this agent
                      </Label>
                    </div>
                    {!llmTempOverride && (
                      <span className="text-[11px] text-muted-foreground">
                        Account default: {llmConfig?.account_default.temperature ?? 'provider default'}
                      </span>
                    )}
                  </div>
                  {llmTempOverride && (
                    <div className="flex items-center gap-3">
                      <Slider
                        min={MIN_TEMPERATURE}
                        max={MAX_TEMPERATURE}
                        step={0.1}
                        value={llmTempValue}
                        disabled={isRealtimeSelected}
                        onValueChange={v => setLlmTempValue(Array.isArray(v) ? v[0] : v)}
                      />
                      <span className="w-10 shrink-0 text-right text-xs font-mono text-muted-foreground">
                        {llmTempValue.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={handleSaveLlm} disabled={!llmDirty || savingLlm || isRealtimeSelected}>
                    {savingLlm ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save changes
                  </Button>
                  {llmConfig?.is_override && (
                    <Button
                      size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"
                      onClick={() => setLlmSelection(DEFAULT_SENTINEL)}
                      disabled={savingLlm || isRealtimeSelected}
                    >
                      <RotateCcw className="size-3.5" />
                      Use account default
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {activeTab === 'stt' && (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Mic className="size-4" />
                  Speech recognition (STT)
                </CardTitle>
                <CardDescription>Controls how this agent&apos;s incoming audio is transcribed before it reaches the model.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Resolved engine</span>
                  <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px] font-mono self-start">
                    {sttConfig ? `${STT_PROVIDER_LABELS[sttConfig.provider]} / ${sttConfig.model}` : '—'}
                    {sttProviderSelection === DEFAULT_SENTINEL && ' (account default)'}
                  </Badge>
                </div>
                <Separator />
                {isRealtimeSelected && (
                  <p className="text-[11px] text-muted-foreground rounded-lg border border-border bg-muted/10 px-3 py-2">
                    No effect while this agent&apos;s Pipeline Mode is a speech-to-speech model —
                    switch it to Cascaded to use this.
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Provider for this agent</Label>
                  <Select
                    value={sttProviderSelection}
                    onValueChange={v => {
                      setSttProviderSelection(v);
                      if (v === 'together') {
                        const models = sttModels?.providers.together ?? [];
                        if (!models.includes(sttModelSelection)) setSttModelSelection(models[0] ?? '');
                      }
                    }}
                    disabled={isRealtimeSelected}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_SENTINEL}>
                        Use account default ({sttConfig ? STT_PROVIDER_LABELS[sttConfig.account_default.provider] : '—'})
                      </SelectItem>
                      {(Object.keys(sttConfig?.labels ?? STT_PROVIDER_LABELS) as SttProvider[]).map(provider => {
                        const configured = sttConfig?.keys_configured[provider] ?? false;
                        return (
                          <SelectItem key={provider} value={provider} disabled={!configured}>
                            {sttConfig?.labels[provider] ?? provider}
                            {!configured && ' (no API key)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {sttProviderSelection === 'together' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    {loadingSttModels && sttModels === null ? (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Loading available models…
                      </div>
                    ) : (
                    <Select value={sttModelSelection} onValueChange={setSttModelSelection}>
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(sttModels?.providers.together ?? []).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                )}
                <Separator />
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="stt-endpointing-override"
                        checked={sttEndpointingOverride}
                        disabled={isRealtimeSelected}
                        onCheckedChange={checked => setSttEndpointingOverride(checked === true)}
                      />
                      <Label htmlFor="stt-endpointing-override" className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Timer className="size-3.5" />
                        Override endpointing sensitivity for this agent
                      </Label>
                    </div>
                    {!sttEndpointingOverride && (
                      <span className="text-[11px] text-muted-foreground">
                        Account default: {sttConfig?.account_default.endpointing_ms}ms
                      </span>
                    )}
                  </div>
                  {sttEndpointingOverride && (
                    <>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={MIN_ENDPOINTING_MS}
                          max={MAX_ENDPOINTING_MS}
                          step={50}
                          value={sttEndpointingValue}
                          disabled={isRealtimeSelected}
                          onValueChange={v => setSttEndpointingValue(Array.isArray(v) ? v[0] : v)}
                        />
                        <span className="w-14 shrink-0 text-right text-xs font-mono text-muted-foreground">
                          {sttEndpointingValue}ms
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        How long a caller must stay silent before their turn is considered
                        complete. Lower = faster replies but may cut off pauses (e.g. mid-CNIC);
                        higher = more patient but slower to respond.
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={handleSaveStt} disabled={!sttDirty || savingStt || isRealtimeSelected}>
                    {savingStt ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save changes
                  </Button>
                  {sttConfig?.is_override && (
                    <Button
                      size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"
                      onClick={() => setSttProviderSelection(DEFAULT_SENTINEL)}
                      disabled={savingStt || isRealtimeSelected}
                    >
                      <RotateCcw className="size-3.5" />
                      Use account default
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {activeTab === 'tts' && (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <AudioLines className="size-4" />
                  Voice (TTS)
                </CardTitle>
                <CardDescription>Controls how this agent&apos;s replies are spoken back to the caller.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Resolved engine</span>
                  <Badge variant="outline" className="border-chart-2/40 text-chart-2 text-[10px] font-mono self-start">
                    {ttsConfig ? `${TTS_PROVIDER_LABELS[ttsConfig.provider]} / ${ttsConfig.model}` : '—'}
                    {ttsProviderSelection === DEFAULT_SENTINEL && ' (account default)'}
                  </Badge>
                </div>
                <Separator />
                {isRealtimeSelected && (
                  <p className="text-[11px] text-muted-foreground rounded-lg border border-border bg-muted/10 px-3 py-2">
                    No effect while this agent&apos;s Pipeline Mode is a speech-to-speech model —
                    switch it to Cascaded to use this.
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Provider for this agent</Label>
                  <Select
                    value={ttsProviderSelection}
                    onValueChange={v => {
                      setTtsProviderSelection(v);
                      const provider = v as TtsProvider;
                      const models = ttsModels?.providers[provider] ?? [];
                      if (!models.includes(ttsModelSelection)) setTtsModelSelection(models[0] ?? '');
                    }}
                    disabled={isRealtimeSelected}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_SENTINEL}>
                        Use account default ({ttsConfig ? TTS_PROVIDER_LABELS[ttsConfig.account_default.provider] : '—'})
                      </SelectItem>
                      {(Object.keys(TTS_PROVIDER_LABELS) as TtsProvider[]).map(provider => (
                        <SelectItem key={provider} value={provider}>{TTS_PROVIDER_LABELS[provider]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {ttsProviderSelection !== '' && ttsProviderSelection !== DEFAULT_SENTINEL && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    {loadingTtsModels && ttsModels === null ? (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Loading available models…
                      </div>
                    ) : (
                    <Select value={ttsModelSelection} onValueChange={setTtsModelSelection}>
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(ttsModels?.providers[ttsProviderSelection as TtsProvider] ?? []).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                )}
                <Separator />
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="tts-speed-override"
                        checked={ttsSpeedOverride}
                        disabled={isRealtimeSelected}
                        onCheckedChange={checked => setTtsSpeedOverride(checked === true)}
                      />
                      <Label htmlFor="tts-speed-override" className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Gauge className="size-3.5" />
                        Override speaking rate for this agent
                      </Label>
                    </div>
                    {!ttsSpeedOverride && (
                      <span className="text-[11px] text-muted-foreground">
                        Account default: {ttsConfig?.account_default.speed.toFixed(2)}x
                      </span>
                    )}
                  </div>
                  {ttsSpeedOverride && (
                    <div className="flex items-center gap-3">
                      <Slider
                        min={MIN_SPEED}
                        max={MAX_SPEED}
                        step={0.01}
                        value={ttsSpeedValue}
                        disabled={isRealtimeSelected}
                        onValueChange={v => setTtsSpeedValue(Array.isArray(v) ? v[0] : v)}
                      />
                      <span className="w-12 shrink-0 text-right text-xs font-mono text-muted-foreground">
                        {ttsSpeedValue.toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={handleSaveTts} disabled={!ttsDirty || savingTts || isRealtimeSelected}>
                    {savingTts ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save changes
                  </Button>
                  {ttsConfig?.is_override && (
                    <Button
                      size="sm" variant="ghost" className="gap-1.5 text-muted-foreground"
                      onClick={() => setTtsProviderSelection(DEFAULT_SENTINEL)}
                      disabled={savingTts || isRealtimeSelected}
                    >
                      <RotateCcw className="size-3.5" />
                      Use account default
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Which language/voice this agent actually speaks with — lives here
                    (not the Edit page) since it only makes sense next to the
                    resolved TTS provider above. */}
                <AgentVoicePicker
                  provider={resolvedTtsProvider}
                  language={agent.default_language}
                  voiceUrdu={agent.voice_urdu}
                  voiceEnglish={agent.voice_english}
                  onChange={handleVoicePickerChange}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
