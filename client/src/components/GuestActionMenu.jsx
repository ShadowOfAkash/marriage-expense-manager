import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, Eye, Edit, CheckCircle2, XCircle, Trash2, 
  Mail, Download, Clock, Check, X, Send, ChevronRight 
} from 'lucide-react';

export function GuestActionMenu({ 
  guest, 
  onView, 
  onEdit, 
  onToggleCheckIn, 
  onDelete,
  onSendInvitation,
  onDownloadPdf,
  onChangeRsvp
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRsvpSubmenu, setShowRsvpSubmenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowRsvpSubmenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isAttended = guest?.actual_attendance === 'Attended' || guest?.check_in_status;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        type="button"
        title="More Actions"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          setShowRsvpSubmenu(false);
        }}
        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer focus:outline-none"
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-52 bg-white border border-zinc-200/90 shadow-xl rounded-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
        >
          {/* 1. View Profile */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onView(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Eye size={14} className="text-[#234c6a] shrink-0" />
            <span>View Profile</span>
          </button>

          {/* 2. Send Invitation Email */}
          {onSendInvitation && (
            <button 
              type="button"
              onClick={() => { setIsOpen(false); onSendInvitation(); }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1b3c53] hover:bg-sky-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Mail size={14} className="text-[#234c6a] shrink-0" />
              <span>{guest?.invitation_sent_at ? 'Resend Invitation' : 'Send Invitation'}</span>
            </button>
          )}

          {/* 3. Download Invitation PDF */}
          {onDownloadPdf && (
            <button 
              type="button"
              onClick={() => { setIsOpen(false); onDownloadPdf(); }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Download size={14} className="text-[#c59b27] shrink-0" />
              <span>Download PDF Card</span>
            </button>
          )}

          {/* 4. Edit */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onEdit(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Edit size={14} className="text-zinc-500 shrink-0" />
            <span>Edit Guest</span>
          </button>

          {/* 5. Quick RSVP Status Change */}
          {onChangeRsvp && (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowRsvpSubmenu(!showRsvpSubmenu)}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-zinc-500 shrink-0" />
                  <span>Mark Status</span>
                </div>
                <ChevronRight size={13} className="text-zinc-400" />
              </button>

              {showRsvpSubmenu && (
                <div className="bg-zinc-50 border-y border-zinc-200 py-1 px-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowRsvpSubmenu(false); onChangeRsvp('Pending Invitation'); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-zinc-200 text-zinc-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock size={12} className="text-zinc-500" />
                    <span>Pending Invitation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowRsvpSubmenu(false); onChangeRsvp('Invited'); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-blue-100 text-blue-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Mail size={12} className="text-blue-600" />
                    <span>Invited</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowRsvpSubmenu(false); onChangeRsvp('Confirmed'); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-emerald-100 text-emerald-800 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Confirmed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowRsvpSubmenu(false); onChangeRsvp('Maybe'); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-amber-100 text-amber-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock size={12} className="text-amber-600" />
                    <span>Maybe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setShowRsvpSubmenu(false); onChangeRsvp('Declined'); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-rose-100 text-rose-800 flex items-center gap-2 cursor-pointer"
                  >
                    <XCircle size={12} className="text-rose-600" />
                    <span>Declined</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. Check-In / Attendance Toggle */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onToggleCheckIn(); }}
            className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
              isAttended ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {isAttended ? (
              <>
                <XCircle size={14} className="text-amber-600 shrink-0" />
                <span>Mark Not Attended</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Mark Attended</span>
              </>
            )}
          </button>

          <div className="h-px bg-zinc-100 my-1 mx-2" />

          {/* 7. Delete */}
          <button 
            type="button"
            onClick={() => { setIsOpen(false); onDelete(); }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} className="text-rose-500 shrink-0" />
            <span>Delete Guest</span>
          </button>
        </div>
      )}
    </div>
  );
}

