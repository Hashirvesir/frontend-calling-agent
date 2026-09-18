'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCalls, getConversation, endCallApi } from '@/lib/api';
import type { CallRecord, TurnRecord } from '@/lib/api';
import { toast } from 'sonner';
import LiveCallPanel from './LiveCallPanel';

export default function LiveCallPanelClient() {
  const [call, setCall] = useState<CallRecord | null>(null);
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [isEnding, setIsEnding] = useState(false);

  const load = useCallback(async () => {
    try {
      const calls = await getCalls();
      const liveCall = calls.find(c => c.status === 'in_progress') ?? calls[0] ?? null;
      const liveTurns = liveCall?.id ? await getConversation(liveCall.id) : [];
      setCall(liveCall);
      setTurns(liveTurns);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    load();
    const id = setInterval(() => {
      if (mounted) load();
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [load]);

  const handleEndCall = async () => {
    if (!call?.id || isEnding) return;
    setIsEnding(true);
    try {
      const res = await endCallApi(call.id);
      if (res.ok) {
        toast.success('Live call ended successfully');
        setCall(prev => prev ? { ...prev, status: 'ended' } : null);
        await load();
      } else {
        toast.error(res.message || 'Failed to end live call');
      }
    } catch {
      toast.error('Failed to end live call');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <LiveCallPanel
      call={call}
      turns={turns}
      onEndCall={handleEndCall}
      isEnding={isEnding}
    />
  );
}
