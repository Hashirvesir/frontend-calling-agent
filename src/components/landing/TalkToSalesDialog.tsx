'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TalkToSalesForm from './TalkToSalesForm';
import { Headphones } from 'lucide-react';

type Props = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function TalkToSalesDialog({ children, open: controlledOpen, onOpenChange: setControlledOpen }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger>{children}</DialogTrigger>}
      <DialogContent className="max-w-xl p-5 sm:p-7 bg-[var(--surface-1)] border-[var(--border-2)] shadow-[var(--shadow-glass)] rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 text-left mb-2">
          <div className="flex items-center gap-2">
            <span className="pill" style={{ height: '20px', fontSize: '10px' }}>
              <Headphones className="size-3 text-chart-1" /> ENTERPRISE SALES
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Talk to our Voice AI Team
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Scale your telephony operations with dedicated infrastructure, custom accents, and guaranteed SLAs.
          </DialogDescription>
        </DialogHeader>

        <TalkToSalesForm onSuccess={() => {}} />
      </DialogContent>
    </Dialog>
  );
}
