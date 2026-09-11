'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Phone, Bot, FileText, Settings, Search, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',  sub: 'Dashboard home',   href: '/dashboard' },
  { icon: Phone,           label: 'Calls',     sub: 'All call history', href: '/dashboard/calls' },
  { icon: Bot,             label: 'Agents',    sub: 'AI call agents',   href: '/dashboard/agents' },
  { icon: FileText,        label: 'Scripts',   sub: 'Call scripts',     href: '/dashboard/scripts' },
  { icon: Settings,        label: 'Settings',  sub: 'Account & config', href: '/dashboard/settings' },
];

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = NAV.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.sub.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) go(results[active].href);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />

        {/* Popup */}
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-[18%] z-50 w-full max-w-[480px] -translate-x-1/2',
            'rounded-2xl border border-sidebar-border/60 bg-sidebar shadow-2xl',
            'overflow-hidden outline-none',
            'transition duration-150',
            'data-starting-style:opacity-0 data-starting-style:-translate-x-1/2 data-starting-style:scale-[0.97]',
            'data-ending-style:opacity-0 data-ending-style:-translate-x-1/2 data-ending-style:scale-[0.97]',
          )}
          onKeyDown={handleKey}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>

          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-sidebar-border/60 px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground/40" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search pages…"
              className={cn(
                'flex-1 bg-transparent text-[13px] text-sidebar-foreground placeholder:text-muted-foreground/40',
                'outline-none border-none',
              )}
            />
            <kbd className="font-mono text-[10px] text-muted-foreground/40 bg-muted/40 border border-border/40 rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="flex flex-col py-1.5">
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/40">
                <Search className="size-5" />
                <span className="font-mono text-[11px] uppercase tracking-widest">No results</span>
              </div>
            ) : (
              <>
                <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/35 uppercase px-4 py-1.5">
                  Navigation
                </p>
                {results.map((item, i) => {
                  const isActive = i === active;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item.href)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-lg text-left transition-colors duration-100',
                        isActive
                          ? 'bg-chart-1/8 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                      )}
                    >
                      <div className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-chart-1/15 text-chart-1' : 'bg-muted/40 text-muted-foreground',
                      )}>
                        <item.icon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-medium leading-tight">{item.label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/60 mt-0.5">{item.sub}</span>
                      </div>
                      {isActive && (
                        <ArrowRight className="size-3.5 shrink-0 text-chart-1" />
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-4 border-t border-sidebar-border/40 px-4 py-2">
            <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground/30 uppercase flex items-center gap-1.5">
              <kbd className="bg-muted/30 border border-border/30 rounded px-1 py-px text-[9px]">↑↓</kbd>
              navigate
            </span>
            <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground/30 uppercase flex items-center gap-1.5">
              <kbd className="bg-muted/30 border border-border/30 rounded px-1 py-px text-[9px]">↵</kbd>
              open
            </span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
