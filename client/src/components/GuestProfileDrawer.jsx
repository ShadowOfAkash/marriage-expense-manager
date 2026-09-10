import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, Users, CalendarCheck, CheckCircle2, 
  XCircle, Clock, Tag, Heart, Sparkles, Edit, 
  Trash2, ShieldCheck, AlertCircle, Baby, Check, ExternalLink,
  Copy, Download, Send
} from 'lucide-react';
import { formatDate, WEDDING_EVENTS } from '../utils/api';

export function GuestProfileDrawer({ 
  isOpen, 
  onClose, 
  guest, 
  allGuests = [], 
  onEdit, 
  onToggleCheckIn, 
  onDelete, 
  onSelectGuest,
  onUpdateEvents,
  onSendInvitation,
  onChangeRsvp
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  if (!isOpen || !guest) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/rsvp/${guest.rsvp_token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isAttended = guest.actual_attendance === 'Attended' || guest.check_in_status;

  // Find other household members
  const householdMembers = guest.household_name 
    ? allGuests.filter(g => g.household_name && g.household_name.toLowerCase() === guest.household_name.toLowerCase() && g.id !== guest.id)
    : [];

  const handleEventToggle = (eventTitle) => {
    if (!onUpdateEvents) return;
    const current = Array.isArray(guest.events) ? [...guest.events] : [];
    const exists = current.includes(eventTitle);
    const updated = exists ? current.filter(e => e !== eventTitle) : [...current, eventTitle];
    onUpdateEvents(guest.id, updated);
  };

  // Avatar Initials & Color
  const initials = guest.name
    ? guest.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'G';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-250">
        
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-[#234c6a] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900 truncate">{guest.name}</h2>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {guest.relationship_category || 'Family'}
                </span>
                {guest.guest_type && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {guest.guest_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleCheckIn(guest)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                isAttended 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {isAttended ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Check size={14} />}
              <span>{isAttended ? 'Attended ✓' : 'Mark Attended'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              title="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* 1. RSVP & Attendance Status Card */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                    guest.rsvp_status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    guest.rsvp_status === 'Maybe' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    guest.rsvp_status === 'Declined' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    guest.rsvp_status === 'Invited' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-zinc-100 text-zinc-800 border border-zinc-200'
                  }`}>
                    {(guest.rsvp_status === 'Not Responded' || !guest.rsvp_status) ? 'Pending Invitation' : guest.rsvp_status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Attendance</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                    isAttended ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    guest.actual_attendance === 'Did Not Attend' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    'bg-zinc-100 text-zinc-700 border border-zinc-200'
                  }`}>
                    {isAttended ? 'Attended' : (guest.actual_attendance || 'Pending')}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual RSVP Marking Chips */}
            {onChangeRsvp && (
              <div className="pt-2 border-t border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Mark Status Manually:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Invited', 'Confirmed', 'Maybe', 'Declined'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChangeRsvp(guest.id, st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                        guest.rsvp_status === st
                          ? st === 'Confirmed' ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' :
                            st === 'Invited' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' :
                            st === 'Maybe' ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' :
                            'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {st === 'Confirmed' && '✓ '}
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600">
              <div>
                <span className="text-zinc-500">Expected Headcount: </span>
                <strong className="text-zinc-900">
                  {guest.expected_attendees || (Number(guest.expected_adults||1) + Number(guest.expected_children||0))}
                </strong>
                <span className="text-zinc-400 ml-1">
                  ({guest.expected_adults || 1} Adults{Number(guest.expected_children) > 0 ? `, ${guest.expected_children} Children` : ''})
                </span>
              </div>

              {isAttended && (
                <div>
                  <span className="text-zinc-500">Actual Attended: </span>
                  <strong className="text-emerald-800">
                    {guest.actual_attendees || guest.expected_attendees || 1}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Email & PDF Card Action Box */}
          <div className="p-4 rounded-xl border border-[#c59b27]/40 bg-[#fcfbf7] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b3c53] uppercase tracking-wider">
                <Mail size={14} className="text-[#c59b27]" />
                <span>Invitation & PDF Card</span>
              </div>

              {guest.invitation_sent_at ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Sent {formatDate(guest.invitation_sent_at.split('T')[0])}</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                  Not Invited Yet
                </span>
              )}
            </div>

            {guest.rsvp_response_note && (
              <div className="p-2.5 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong className="block text-[10px] uppercase tracking-wider text-amber-700">Guest Message / Wishes:</strong>
                <p className="mt-0.5 italic">"{guest.rsvp_response_note}"</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onSendInvitation && (
                <button
                  type="button"
                  onClick={() => onSendInvitation(guest)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#1b3c53] hover:bg-[#132e40] text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <Mail size={13} className="text-[#f3e5ab]" />
                  <span>{guest.invitation_sent_at ? 'Resend Invitation' : 'Send Invitation Email'}</span>
                </button>
              )}

              <a
                href={`/api/guests/${guest.id}/invitation-pdf`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white hover:bg-zinc-50 text-[#1b3c53] border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
              >
                <Download size={13} className="text-[#c59b27]" />
                <span>Download PDF Card</span>
              </a>
            </div>

            {/* Quick Links (Copy Invitation Link & Preview Portal) */}
            <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
              >
                {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}</span>
              </button>

              <a
                href={`/rsvp/${guest.rsvp_token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#234c6a] hover:underline"
              >
                <span>View Guest Invitation Page</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* 2. Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <User size={14} className="text-[#234c6a]" />
              <span>Contact & Demographics</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200 bg-white">
                <span className="text-zinc-400 text-[11px]">Phone</span>
                <div className="mt-0.5 font-medium text-zinc-800">
                  {guest.phone ? (
                    <a href={`tel:${guest.phone}`} className="hover:underline text-[#234c6a] flex items-center gap-1">
                      <Phone size={12} />
                      <span>{guest.phone}</span>
                    </a>
                  ) : '—'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 bg-white">
                <span className="text-zinc-400 text-[11px]">Email</span>
                <div className="mt-0.5 font-medium text-zinc-800 truncate">
                  {guest.email ? (
                    <a href={`mailto:${guest.email}`} className="hover:underline text-[#234c6a] flex items-center gap-1 truncate">
                      <Mail size={12} />
                      <span className="truncate">{guest.email}</span>
                    </a>
                  ) : '—'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 bg-white">
                <span className="text-zinc-400 text-[11px]">Gender</span>
                <div className="mt-0.5 font-medium text-zinc-800">{guest.gender || 'Not specified'}</div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 bg-white">
                <span className="text-zinc-400 text-[11px]">Age Group</span>
                <div className="mt-0.5 font-medium text-zinc-800">{guest.age_group || 'Adult'}</div>
              </div>
            </div>
          </div>

          {/* 3. Guest Type & Family Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Users size={14} className="text-[#234c6a]" />
                <span>Guest Type & Family Members</span>
              </h4>
              <span className="text-xs font-bold text-[#234c6a] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                {guest.guest_type || 'Individual'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Category:</span>
                <span className="font-semibold text-zinc-800">{guest.relationship_category || 'Family'}</span>
              </div>

              {guest.plus_one_allowed && (
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Plus-One Allowed:</span>
                  <span className="font-semibold text-emerald-700">
                    Yes {guest.plus_one_name ? `(${guest.plus_one_name})` : '(Name pending)'}
                  </span>
                </div>
              )}
            </div>

            {/* Dependent Family Members */}
            {Array.isArray(guest.dependents) && guest.dependents.length > 0 && (
              <div className="mt-2 space-y-2">
                <span className="text-xs text-zinc-600 font-semibold block">
                  Family Members & Dependents ({guest.dependents.length}):
                </span>
                <div className="space-y-1.5">
                  {guest.dependents.map((dep, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#234c6a]/15 text-[#234c6a] flex items-center justify-center font-bold text-[10px]">
                          {dep.name ? dep.name[0].toUpperCase() : 'D'}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">{dep.name || 'Dependent'}</div>
                          <div className="text-[10px] text-zinc-500">{dep.age_group || 'Adult'}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-zinc-200 text-zinc-700">
                        {dep.relation || 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Wedding Events Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <CalendarCheck size={14} className="text-[#234c6a]" />
                <span>Wedding Events Participation</span>
              </h4>
              <span className="text-[11px] text-zinc-400">Click to toggle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WEDDING_EVENTS.map(ev => {
                const assigned = Array.isArray(guest.events) && guest.events.includes(ev);
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => handleEventToggle(ev)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      assigned 
                        ? 'bg-[#234c6a]/10 border-[#234c6a] text-[#1b3c53]' 
                        : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{ev}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      assigned ? 'bg-[#234c6a] text-white' : 'border border-zinc-300'
                    }`}>
                      {assigned && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Tags */}
          {Array.isArray(guest.tags) && guest.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Tag size={14} className="text-[#234c6a]" />
                <span>Tags</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {guest.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 7. Future AI Photo Tagging Preview Card */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 text-indigo-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                <span className="font-bold text-xs">AI Facial Recognition Ready</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                Phase 3
              </span>
            </div>
            <p className="text-xs text-indigo-900/80">
              Face identity profile initialized for automatic matching once wedding ceremony photos are uploaded.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 text-xs">
              <span className="text-indigo-600">Guest Name:</span>
              <strong className="text-indigo-900">{guest.name}</strong>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onDelete(guest)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit(guest)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#234c6a] text-white hover:bg-[#1b3c53] shadow-2xs transition-colors cursor-pointer"
            >
              <Edit size={14} />
              <span>Edit Guest</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
