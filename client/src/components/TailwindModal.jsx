import React from 'react';
import { Button } from '@heroui/react';
import { X } from 'lucide-react';

export function TailwindModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="font-bold text-xl text-zinc-900">{title}</div>
          <Button isIconOnly variant="light" size="sm" className="text-zinc-400 hover:text-zinc-900" onClick={onClose}><X size={20} /></Button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
