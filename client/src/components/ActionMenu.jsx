import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, Unlink } from 'lucide-react';

export function ActionMenu({ onEdit, onDelete, onDetach }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
        aria-label="Actions"
      >
        <MoreVertical size={18} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-zinc-200 shadow-xl rounded-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Pencil size={14} className="text-zinc-500" /> Edit
          </button>
          {onDetach && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDetach(); }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Unlink size={14} className="text-zinc-500" /> Detach Booking
            </button>
          )}
          <div className="h-px bg-zinc-100 mx-2"></div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} className="text-red-500" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
