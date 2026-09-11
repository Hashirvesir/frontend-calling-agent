'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Mic, MicOff, Phone, PhoneOff, Send, Copy, Check, Bot, User, Loader2,
  Settings, Terminal, AudioLines, X, AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  API_BASE, startAgentTest, streamAgentTestText, endAgentTest,
  getAgentById, getAgentLlmConfig, getAgentSttConfig, getAgentTtsConfig,
  getAgentPipelineConfig,
} from '@/lib/api';
import type { AgentTestStreamEvent, AgentTestDevLog, LlmProvider, TtsProvider } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Phase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';
type ChatMessage = { role: 'user' | 'bot'; text: string };
type DevLogEntry =
  | { ts: number; kind: 'text'; dev: AgentTestDevLog }
  | { ts: number; kind: 'voice'; event: string };
// `parts` rather than fixed llm/stt/tts fields: a speech-to-speech mode has no
// separate stages to name, so the header line is built per mode (see the
// metadata effect) instead of always describing a cascade.
type AgentMeta = { lang: string; parts: string[] };

const DEFAULT_VOICE_SAMPLE_RATE = 16000;
const INACTIVITY_TIMEOUT_MS = 45000;

const LLM_LABELS: Record<LlmProvider, string> = { groq: 'Groq', cerebras: 'Cerebras', together: 'Together AI' };
const TTS_LABELS: Record<TtsProvider, string> = { elevenlabs: 'ElevenLabs', uplift: 'UpliftAI' };

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function statusMeta(phase: Phase, endReason: 'manual' | 'inactivity' | null, hasError: boolean) {
  if (hasError) {
    return {
      dot: 'bg-red-400', label: 'CONNECTION FAILED',
      heading: 'Something went wrong', subtext: 'Check the message below',
    };
  }
  switch (phase) {
    case 'connecting':
      return { dot: 'bg-amber-300 animate-pulse', label: 'CONNECTING', heading: null, subtext: null };
    case 'listening':
      return { dot: 'bg-emerald-400', label: 'LISTENING', heading: null, subtext: null };
    case 'thinking':
      return { dot: 'bg-amber-300 animate-pulse', label: 'THINKING', heading: null, subtext: null };
    case 'speaking':
      return { dot: 'bg-violet-400', label: 'SPEAKING', heading: null, subtext: null };
    case 'ended':
      return {
        dot: 'bg-white/30',
        label: endReason === 'inactivity' ? 'DISCONNECTED' : 'CALL ENDED',
        heading: endReason === 'inactivity' ? 'Disconnected due to inactivity' : 'Conversation ended',
        subtext: null,
      };
    default:
      return { dot: '', label: '', heading: null, subtext: null };
  }
}

export default function AgentTestPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [devConsoleOpen, setDevConsoleOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [endReason, setEndReason] = useState<'manual' | 'inactivity' | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentMeta, setAgentMeta] = useState<AgentMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [devLogs, setDevLogs] = useState<DevLogEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const sessionIdRef = useRef<string | null>(null);
  const endedRef = useRef(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // --- Voice (WebSocket) mode — the real run_bot() pipeline over a plain
  // browser WebSocket instead of Telnyx: proper server-side VAD, streaming
  // STT/LLM/TTS, no turn-based round trips. See app/api/agent_test.py's
  // /api/agent-test/ws route and app/services/browser_ws_serializer.py.
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef(0);
  const currentBotTextRef = useRef('');
  const botTextStartedRef = useRef(false);
  // Told by the server right after connecting (16kHz cascaded, 24kHz OpenAI
  // Realtime — the only rate its PCM audio format accepts). Capture doesn't
  // start until this arrives, so mic/playback always agree with the pipeline.
  const sampleRateRef = useRef(DEFAULT_VOICE_SAMPLE_RATE);
  const captureStartedRef = useRef(false);

  // --- Text mode — the turn-based HTTP/NDJSON path (still useful for quick
  // typed sanity checks with full per-turn latency breakdown in the
  // Developer Console; not merged with the voice session's history).
  const audioQueueRef = useRef<{ b64: string; mime: string }[]>([]);
  const audioPlayingRef = useRef(false);
  const queueDrainResolveRef = useRef<(() => void) | null>(null);
  const playNextInQueueRef = useRef<() => void>(() => {});
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Header metadata line — agent's language plus whatever actually runs the
  // call. Which that is depends on the pipeline mode, so the mode is fetched
  // first and decides what the rest of the line describes: a cascaded call
  // names its three resolved stages (each the agent's own override if it has
  // one, else the account default — see the Model Config tab), while a
  // speech-to-speech call has no separate stages and names its provider and
  // voice instead. Showing the cascade's LLM/STT/TTS during a Grok or OpenAI
  // Realtime call was reporting services that call never touches.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [agentRec, pipelineCfg, llmCfg, sttCfg, ttsCfg] = await Promise.all([
        getAgentById(agentId), getAgentPipelineConfig(agentId), getAgentLlmConfig(agentId),
        getAgentSttConfig(agentId), getAgentTtsConfig(agentId),
      ]);
      if (cancelled) return;
      if (agentRec) setAgentName(prev => prev || agentRec.name);
      const lang = (agentRec?.default_language || 'ur').toUpperCase();
      // Fall back to the cascade description when the mode can't be read, since
      // cascaded is the platform default an unreadable config resolves to.
      const isRealtime = !!pipelineCfg && pipelineCfg.mode !== 'cascaded';
      const parts = isRealtime
        ? [pipelineCfg.labels[pipelineCfg.mode] ?? pipelineCfg.mode, pipelineCfg.voice].filter(Boolean)
        : [
            llmCfg ? `${LLM_LABELS[llmCfg.provider] ?? llmCfg.provider} ${llmCfg.model}` : '—',
            sttCfg ? sttCfg.labels[sttCfg.provider] : '—',
            ttsCfg ? (TTS_LABELS[ttsCfg.provider] ?? ttsCfg.provider) : '—',
          ];
      setAgentMeta({ lang, parts });
    })();
    return () => { cancelled = true; };
  }, [agentId]);

  // Call duration timer — ticks while a voice session is actually connected.
  useEffect(() => {
    if (!voiceActive) return;
    const id = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [voiceActive]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Voice mode
  // ────────────────────────────────────────────────────────────────────────

  const clearPlaybackQueue = useCallback(() => {
    playbackSourcesRef.current.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });
    playbackSourcesRef.current = [];
    if (playbackCtxRef.current) nextStartTimeRef.current = playbackCtxRef.current.currentTime;
  }, []);

  const enqueuePlaybackPCM = useCallback((int16: Int16Array) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const buffer = ctx.createBuffer(1, float32.length, sampleRateRef.current);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    playbackSourcesRef.current.push(source);
    source.onended = () => {
      playbackSourcesRef.current = playbackSourcesRef.current.filter(s => s !== source);
    };
  }, []);

  const stopVoiceMode = useCallback((reason: 'manual' | 'inactivity') => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearInactivityTimer();

    captureNodeRef.current?.port.close();
    captureNodeRef.current?.disconnect();
    captureNodeRef.current = null;
    captureCtxRef.current?.close().catch(() => {});
    captureCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;

    clearPlaybackQueue();
    playbackCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current = null;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setVoiceActive(false);
    setMicMuted(false);
    setEndReason(reason);
    setPhase('ended');
  }, [clearInactivityTimer, clearPlaybackQueue]);

  const armInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => stopVoiceMode('inactivity'), INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, stopVoiceMode]);

  const handleWsEvent = useCallback((raw: string) => {
    let msg: { event?: string; role?: string; text?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    armInactivityTimer();

    switch (msg.event) {
      case 'bot_started_speaking':
        setPhase('speaking');
        break;
      case 'bot_stopped_speaking':
        setPhase('listening');
        if (botTextStartedRef.current) {
          botTextStartedRef.current = false;
          currentBotTextRef.current = '';
        }
        break;
      case 'user_started_speaking':
        setPhase('listening');
        break;
      case 'user_stopped_speaking':
        setPhase('thinking');
        break;
      case 'interruption':
        clearPlaybackQueue();
        setDevLogs(prev => [...prev, { ts: Date.now(), kind: 'voice', event: 'interruption (barge-in)' }]);
        break;
      case 'transcript':
        if (msg.text) setMessages(prev => [...prev, { role: 'user', text: msg.text! }]);
        setDevLogs(prev => [...prev, { ts: Date.now(), kind: 'voice', event: `transcript: "${msg.text}"` }]);
        break;
      case 'bot_text':
        if (!msg.text) break;
        setMessages(prev => {
          const next = [...prev];
          if (botTextStartedRef.current && next.length > 0 && next[next.length - 1].role === 'bot') {
            currentBotTextRef.current = `${currentBotTextRef.current} ${msg.text}`.trim();
            next[next.length - 1] = { role: 'bot', text: currentBotTextRef.current };
          } else {
            botTextStartedRef.current = true;
            currentBotTextRef.current = msg.text!;
            next.push({ role: 'bot', text: msg.text! });
          }
          return next;
        });
        break;
      default:
        break;
    }
  }, [armInactivityTimer, clearPlaybackQueue]);

  const startCapture = useCallback(async (micStream: MediaStream, rate: number) => {
    try {
      const AudioCtxCls = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const captureCtx = new AudioCtxCls();
      captureCtxRef.current = captureCtx;
      await captureCtx.audioWorklet.addModule('/pcm-capture-worklet.js');
      const source = captureCtx.createMediaStreamSource(micStream);
      const node = new AudioWorkletNode(captureCtx, 'pcm-capture-worklet', {
        processorOptions: { targetRate: rate },
      });
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(e.data);
      };
      source.connect(node);
      captureNodeRef.current = node;
    } catch {
      const msg = 'Could not start microphone capture.';
      toast.error(msg);
      setErrorMessage(msg);
      stopVoiceMode('manual');
      return;
    }
    setVoiceActive(true);
    setPhase('listening');
    armInactivityTimer();
  }, [armInactivityTimer, stopVoiceMode]);

  const startVoiceMode = useCallback(async () => {
    if (!endedRef.current) return;
    setErrorMessage('');
    setPhase('connecting');
    endedRef.current = false;
    setMessages([]);
    setDevLogs([]);
    setElapsedSec(0);
    captureStartedRef.current = false;
    sampleRateRef.current = DEFAULT_VOICE_SAMPLE_RATE;

    let micStream: MediaStream;
    try {
      // Explicit (not just relying on the browser default) — without this,
      // some browser/device combos let the bot's own greeting/reply audio
      // (played via Web Audio API, not an <audio> element) leak back into
      // the mic and get transcribed as if the caller said it.
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      const msg = 'Microphone access was denied. Allow microphone access and try again.';
      toast.error('Microphone permission is required to talk to your agent.');
      setErrorMessage(msg);
      endedRef.current = true;
      setPhase('idle');
      return;
    }
    micStreamRef.current = micStream;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      const msg = 'Your session expired — sign in again.';
      toast.error(msg);
      setErrorMessage(msg);
      micStream.getTracks().forEach(t => t.stop());
      endedRef.current = true;
      setPhase('idle');
      return;
    }

    const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/api/agent-test/ws?agent_id=${encodeURIComponent(agentId)}&token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    const AudioCtxCls = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const playbackCtx = new AudioCtxCls();
    playbackCtxRef.current = playbackCtx;
    nextStartTimeRef.current = playbackCtx.currentTime;

    ws.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
      if (typeof e.data === 'string') {
        let msg: { event?: string; sample_rate?: number };
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.event === 'session_info') {
          if (typeof msg.sample_rate === 'number') sampleRateRef.current = msg.sample_rate;
          if (!captureStartedRef.current) {
            captureStartedRef.current = true;
            void startCapture(micStream, sampleRateRef.current);
          }
          return;
        }
        handleWsEvent(e.data);
      } else {
        enqueuePlaybackPCM(new Int16Array(e.data));
      }
    };

    ws.onerror = () => {
      const msg = 'Voice connection failed — check that the backend is reachable.';
      toast.error(msg);
      setErrorMessage(msg);
    };

    ws.onclose = () => {
      if (!endedRef.current) stopVoiceMode('manual');
    };
  }, [agentId, enqueuePlaybackPCM, handleWsEvent, startCapture, stopVoiceMode]);

  const handleTalkButtonClick = useCallback(() => {
    if (voiceActive) {
      stopVoiceMode('manual');
    } else {
      void startVoiceMode();
    }
  }, [startVoiceMode, stopVoiceMode, voiceActive]);

  const toggleMute = useCallback(() => {
    const track = micStreamRef.current?.getAudioTracks()[0];
    setMicMuted(prev => {
      const next = !prev;
      if (track) track.enabled = !next;
      return next;
    });
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Text mode (turn-based HTTP/NDJSON — separate session from voice)
  // ────────────────────────────────────────────────────────────────────────

  const playAudio = useCallback((b64: string, mime: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = playerRef.current ?? new Audio();
      playerRef.current = audio;
      audio.src = `data:${mime};base64,${b64}`;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, []);

  const playNextInQueue = useCallback(() => {
    const item = audioQueueRef.current.shift();
    if (!item) {
      audioPlayingRef.current = false;
      queueDrainResolveRef.current?.();
      queueDrainResolveRef.current = null;
      return;
    }
    audioPlayingRef.current = true;
    setPhase('speaking');
    void playAudio(item.b64, item.mime).then(() => playNextInQueueRef.current());
  }, [playAudio]);

  useEffect(() => {
    playNextInQueueRef.current = playNextInQueue;
  }, [playNextInQueue]);

  const enqueueAudio = useCallback((b64: string, mime: string) => {
    audioQueueRef.current.push({ b64, mime });
    if (!audioPlayingRef.current) playNextInQueueRef.current();
  }, []);

  const waitForQueueDrain = useCallback((): Promise<void> => {
    if (!audioPlayingRef.current && audioQueueRef.current.length === 0) return Promise.resolve();
    return new Promise(resolve => { queueDrainResolveRef.current = resolve; });
  }, []);

  const consumeTurnStream = useCallback(async (gen: AsyncGenerator<AgentTestStreamEvent>) => {
    setPhase('thinking');
    let botTextSoFar = '';
    let addedBotPlaceholder = false;

    try {
      for await (const item of gen) {
        if (item.type === 'chunk') {
          if (!addedBotPlaceholder) {
            addedBotPlaceholder = true;
            setMessages(prev => [...prev, { role: 'bot', text: '' }]);
          }
          botTextSoFar = botTextSoFar ? `${botTextSoFar} ${item.text}` : item.text;
          const textNow = botTextSoFar;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'bot', text: textNow };
            return next;
          });
          if (item.audio_base64) enqueueAudio(item.audio_base64, item.audio_mime ?? 'audio/mpeg');
        } else if (item.type === 'done') {
          setDevLogs(prev => [...prev, { ts: Date.now(), kind: 'text', dev: item.dev }]);
          if (item.transcript) {
            const userText = item.transcript;
            setMessages(prev => {
              const next = [...prev];
              const insertAt = addedBotPlaceholder ? next.length - 1 : next.length;
              next.splice(insertAt, 0, { role: 'user', text: userText });
              return next;
            });
          }
        } else {
          toast.error(item.detail);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process that turn.');
    }

    await waitForQueueDrain();
    setPhase('listening');
  }, [enqueueAudio, waitForQueueDrain]);

  const ensureTextSession = useCallback(async (): Promise<string | null> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const { data, error } = await startAgentTest(agentId);
    if (error || !data) {
      toast.error(error ?? 'Could not start a text session.');
      return null;
    }
    sessionIdRef.current = data.session_id;
    setAgentName(prev => prev || data.agent_name);
    setMessages(prev => [...prev, { role: 'bot', text: data.greeting_text }]);
    return data.session_id;
  }, [agentId]);

  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || voiceActive) return;
    setTextInput('');
    const sessionId = await ensureTextSession();
    if (!sessionId) return;
    await consumeTurnStream(streamAgentTestText(sessionId, text));
  }, [consumeTurnStream, ensureTextSession, textInput, voiceActive]);

  const handleCopyTranscript = useCallback(() => {
    const text = messages.map(m => `${m.role === 'bot' ? (agentName || 'Agent') : 'You'}: ${m.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => toast.error('Could not copy transcript.'));
  }, [agentName, messages]);

  // Tear everything down if the user navigates away mid-conversation.
  useEffect(() => {
    return () => {
      if (!endedRef.current) stopVoiceMode('manual');
      if (sessionIdRef.current) void endAgentTest(sessionIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = phase === 'listening' || phase === 'thinking' || phase === 'speaking';
  const turnCount = messages.filter(m => m.role === 'user').length;
  const meta = statusMeta(phase, endReason, !!errorMessage);
  const metaLine = agentMeta
    ? [agentMeta.lang, ...agentMeta.parts].join(' · ')
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] text-white">
      <style>{`
        @keyframes orbPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.06); opacity: 0.9; } }
        @keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .orb-ring-outer { animation: orbSpin 14s linear infinite; }
        .orb-ring-mid { animation: orbSpin 10s linear infinite reverse; }
        .orb-pulse { animation: orbPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/dashboard/agents/${agentId}`)}
            className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5 transition shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
            <Bot className="size-4 text-white/70" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{agentName || 'Loading…'}</div>
            <div className="text-[11px] font-mono uppercase tracking-wide text-white/40 truncate">
              {metaLine}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {voiceActive && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wide">
              <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
          <button
            onClick={() => setDevConsoleOpen(v => !v)}
            title="Developer Console"
            className={cn(
              'flex items-center justify-center size-8 rounded-lg transition',
              devConsoleOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/90 hover:bg-white/5',
            )}
          >
            <Terminal className="size-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/15 bg-transparent text-white/80 hover:bg-white/5 hover:text-white"
            onClick={() => router.push(`/dashboard/agents/${agentId}/edit`)}
          >
            <Settings className="size-3.5" />
            Settings
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: orb + status + controls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 relative min-w-0">
          {/* Orb */}
          <div className="relative flex items-center justify-center size-40 shrink-0">
            <div className={cn('absolute inset-0 rounded-full border border-white/10', isActive && 'orb-ring-outer')} />
            <div className={cn('absolute inset-5 rounded-full border border-white/15', isActive && 'orb-ring-mid')} />
            <div className={cn(
              'absolute inset-12 rounded-full border transition-colors',
              phase === 'listening' && 'border-emerald-400/50',
              phase === 'thinking' && 'border-amber-300/50',
              phase === 'speaking' && 'border-violet-400/50',
              (phase === 'idle' || phase === 'connecting' || phase === 'ended') && 'border-white/20',
            )} />
            <div className={cn(
              'size-3 rounded-full transition-colors',
              isActive && 'orb-pulse',
              phase === 'listening' && 'bg-emerald-400',
              phase === 'thinking' && 'bg-amber-300',
              phase === 'speaking' && 'bg-violet-400',
              (phase === 'idle' || phase === 'connecting' || phase === 'ended') && 'bg-white/50',
            )} />
          </div>

          {phase !== 'idle' && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-white/50">
              <span className={cn('size-1.5 rounded-full', meta.dot)} />
              {meta.label}
            </div>
          )}

          {meta.heading && (
            <div className="flex flex-col items-center gap-1.5 text-center max-w-sm">
              <h2 className="text-xl font-semibold text-white/90">{meta.heading}</h2>
              {meta.subtext && <p className="text-sm text-white/40">{meta.subtext}</p>}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-4 py-3 max-w-md text-center">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-300" />
              <p className="text-sm text-red-200">{errorMessage}</p>
            </div>
          )}

          {/* Control bar */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleTalkButtonClick}
              disabled={phase === 'connecting'}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60',
                !voiceActive
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                  : 'bg-red-500/90 text-white hover:bg-red-500',
              )}
            >
              {phase === 'connecting' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : voiceActive ? (
                <PhoneOff className="size-4" />
              ) : (
                <Phone className="size-4" />
              )}
              {voiceActive ? 'End call' : 'Start call'}
            </button>

            <button
              onClick={toggleMute}
              disabled={!voiceActive}
              title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
              className="flex items-center justify-center size-10 rounded-full border border-white/15 text-white/70 hover:bg-white/5 disabled:opacity-40 transition"
            >
              {micMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>

            <div className="flex items-center gap-1 px-3 h-10 rounded-full border border-white/10 text-[12px] font-mono text-white/50">
              {formatDuration(elapsedSec)} — {turnCount}t
            </div>

            <button
              onClick={() => setTranscriptOpen(v => !v)}
              className={cn(
                'flex items-center gap-1.5 h-10 px-3.5 rounded-full border text-[12px] font-medium transition',
                transcriptOpen
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 text-white/50 hover:bg-white/5',
              )}
            >
              <AudioLines className="size-3.5" />
              Transcript
            </button>
          </div>
        </div>

        {/* Right: transcript / developer console panel */}
        {transcriptOpen && (
          <aside className="w-[380px] shrink-0 border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <span className="text-sm font-semibold">
                {devConsoleOpen ? 'Developer Console' : 'Live transcript'}
              </span>
              <div className="flex items-center gap-1">
                {!devConsoleOpen && (
                  <button
                    onClick={handleCopyTranscript}
                    disabled={messages.length === 0}
                    title="Copy transcript"
                    className="flex items-center justify-center size-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 transition"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => setTranscriptOpen(false)}
                  className="flex items-center justify-center size-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {devConsoleOpen ? (
              <div className="flex-1 overflow-y-auto px-3 py-3 font-mono text-xs">
                {devLogs.length === 0 ? (
                  <p className="text-white/30 px-1 py-6 text-center">
                    No turns yet — talk to the agent to see live pipeline events here.
                  </p>
                ) : (
                  devLogs.map((log, i) => (
                    <div key={i} className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-1.5">
                      <div className="text-white/40 mb-1">{new Date(log.ts).toLocaleTimeString()}</div>
                      {log.kind === 'voice' ? (
                        <div className="text-cyan-300">{log.event}</div>
                      ) : (
                        <>
                          {log.dev.stt && (
                            <div className="text-cyan-300">
                              STT [{log.dev.stt.provider}] {log.dev.stt.latency_ms}ms → &ldquo;{log.dev.stt.transcript}&rdquo;
                            </div>
                          )}
                          {log.dev.rag.loaded ? (
                            <div className="text-purple-300">
                              RAG [{log.dev.rag.chunk_count} chunks] {log.dev.rag.latency_ms}ms{' '}
                              {log.dev.rag.context_injected ? '→ context injected' : '→ no match'}
                            </div>
                          ) : (
                            <div className="text-white/30">RAG: no script configured for this agent</div>
                          )}
                          <div className="text-emerald-300">
                            LLM [{log.dev.llm.provider}/{log.dev.llm.model}] first token {log.dev.llm.ttft_ms ?? '—'}ms, total{' '}
                            {log.dev.llm.total_ms}ms
                          </div>
                          <div className="text-amber-300">
                            TTS [{log.dev.tts.provider}/{log.dev.tts.model}] first audio {log.dev.tts.ttfb_ms ?? '—'}ms, total{' '}
                            {log.dev.tts.total_ms ?? '—'}ms
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
                  {messages.length === 0 && (
                    <p className="text-xs text-white/30 text-center py-10 px-4">
                      Nothing yet. Start a call and the conversation appears here.
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn('flex items-start gap-2', m.role === 'user' && 'flex-row-reverse')}>
                      <div className="size-6 rounded-full border border-white/15 flex items-center justify-center shrink-0">
                        {m.role === 'bot' ? <Bot className="size-3 text-white/60" /> : <User className="size-3 text-white/60" />}
                      </div>
                      <div className={cn(
                        'rounded-xl px-3 py-1.5 text-[13px] max-w-[85%] leading-relaxed',
                        m.role === 'bot' ? 'bg-white/[0.06] text-white/90' : 'bg-emerald-400/10 text-emerald-100',
                      )}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>

                <div className="flex gap-2 px-3 py-3 border-t border-white/10 shrink-0">
                  <Input
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleSendText(); } }}
                    placeholder={voiceActive ? 'End the voice call to type instead…' : 'Or type a message…'}
                    disabled={voiceActive || phase === 'connecting' || phase === 'thinking' || phase === 'speaking'}
                    className="flex-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
                  />
                  <Button
                    onClick={() => void handleSendText()}
                    disabled={!textInput.trim() || voiceActive || phase === 'connecting' || phase === 'thinking' || phase === 'speaking'}
                    size="icon"
                    className="shrink-0 bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
