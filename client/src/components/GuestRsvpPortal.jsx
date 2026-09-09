import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Heart, CheckCircle2, AlertCircle, Clock, 
  Download, Calendar, Users, Send, Sparkles, MessageSquare 
} from 'lucide-react';
import { api } from '../utils/api';

export default function GuestRsvpPortal() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const directAction = searchParams.get('action'); // 'Confirmed' | 'Maybe' | 'Declined'

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [guest, setGuest] = useState(null);

  // Form State
  const [selectedStatus, setSelectedStatus] = useState('Confirmed');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoading(true);
        setError('');
        const data = await api.getPublicRsvp(token);
        setGuest(data);
        
        // Pre-select status from URL or existing response
        if (directAction && ['Confirmed', 'Maybe', 'Declined'].includes(directAction)) {
          setSelectedStatus(directAction);
        } else if (data.rsvp_status && data.rsvp_status !== 'Invited' && data.rsvp_status !== 'Not Responded' && data.rsvp_status !== 'Pending Invitation') {
          setSelectedStatus(data.rsvp_status);
        } else {
          setSelectedStatus('Confirmed');
        }

        setAdults(Number(data.expected_adults) || 1);
        setChildren(Number(data.expected_children) || 0);
        setNote(data.rsvp_response_note || '');

        // If direct action provided via email click and not yet confirmed with that action, auto submit!
        if (directAction && ['Confirmed', 'Maybe', 'Declined'].includes(directAction) && data.rsvp_status !== directAction) {
          try {
            const expTotal = (Number(data.expected_adults) || 1) + (Number(data.expected_children) || 0);
            await api.submitPublicRsvp(token, {
              rsvp_status: directAction,
              expected_adults: Number(data.expected_adults) || 1,
              expected_children: Number(data.expected_children) || 0,
              expected_attendees: expTotal,
              rsvp_response_note: data.rsvp_response_note || ''
            });
            setGuest(prev => ({ ...prev, rsvp_status: directAction }));
            setSuccessMsg(
              directAction === 'Confirmed' 
                ? 'Your attendance has been joyfully confirmed! Thank you.' 
                : directAction === 'Maybe'
                ? 'Your response has been noted as tentative. We hope to see you!'
                : 'Thank you for letting us know. You will be missed!'
            );
          } catch (autoErr) {
            console.warn('Auto response submission failed:', autoErr.message);
          }
        }
      } catch (err) {
        setError(err.message || 'Invitation not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
  }, [token, directAction]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const expTotal = Number(adults) + Number(children);
      const res = await api.submitPublicRsvp(token, {
        rsvp_status: selectedStatus,
        expected_adults: Number(adults),
        expected_children: Number(children),
        expected_attendees: expTotal,
        rsvp_response_note: note.trim()
      });
      setGuest(res.guest);
      setSuccessMsg(res.message || 'Thank you! Your attendance response has been recorded.');
    } catch (err) {
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#102231] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#c59b27] border-t-transparent animate-spin mb-4" />
        <p className="text-white font-serif text-lg tracking-wide">Opening Your Wedding Invitation...</p>
      </div>
    );
  }

  if (error && !guest) {
    return (
      <div className="min-h-screen bg-[#102231] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full border border-white/20 shadow-2xl text-white">
          <AlertCircle size={48} className="mx-auto mb-3 text-rose-400" />
          <h2 className="text-xl font-bold font-serif">Invitation Not Found</h2>
          <p className="text-zinc-300 text-sm mt-2">{error}</p>
          <p className="text-xs text-zinc-400 mt-4">Please check the link provided in your invitation email or contact the wedding hosts.</p>
        </div>
      </div>
    );
  }

  const isConfirmed = guest?.rsvp_status === 'Confirmed' || selectedStatus === 'Confirmed';
  const dependentsList = Array.isArray(guest?.dependents) ? guest.dependents : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2130] via-[#1b3c53] to-[#0d1b28] py-8 px-4 flex flex-col items-center justify-center">
      {/* Royal Card Container */}
      <div className="w-full max-w-2xl bg-[#fcfbf7] rounded-2xl shadow-2xl overflow-hidden border-2 border-[#c59b27]/70 relative">
        
        {/* Decorative Top Banner */}
        <div className="bg-[#1b3c53] text-center py-8 px-6 border-b-3 border-[#c59b27] relative">
          <div className="text-[#f3e5ab] text-xs font-bold tracking-[0.25em] uppercase mb-1">
            ✦ WEDDING CELEBRATION ✦
          </div>
          <h1 className="text-white font-serif text-2xl md:text-3xl font-bold tracking-tight">
            The Wedding Celebrations
          </h1>
          <p className="text-zinc-300 text-xs mt-2 italic">
            Together with their families, cordially invite you to celebrate
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">

          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-start gap-3 shadow-xs">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Status: {guest?.rsvp_status}</div>
                <div className="text-xs mt-0.5">{successMsg}</div>
              </div>
            </div>
          )}

          {/* Honored Guest Section */}
          <div className="text-center pb-5 border-b border-zinc-200">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">HONORED GUEST</div>
            <div className="text-2xl md:text-3xl font-bold text-[#1b3c53] font-serif mt-1">
              {guest?.name}
            </div>

            {dependentsList.length > 0 ? (
              <div className="mt-2 text-xs text-[#c59b27] font-semibold">
                Accompanied by beloved family: {dependentsList.map(d => d.name).filter(Boolean).join(', ')}
              </div>
            ) : guest?.guest_type === 'Family' ? (
              <div className="mt-2 text-xs text-[#c59b27] font-semibold">
                Invited with Family
              </div>
            ) : null}

            {/* PDF Download Button */}
            <div className="mt-4 flex justify-center">
              <a
                href={`/api/guests/${guest?.id}/invitation-pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#234c6a]/10 hover:bg-[#234c6a]/15 text-[#1b3c53] text-xs font-bold transition-colors border border-[#234c6a]/20 cursor-pointer"
              >
                <Download size={14} className="text-[#c59b27]" />
                <span>Download Invitation Card (PDF)</span>
              </a>
            </div>
          </div>

          {/* Invited Ceremonies & Events */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-center">
            <div className="text-xs font-bold text-[#1b3c53] uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2.5">
              <Calendar size={14} className="text-[#c59b27]" />
              <span>Invited Ceremonies & Events</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(guest?.events || ['Mehendi', 'Haldi', 'Wedding']).map(ev => (
                <span 
                  key={ev}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-zinc-200 text-zinc-800 shadow-2xs"
                >
                  ✦ {ev}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive RSVP Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Will you be attending?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Joyfully Accept */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Confirmed')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedStatus === 'Confirmed'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                      <span>Joyfully Accept</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Yes, I am attending!</div>
                  </div>
                  {selectedStatus === 'Confirmed' && (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  )}
                </button>

                {/* 2. Tentative */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Maybe')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedStatus === 'Maybe'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-amber-800">Tentative</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Might attend (Maybe)</div>
                  </div>
                  {selectedStatus === 'Maybe' && (
                    <Clock size={18} className="text-amber-600 shrink-0" />
                  )}
                </button>

                {/* 3. Regretfully Decline */}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Declined')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedStatus === 'Declined'
                      ? 'border-rose-600 bg-rose-50/70 text-rose-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-rose-800">Decline</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Cannot make it</div>
                  </div>
                  {selectedStatus === 'Declined' && (
                    <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Headcount adjustment if attending or maybe */}
            {selectedStatus !== 'Declined' && (
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  <Users size={14} className="text-[#234c6a]" />
                  <span>Expected Attendees from your party</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={adults}
                      onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white font-mono font-bold text-center focus:outline-none focus:border-[#234c6a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={children}
                      onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white font-mono font-bold text-center focus:outline-none focus:border-[#234c6a]"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">Total Headcount</label>
                    <div className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-zinc-100/70 font-mono font-black text-center flex items-center justify-center text-zinc-900">
                      {Number(adults) + Number(children)} Guests
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wishes / Personal Note */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#234c6a]" />
                <span>Message & Blessings for the Couple (Optional)</span>
              </label>
              <textarea
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your wishes, blessings, or dietary notes..."
                className="w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a] bg-white resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1b3c53] hover:bg-[#132d3f] text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send size={16} className="text-[#f3e5ab]" />
              <span>{submitting ? 'Submitting Response...' : 'Confirm Attendance'}</span>
            </button>
          </form>

          {/* Footer closing */}
          <div className="text-center pt-4 border-t border-zinc-200 text-xs text-zinc-400">
            <span>Marriage Manager • Auspicious Celebrations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
