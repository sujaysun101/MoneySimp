
// src/components/shared/ChartModal.tsx
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Optional: if you want a description
} from "@/components/ui/dialog";

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
}

export function ChartModal({ isOpen, onClose, title, children, description }: ChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] h-[80vh] flex flex-col p-2 sm:p-4">
        <DialogHeader className="px-2 pt-2 sm:px-4 sm:pt-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-grow overflow-auto"> {/* Removed p-4, padding handled by DialogContent or specific chart needs */}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

