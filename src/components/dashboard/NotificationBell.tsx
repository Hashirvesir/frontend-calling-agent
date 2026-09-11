'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, PhoneIncoming, PhoneOutgoing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCalls } from '@/lib/api';
import type { CallRecord } from '@/lib/api';

type Notif = {
  id: string;
  number: string;
  direction: 'inbound' | 'outbound';
  at: string;
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    async function poll() {
      const calls = await getCalls();
      if (!calls.length) return;

      if (!initializedRef.current) {
        calls.forEach(c => seenRef.current.add(c.id));
        initializedRef.current = true;
        return;
      }

      const fresh = calls.filter(c => !seenRef.current.has(c.id));
      if (!fresh.length) return;

      fresh.forEach(call => {
        seenRef.current.add(call.id);
        const number =
          call.direction === 'inbound' ? call.from_number : call.to_number;

        const notif: Notif = {
          id: call.id,
          number: number ?? 'Unknown',
          direction: call.direction,
          at: call.started_at ?? new Date().toISOString(),
        };

        setNotifs(prev => [notif, ...prev].slice(0, 30));
        setUnread(prev => prev + 1);

        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          new Notification(
            call.direction === 'inbound' ? 'Incoming Call' : 'Outbound Call',
            { body: `${call.direction === 'inbound' ? 'From' : 'To'}: ${number ?? 'Unknown'}` }
          );
        }
      });
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  function toggleOpen() {
    setOpen(v => {
      if (!v) setUnread(0);
      return !v;
    });
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground relative"
        onClick={toggleOpen}
      >
        <Bell className="size-3.5" />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full bg-chart-5 text-white font-bold"
            style={{ minWidth: 14, height: 14, fontSize: 9, padding: '0 3px' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              <div className="flex items-center gap-2">
                {notifs.length > 0 && (
                  <button
                    onClick={() => setNotifs([])}
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="size-3" />
                </button>
              </div>
            </div>

            {/* List */}
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Bell className="size-5 opacity-25" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifs.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background:
                          n.direction === 'inbound'
                            ? 'rgba(0,229,160,0.12)'
                            : 'rgba(99,102,241,0.12)',
                      }}
                    >
                      {n.direction === 'inbound' ? (
                        <PhoneIncoming
                          className="size-3"
                          style={{ color: 'var(--chart-2)' }}
                        />
                      ) : (
                        <PhoneOutgoing
                          className="size-3"
                          style={{ color: 'var(--chart-4)' }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">
                        {n.direction === 'inbound' ? 'Incoming Call' : 'Outbound Call'}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground truncate">
                        {n.number}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {timeAgo(n.at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
