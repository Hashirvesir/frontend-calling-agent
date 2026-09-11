const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7860';
export const API_BASE = BASE;

async function authHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const { supabase } = await import('@/lib/supabase');
    let { data: { session } } = await supabase.auth.getSession();
    // If no session, try refreshing (handles expired tokens)
    if (!session) {
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data.session;
    }
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CallRecord = {
  id: string;
  call_control_id: string | null;
  agent_id: string | null;
  direction: 'inbound' | 'outbound';
  from_number: string | null;
  to_number: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_storage_path: string | null;
  turn_count: number;
  agents?: { id: string; name: string; telnyx_number: string } | null;
};

export function getRecordingUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7860';
  return `${base}/calls/${storagePath}`;
}

export type AgentRecord = {
  id: string;
  name: string;
  telnyx_number: string;
  telnyx_app_id: string | null;
  script_id: string | null;
  system_prompt_override: string | null;
  voice_urdu: string;
  voice_english: string;
  default_language: string;
  greeting_text: string | null;
  is_active: boolean;
  created_at: string;
  scripts?: { id: string; name: string } | null;
};

export type ExtractionField = { name: string; description?: string; expected_type?: string };

export type ScriptRecord = {
  id: string;
  name: string;
  content: string;
  language: string;
  is_active: boolean;
  extraction_fields: (string | ExtractionField)[];
  created_at: string;
  updated_at: string;
};

export type StatsRecord = {
  total: number;
  inbound: number;
  outbound: number;
  active: number;
};

export type TurnRecord = {
  id: string;
  call_id: string;
  speaker: string;
  text: string;
  turn_index: number;
  timestamp_in_call: string | null;
};

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const auth = await authHeaders();
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      ...init,
      headers: { ...auth, ...(init?.headers as Record<string, string> ?? {}) },
    });
    if (res.status === 401 && typeof window !== 'undefined') {
      // Only redirect to sign-in if there is genuinely no session. A 401 while a
      // valid session exists points at a backend/token problem, not an expired
      // login — bouncing here would trap the user in a sign-in → dashboard loop.
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/sign-in';
      }
      return null;
    }
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function apiFetchWithError<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const auth = await authHeaders();
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      ...init,
      headers: { ...auth, ...(init?.headers as Record<string, string> ?? {}) },
    });
    if (res.status === 204) return { data: null, error: null };
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = json?.detail ?? json?.message ?? `Server error ${res.status}`;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { data: null, error: msg };
    }
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'Network error — check your connection and try again.' };
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getStats(): Promise<StatsRecord> {
  const data = await apiFetch<StatsRecord>('/api/stats');
  return data ?? { total: 0, inbound: 0, outbound: 0, active: 0 };
}

// ── Calls ──────────────────────────────────────────────────────────────────

export async function getCalls(): Promise<CallRecord[]> {
  const data = await apiFetch<{ calls: CallRecord[] }>('/api/calls');
  return data?.calls ?? [];
}

export async function deleteCallApi(id: string): Promise<boolean> {
  const auth = await authHeaders();
  const res = await fetch(`${BASE}/api/calls/${id}`, { method: 'DELETE', headers: auth });
  return res.ok || res.status === 204;
}

export async function getConversation(callId: string): Promise<TurnRecord[]> {
  const data = await apiFetch<{ turns: TurnRecord[] }>(`/api/conversation/db/${callId}`);
  return data?.turns ?? [];
}

export type LlmProviderUsed = 'groq' | 'cerebras' | 'together' | 'openai' | 'openai_realtime' | 'unknown';
export type SttProviderUsed = 'groq' | 'deepgram' | 'together';

export type CallMetrics = {
  latency: {
    // stt_ms/tts_ms are null for Realtime turns — one speech-to-speech stage,
    // not three, so there's no separate STT/TTS latency to report.
    turns: { turn: number; stt_ms: number | null; llm_ms: number; tts_ms: number | null; total_ms: number }[];
  };
  llm_provider: LlmProviderUsed;
  stt_provider: SttProviderUsed;
  usage: {
    llm_prompt_tokens: number;
    llm_completion_tokens: number;
    tts_uplift_characters: number;
    tts_elevenlabs_characters: number;
  };
  cost: {
    telnyx_usd: number;
    telnyx_recording_usd: number;
    llm_usd: number;
    stt_usd: number;
    tts_uplift_usd: number;
    tts_elevenlabs_usd: number;
    total_usd: number;
  };
};

export async function getCallMetrics(callId: string): Promise<CallMetrics | null> {
  return apiFetch<CallMetrics>(`/api/calls/${callId}/metrics`);
}

// ── Billing ────────────────────────────────────────────────────────────────

export type BillingUsage = {
  period_start: string;
  total_calls: number;
  total_minutes: number;
  cost: {
    telnyx_usd: number;
    telnyx_recording_usd: number;
    llm_usd: number;
    stt_usd: number;
    tts_uplift_usd: number;
    tts_elevenlabs_usd: number;
    total_usd: number;
  };
};

export async function getBillingUsage(): Promise<BillingUsage | null> {
  return apiFetch<BillingUsage>('/api/billing/usage');
}

// ── System health (API credit/balance status) ───────────────────────────────

export type ProviderHealthStatus = 'ok' | 'exhausted' | 'no_key' | 'error';

export type ProviderHealth = {
  label: string;
  used_for: string;
  status: ProviderHealthStatus;
  detail?: string;
  usage?: number | null;
  limit?: number | null;
  unit?: string;
  tier?: string;
};

export type SystemHealth = {
  providers: Record<string, ProviderHealth>;
  checked_at: number;
};

export async function getSystemHealth(): Promise<SystemHealth | null> {
  return apiFetch<SystemHealth>('/api/system-health');
}

// ── Agents ─────────────────────────────────────────────────────────────────

export async function getAgents(): Promise<AgentRecord[]> {
  const data = await apiFetch<{ agents: AgentRecord[] }>('/api/agents');
  return data?.agents ?? [];
}

export async function getAgentById(id: string): Promise<AgentRecord | null> {
  return apiFetch<AgentRecord>(`/api/agents/${id}`);
}

export async function createAgentApi(body: {
  name: string;
  telnyx_number: string;
  script_id?: string | null;
  telnyx_app_id?: string | null;
  system_prompt_override?: string | null;
  voice_urdu?: string;
  voice_english?: string;
  default_language?: string;
  greeting_text?: string | null;
}): Promise<AgentRecord | null> {
  return apiFetch<AgentRecord>('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateAgentApi(id: string, body: Partial<{
  name: string;
  telnyx_number: string;
  script_id: string | null;
  telnyx_app_id: string | null;
  system_prompt_override: string | null;
  voice_urdu: string;
  voice_english: string;
  default_language: string;
  greeting_text: string | null;
  is_active: boolean;
}>): Promise<AgentRecord | null> {
  return apiFetch<AgentRecord>(`/api/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteAgentApi(id: string): Promise<boolean> {
  await apiFetch(`/api/agents/${id}`, { method: 'DELETE' });
  return true;
}

// ── Scripts ────────────────────────────────────────────────────────────────

export async function getScripts(): Promise<ScriptRecord[]> {
  const data = await apiFetch<{ scripts: ScriptRecord[] }>('/api/scripts');
  return data?.scripts ?? [];
}

export async function getScriptById(id: string): Promise<ScriptRecord | null> {
  return apiFetch<ScriptRecord>(`/api/scripts/${id}`);
}

export async function createScriptApi(body: {
  name: string;
  content: string;
  language: string;
  extraction_fields?: (string | ExtractionField)[];
}): Promise<ScriptRecord | null> {
  return apiFetch<ScriptRecord>('/api/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateScriptApi(id: string, body: Partial<{
  name: string;
  content: string;
  language: string;
  is_active: boolean;
  extraction_fields: (string | ExtractionField)[];
}>): Promise<ScriptRecord | null> {
  return apiFetch<ScriptRecord>(`/api/scripts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteScriptApi(id: string): Promise<boolean> {
  await apiFetch(`/api/scripts/${id}`, { method: 'DELETE' });
  return true;
}

export async function optimizeScript(
  content: string, language: string,
): Promise<{ optimizedContent: string | null; error: string | null }> {
  const { data, error } = await apiFetchWithError<{ optimized_content: string }>('/api/scripts/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, language }),
  });
  return { optimizedContent: data?.optimized_content ?? null, error };
}

export async function generateScript(
  topic: string, language: string,
): Promise<{ content: string | null; extractionFields: string[]; error: string | null }> {
  const { data, error } = await apiFetchWithError<{ content: string; extraction_fields: string[] }>('/api/scripts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, language }),
  });
  return {
    content: data?.content ?? null,
    extractionFields: data?.extraction_fields ?? [],
    error,
  };
}

// ── Extraction ─────────────────────────────────────────────────────────────

export type ExtractionRow = {
  call_id: string;
  phone: string;
  started_at: string | null;
  duration_seconds: number | null;
  confidence: 'high' | 'partial' | 'low' | null;
  missing_count: number | null;
  [key: string]: unknown;   // dynamic extracted fields
};

export type AgentExtractionData = {
  extraction_columns: string[];
  rows: ExtractionRow[];
};

export async function suggestExtractionFields(content: string): Promise<string[]> {
  const data = await apiFetch<{ fields: string[] }>('/api/extraction/suggest-fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return data?.fields ?? [];
}

export async function getAgentExtractionData(agentId: string): Promise<AgentExtractionData> {
  const data = await apiFetch<AgentExtractionData>(`/api/extraction/agent/${agentId}`);
  return data ?? { extraction_columns: [], rows: [] };
}

export async function deleteExtractionRow(callId: string): Promise<boolean> {
  try {
    const auth = await authHeaders();
    const res = await fetch(`${BASE}/api/extraction/row/${callId}`, { method: 'DELETE', headers: auth });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export async function updateExtractionField(callId: string, field: string, value: string): Promise<boolean> {
  try {
    const auth = await authHeaders();
    const res = await fetch(`${BASE}/api/extraction/row/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ field, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Platform settings ──────────────────────────────────────────────────────

export type PlatformSettings = {
  telnyx_api_key: string;
  telnyx_webhook_public_key: string;
  webhook_url: string;
  has_telnyx_api_key: boolean;
  has_webhook_key: boolean;
};

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  return apiFetch<PlatformSettings>('/api/settings');
}

export async function savePlatformSettings(data: {
  telnyx_api_key?: string;
  telnyx_webhook_public_key?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail;
      const error =
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : `Error ${res.status}`;
      return { ok: false, error };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── Voice config ───────────────────────────────────────────────────────────

export type UrduVoice = { id: string; name: string; description: string };

export type VoiceConfig = {
  default_urdu_voice: string;
  urdu_voices: UrduVoice[];
};

export async function getVoiceConfig(): Promise<VoiceConfig | null> {
  return apiFetch<VoiceConfig>('/api/voice-config');
}

export async function setVoiceConfig(voice_id: string): Promise<boolean> {
  const auth = await authHeaders();
  const res = await fetch(`${BASE}/api/voice-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ voice_id }),
  });
  return res.ok;
}

// ── LLM config (AI model selection) ────────────────────────────────────────

export type LlmProvider = 'groq' | 'cerebras' | 'together';

export type LlmConfig = {
  provider: LlmProvider;
  model: string;
  temperature: number | null;
  keys_configured: Record<LlmProvider, boolean>;
};

// models: null = provider key missing or provider unreachable
export type LlmModels = {
  providers: Record<LlmProvider, string[] | null>;
};

export async function getLlmConfig(): Promise<LlmConfig | null> {
  return apiFetch<LlmConfig>('/api/llm-config');
}

export async function getLlmModels(): Promise<LlmModels | null> {
  return apiFetch<LlmModels>('/api/llm-config/models');
}

export async function setLlmConfig(
  provider: LlmProvider, model: string,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/llm-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── STT config (speech-to-text engine selection) ───────────────────────────

export type SttProvider = 'groq' | 'deepgram' | 'together';

export type SttConfig = {
  provider: SttProvider;
  model: string;
  endpointing_ms: number;
  labels: Record<SttProvider, string>;
  keys_configured: Record<SttProvider, boolean>;
};

// Only Together has more than one model — Groq/Deepgram each use one fixed
// model (see app/core/stt_config.py's FIXED_MODELS), so they're absent here.
export type SttModels = {
  providers: { together: string[] | null };
};

export async function getSttConfig(): Promise<SttConfig | null> {
  return apiFetch<SttConfig>('/api/stt-config');
}

export async function getSttModels(): Promise<SttModels | null> {
  return apiFetch<SttModels>('/api/stt-config/models');
}

export async function setSttConfig(
  provider: SttProvider, model?: string,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/stt-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model: model ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── TTS config (voice engine / model selection) ────────────────────────────

export type TtsProvider = 'elevenlabs' | 'uplift';

export type TtsConfig = {
  provider: TtsProvider;
  model: string;
  speed: number;
  keys_configured: Record<TtsProvider, boolean>;
};

// models: null = provider key missing or provider unreachable
export type TtsModels = {
  providers: Record<TtsProvider, string[] | null>;
};

// voice_urdu/voice_english need a real voice_id from this list to have any
// effect for ElevenLabs (see app/services/bot.py's TTS engine branch) —
// different from TtsModels above, which is the synthesis engine variant.
export type TtsVoice = { id: string; name: string; description: string };
export type TtsVoices = {
  providers: Record<TtsProvider, TtsVoice[] | null>;
};

export async function getTtsConfig(): Promise<TtsConfig | null> {
  return apiFetch<TtsConfig>('/api/tts-config');
}

export async function getTtsVoices(): Promise<TtsVoices | null> {
  return apiFetch<TtsVoices>('/api/tts-config/voices');
}

export async function getTtsModels(): Promise<TtsModels | null> {
  return apiFetch<TtsModels>('/api/tts-config/models');
}

export async function setTtsConfig(
  provider: TtsProvider, model: string,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/tts-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── Voice pipeline mode (cascaded STT/LLM/TTS vs. OpenAI Realtime) ─────────

export type PipelineMode = 'cascaded' | 'openai_realtime' | 'grok_voice';
export type RealtimeProvider = 'openai_realtime' | 'grok_voice';

export type PipelineConfig = {
  mode: PipelineMode;
  voice: string;
  labels: Record<PipelineMode, string>;
  // Keyed by realtime provider only — 'cascaded' has no voice picker of its
  // own here (that's the existing separate Voice Engine/ElevenLabs card).
  voices: Record<RealtimeProvider, string[]>;
  keys_configured: Record<RealtimeProvider, boolean>;
};

export async function getPipelineConfig(): Promise<PipelineConfig | null> {
  return apiFetch<PipelineConfig>('/api/pipeline-config');
}

export async function setPipelineConfig(
  mode: PipelineMode, voice: string,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/pipeline-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ mode, voice }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── Per-agent config overrides (LLM/STT/TTS/Pipeline Mode) ─────────────────
//
// Each agent can optionally override any of the 4 account-level config
// dimensions above. provider/mode: null in a PUT body is the "revert to
// account default" sentinel — it clears the agent's override rather than
// requiring a separate flag. GET responses include is_override + the
// account's current default, so the UI never needs a second call to show
// "(currently inheriting Groq / gpt-oss-120b)".

export type AgentLlmConfig = LlmConfig & {
  is_override: boolean;
  temperature_is_override: boolean;
  account_default: { provider: LlmProvider; model: string; temperature: number | null };
};
export type AgentSttConfig = SttConfig & {
  is_override: boolean;
  endpointing_is_override: boolean;
  account_default: { provider: SttProvider; model: string; endpointing_ms: number };
};
export type AgentTtsConfig = TtsConfig & {
  is_override: boolean;
  speed_is_override: boolean;
  account_default: { provider: TtsProvider; model: string; speed: number };
};
export type AgentPipelineConfig = PipelineConfig & {
  is_override: boolean;
  account_default: { mode: PipelineMode; voice: string };
};

export async function getAgentLlmConfig(agentId: string): Promise<AgentLlmConfig | null> {
  return apiFetch<AgentLlmConfig>(`/api/agents/${agentId}/llm-config`);
}

export async function setAgentLlmConfig(
  agentId: string, provider: LlmProvider | null, model: string | null, temperature?: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/agents/${agentId}/llm-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model, temperature: temperature ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

export async function getAgentSttConfig(agentId: string): Promise<AgentSttConfig | null> {
  return apiFetch<AgentSttConfig>(`/api/agents/${agentId}/stt-config`);
}

export async function setAgentSttConfig(
  agentId: string, provider: SttProvider | null, model?: string | null, endpointingMs?: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/agents/${agentId}/stt-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model: model ?? null, endpointing_ms: endpointingMs ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

export async function getAgentTtsConfig(agentId: string): Promise<AgentTtsConfig | null> {
  return apiFetch<AgentTtsConfig>(`/api/agents/${agentId}/tts-config`);
}

export async function setAgentTtsConfig(
  agentId: string, provider: TtsProvider | null, model: string | null, speed?: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/agents/${agentId}/tts-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ provider, model, speed: speed ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

export async function getAgentPipelineConfig(agentId: string): Promise<AgentPipelineConfig | null> {
  return apiFetch<AgentPipelineConfig>(`/api/agents/${agentId}/pipeline-config`);
}

export async function setAgentPipelineConfig(
  agentId: string, mode: PipelineMode | null, voice: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await authHeaders();
  try {
    const res = await fetch(`${BASE}/api/agents/${agentId}/pipeline-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ mode, voice }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.detail ?? `Save failed (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
}

// ── Pipeline test (try the selected LLM/TTS models without a real call) ────

export type PipelineTestResult = {
  reply: string;
  llm: {
    provider: string;
    model: string;
    ttft_ms: number | null;
    total_ms: number;
  };
  tts: {
    provider: string;
    model: string;
    ttfb_ms: number | null;
    total_ms: number | null;
    audio_base64: string | null;
    audio_mime: string | null;
  };
};

export async function testPipeline(
  message: string,
): Promise<{ data: PipelineTestResult | null; error: string | null }> {
  return apiFetchWithError<PipelineTestResult>('/api/pipeline-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

// ── Agent test widget (live conversation with one agent, no real call) ─────

export type AgentTestStart = {
  session_id: string;
  agent_name: string;
  greeting_text: string;
  greeting_audio_base64: string | null;
  greeting_audio_mime: string | null;
};

export type AgentTestDevLog = {
  stt: { provider: string; latency_ms: number; transcript: string } | null;
  rag:
    | { loaded: false }
    | {
        loaded: true;
        chunk_count: number;
        context_injected: boolean;
        latency_ms: number;
        context_preview: string;
      };
  llm: { provider: string; model: string; ttft_ms: number | null; total_ms: number };
  tts: { provider: string; model: string; ttfb_ms: number | null; total_ms: number | null };
};

// The turn endpoint streams newline-delimited JSON — one "chunk" per sentence
// (with that sentence's own audio) as soon as it's ready, then a final "done"
// with the full transcript + dev log. This is what makes the widget start
// speaking after ~1 sentence instead of going silent until the whole reply
// (text AND audio) is finished.
export type AgentTestChunk = {
  type: 'chunk';
  text: string;
  audio_base64: string | null;
  audio_mime: string | null;
};
export type AgentTestDone = {
  type: 'done';
  transcript: string | null;
  reply: string;
  dev: AgentTestDevLog;
};
export type AgentTestError = { type: 'error'; detail: string };
export type AgentTestStreamEvent = AgentTestChunk | AgentTestDone | AgentTestError;

export async function startAgentTest(
  agentId: string,
): Promise<{ data: AgentTestStart | null; error: string | null }> {
  return apiFetchWithError<AgentTestStart>('/api/agent-test/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId }),
  });
}

async function* streamAgentTestTurn(body: Record<string, unknown>): AsyncGenerator<AgentTestStreamEvent> {
  const auth = await authHeaders();
  const res = await fetch(`${BASE}/api/agent-test/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.detail ?? `Turn failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) yield JSON.parse(line) as AgentTestStreamEvent;
    }
  }
  const tail = buffer.trim();
  if (tail) yield JSON.parse(tail) as AgentTestStreamEvent;
}

export function streamAgentTestText(sessionId: string, text: string): AsyncGenerator<AgentTestStreamEvent> {
  return streamAgentTestTurn({ session_id: sessionId, text });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — backend wants raw base64.
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function* streamAgentTestAudio(
  sessionId: string, audioBlob: Blob,
): AsyncGenerator<AgentTestStreamEvent> {
  const audio_base64 = await blobToBase64(audioBlob);
  yield* streamAgentTestTurn({
    session_id: sessionId,
    audio_base64,
    audio_mime: audioBlob.type || 'audio/webm',
  });
}

export async function endAgentTest(sessionId: string): Promise<void> {
  const auth = await authHeaders();
  try {
    await fetch(`${BASE}/api/agent-test/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ session_id: sessionId }),
    });
  } catch {
    // best-effort — the session TTLs out server-side regardless
  }
}

// ── Password reset ────────────────────────────────────────────────────────

async function authPost(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = json?.detail;
      const error = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : `Error ${res.status}`;
      return { ok: false, error };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — check your connection and try again.' };
  }
}

export function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/forgot-password', { email });
}

export function verifyResetCode(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/verify-reset-code', { email, code });
}

export function resetPassword(email: string, code: string, new_password: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/reset-password', { email, code, new_password });
}

// ── Signup email verification ───────────────────────────────────────────────

export function signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/signup', { email, password });
}

export function verifyEmailCode(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/verify-email', { email, code });
}

export function resendVerification(email: string): Promise<{ ok: boolean; error?: string }> {
  return authPost('/api/auth/resend-verification', { email });
}

// ── Outbound dial ──────────────────────────────────────────────────────────

export async function dialOutbound(
  to: string,
  from: string,
): Promise<{ ok: boolean; error?: string }> {
  const fd = new FormData();
  fd.append('to', to);
  fd.append('from', from);
  try {
    const auth = await authHeaders();
    const res = await fetch(`${BASE}/dial`, { method: 'POST', body: fd, headers: auth });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const detail = data?.detail;
      const error =
        typeof detail === 'string'
          ? detail
          : detail
            ? JSON.stringify(detail)
            : `Error ${res.status}`;
      return { ok: false, error };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
