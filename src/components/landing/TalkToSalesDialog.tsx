'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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

  const trigger = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (children as any).props?.onClick?.(e);
          setIsOpen(true);
        },
      })
    : children ? (
        <span onClick={() => setIsOpen(true)} style={{ display: 'contents', cursor: 'pointer' }}>
          {children}
        </span>
      ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <DialogContent
        className="w-[calc(100%-32px)] max-w-[760px] p-6 sm:p-10 bg-[rgba(10,10,11,0.94)] backdrop-blur-2xl border border-[var(--border-2)] rounded-[20px] shadow-[var(--shadow-glass)] max-h-[92vh] overflow-y-auto ring-0"
        showClose={true}
      >
        <TalkToSalesForm onSuccess={() => setIsOpen(false)} showLogo={true} />
      </DialogContent>
    </Dialog>
  );
}
