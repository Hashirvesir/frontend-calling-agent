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
      <DialogContent className="max-w-lg p-6 bg-black border border-white/10 text-white rounded-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left mb-3">
          <DialogTitle className="text-xl font-semibold text-white">
            Talk to Sales
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Tell us about your business and expected call volume.
          </DialogDescription>
        </DialogHeader>

        <TalkToSalesForm />
      </DialogContent>
    </Dialog>
  );
}
