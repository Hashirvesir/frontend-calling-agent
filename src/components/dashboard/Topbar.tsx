'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, LogOut, User, CreditCard } from 'lucide-react';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';

type PageMeta = { title: string; sub: string };

function getPageMeta(pathname: string): PageMeta {
  if (pathname === '/dashboard')
    return { title: 'Overview', sub: 'Invenco AI · Voice Platform' };
  if (pathname === '/dashboard/calls')
    return { title: 'Calls', sub: 'All call activity' };
  if (pathname.startsWith('/dashboard/calls/'))
    return { title: 'Call Detail', sub: 'Calls' };
  if (pathname === '/dashboard/agents/create')
    return { title: 'New Agent', sub: 'Agents' };
  if (pathname.endsWith('/edit'))
    return { title: 'Edit Agent', sub: 'Agents' };
  if (pathname === '/dashboard/agents')
    return { title: 'Agents', sub: 'AI call agents' };
  if (pathname.startsWith('/dashboard/agents/'))
    return { title: 'Agent Detail', sub: 'Agents' };
  if (pathname === '/dashboard/scripts')
    return { title: 'Scripts', sub: 'Call scripts' };
  if (pathname === '/dashboard/settings')
    return { title: 'Settings', sub: 'Account & configuration' };
  if (pathname === '/dashboard/profile')
    return { title: 'Profile', sub: 'Your account details' };
  if (pathname === '/dashboard/billing')
    return { title: 'Billing', sub: 'Plan & usage' };
  return { title: 'Dashboard', sub: 'Invenco AI' };
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { title, sub } = getPageMeta(pathname);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const initials = email ? email.slice(0, 2).toUpperCase() : '··';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-5" />

        {/* Dynamic page title */}
        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground leading-tight">{title}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{sub}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setCmdOpen(true)}
          >
            <Search className="size-3.5" />
            <kbd className="font-mono text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </Button>

          <NotificationBell />

          <Separator orientation="vertical" className="h-5 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-full cursor-pointer hover:bg-muted transition-colors outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-muted text-muted-foreground font-mono text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1.5">
                  {email || 'Loading…'}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <User className="size-3.5" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
                  <CreditCard className="size-3.5" />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
