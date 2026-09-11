'use client';

import { useEffect, useState } from 'react';
import { getCalls, getConversation } from '@/lib/api';
import type { CallRecord, TurnRecord } from '@/lib/api';
import LiveCallPanel from './LiveCallPanel';

export default function LiveCallPanelClient() {
  const [call, setCall] = useState<CallRecord | null>(null);
  const [turns, setTurns] = useState<TurnRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const calls = await getCalls();
      const liveCall = calls.find(c => c.status === 'in_progress') ?? calls[0] ?? null;
      const liveTurns = liveCall?.id ? await getConversation(liveCall.id) : [];
      if (!mounted) return;
      setCall(liveCall);
      setTurns(liveTurns);
    };
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return <LiveCallPanel call={call} turns={turns} />;
}
