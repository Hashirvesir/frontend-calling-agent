'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import TalkToSalesForm from './TalkToSalesForm';

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
      <DialogContent
        className="w-[calc(100%-32px)] max-w-[760px] p-6 sm:p-10 bg-[rgba(10,10,11,0.94)] backdrop-blur-2xl border border-[var(--border-2)] rounded-[20px] shadow-[var(--shadow-glass)] max-h-[92vh] overflow-y-auto ring-0"
        showClose={true}
      >
        <TalkToSalesForm onSuccess={() => setIsOpen(false)} showLogo={true} />
      </DialogContent>
    </Dialog>
  );
}
