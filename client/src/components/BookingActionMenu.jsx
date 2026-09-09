import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Paperclip, CreditCard, Trash2 } from 'lucide-react';

export function BookingActionMenu({ onView, onAttachPayment, onRecordPayment, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        type="button"
        title="More Actions"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer focus:outline-none"
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200/90 shadow-xl rounded-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* A. View */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onView(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Eye size={14} className="text-zinc-500 shrink-0" />
            <span>View Details</span>
          </button>

          {/* B. Attach Payment */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onAttachPayment(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Paperclip size={14} className="text-zinc-500 shrink-0" />
            <span>Attach Payment</span>
          </button>

          {/* C. Record Payment */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onRecordPayment(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <CreditCard size={14} className="text-zinc-500 shrink-0" />
            <span>Record Payment</span>
          </button>

          <div className="h-px bg-zinc-100 my-1 mx-2" />

          {/* D. Delete */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onDelete(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} className="text-rose-500 shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
