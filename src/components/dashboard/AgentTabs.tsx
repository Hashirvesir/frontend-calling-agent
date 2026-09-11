'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, SlidersHorizontal, TableProperties } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Overview',       icon: LayoutDashboard,    href: (id: string) => `/dashboard/agents/${id}` },
  { label: 'Model Config',   icon: SlidersHorizontal,  href: (id: string) => `/dashboard/agents/${id}/model` },
  { label: 'Extracted Data', icon: TableProperties,    href: (id: string) => `/dashboard/agents/${id}/extractions` },
];

export default function AgentTabs({ agentId }: { agentId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border pb-0 -mb-6">
      {TABS.map(tab => {
        const href = tab.href(agentId);
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
