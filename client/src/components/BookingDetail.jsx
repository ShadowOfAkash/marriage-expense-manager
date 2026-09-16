import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { 
  ArrowLeft, CalendarCheck, Calendar, IndianRupee, Tag, 
  Briefcase, User, AlignLeft, CreditCard, Plus, Pencil, 
  Trash2, Paperclip, ChevronDown, CheckCircle2, Clock, 
  ExternalLink, FileText, Unlink, MessageCircle, Phone, 
  Mail, MapPin, Check, Star, ShieldCheck
} from 'lucide-react';
import { api, fmt, formatDate, CATEGORIES, HIRING_STAGES } from '../utils/api';
import { TailwindModal } from './TailwindModal';
import { AddExpenseModal } from './SharedModals';
import { AttachPaymentModal } from './AttachPaymentModal';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState(null);
  const [detaching, setDetaching] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [bkList, expList] = await Promise.all([api.getBookings(), api.getExpenses()]);
      const found = (bkList || []).find(b => String(b.id) === String(id));
      if (!found) {
        toast({ title: 'Booking not found', status: 'error' });
        navigate('/bookings');
        return;
      }
      setBooking(found);
      setEditForm({
        ...found,
        category: found.category || 'Photography',
        hiring_stage: found.hiring_stage || 'Hired',
        deliverables: Array.isArray(found.deliverables) ? found.deliverables.join('\n') : (found.deliverables || '')
      });
      setExpenses(expList || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to load booking details', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Linked payments for this booking
  const linkedExpenses = useMemo(() => {
    if (!booking) return [];
    return expenses.filter(e => String(e.booking_id) === String(booking.id));
  }, [expenses, booking]);

  const totalAmount = Number(booking?.amount || 0);
  const advanceAmount = Number(booking?.advance || 0);
  const expensesPaid = linkedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPaid = expensesPaid > 0 ? expensesPaid : advanceAmount;
  const remainingDue = Math.max(0, totalAmount - totalPaid);
  const percentPaid = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

  const handleStageChange = async (newStage) => {
    try {
      await api.updateBookingStage(booking.id, newStage);
      setBooking(prev => ({ ...prev, hiring_stage: newStage }));
      setEditForm(prev => ({ ...prev, hiring_stage: newStage }));
      toast({ title: `Updated status to ${newStage}`, status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to update hiring stage', status: 'error' });
    }
  };

  const handleUpdate = async () => {
    if (!editForm.vendor || !editForm.service) {
      return toast({ title: 'Vendor and Service are required', status: 'warning' });
    }
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        deliverables: typeof editForm.deliverables === 'string'
          ? editForm.deliverables.split('\n').map(s => s.trim()).filter(Boolean)
          : editForm.deliverables
      };

      await api.updateBooking(booking.id, payload);
      setIsEditOpen(false);
      setBooking(prev => ({ ...prev, ...payload }));
      toast({ title: 'Vendor updated successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to update vendor', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBooking(booking.id);
      toast({ title: 'Vendor deleted successfully', status: 'success' });
      navigate('/bookings');
    } catch (err) {
      toast({ title: 'Failed to delete vendor', status: 'error' });
    }
  };

  const confirmDetach = (exp) => {
    setDetachTarget(exp);
  };

  const handleDetach = async () => {
    if (!detachTarget) return;
    const detachedId = detachTarget.id;
    setDetaching(true);
    try {
      await api.detachExpense(detachedId);
      setDetachTarget(null);
      setExpenses(prev => prev.map(e => e.id === detachedId ? { ...e, booking_id: null } : e));
      toast({ title: 'Payment detached from vendor', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to detach payment', description: err.message, status: 'error' });
    } finally {
      setDetaching(false);
    }
  };

  // WhatsApp Outreach Helper
  const sendWhatsApp = () => {
    if (!booking) return;
    const phone = (booking.phone || '').replace(/[^0-9]/g, '');
    const dateStr = booking.event_date ? `for our wedding on ${formatDate(booking.event_date)}` : 'for our upcoming wedding';
    const text = encodeURIComponent(
      `Namaste ${booking.contact_person || booking.vendor}! 🙏\n\n` +
      `Connecting with you regarding our wedding booking #${`BK-${String(booking.id).slice(-4)}`} for "${booking.service}" ${dateStr}.\n\n` +
      `Please let us know the next coordination milestone!\n— Sent via Marriage Expense Manager`
    );
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  if (loading || !booking) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-400 text-sm font-medium animate-pulse">Loading vendor details...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Back navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link 
            to="/bookings" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to All Vendors & Bookings
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              {booking.vendor}
            </h1>
            <span className="text-xs font-semibold text-[#234c6a] bg-[#234c6a]/10 px-2.5 py-0.5 rounded-md border border-[#234c6a]/20">
              #BK-{String(booking.id).slice(-4)}
            </span>
            <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-800 border border-zinc-200/80 font-bold text-xs">
              {booking.category || 'Miscellaneous'}
            </Chip>

            {/* Stage Selector Pill */}
            <div className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Stage:</span>
              <select
                value={booking.hiring_stage || 'Hired'}
                onChange={e => handleStageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
              >
                {HIRING_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-1">{booking.service}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            radius="sm"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
            onClick={sendWhatsApp}
          >
            <MessageCircle size={14} /> WhatsApp Outreach
          </Button>
          <Button 
            radius="sm" 
            size="sm"
            variant="outline" 
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs h-9"
            onClick={() => setIsAttachOpen(true)}
          >
            <Paperclip size={14} /> Attach Payment
          </Button>
          <Button 
            radius="sm" 
            size="sm"
            className="bg-zinc-900 text-white hover:bg-zinc-950 font-semibold text-xs h-9 shadow-xs"
            onClick={() => setIsPayOpen(true)}
          >
            <CreditCard size={14} /> Record Payment
          </Button>
          <Button 
            radius="sm" 
            size="sm"
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs h-9"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil size={14} /> Edit
          </Button>
          <Button 
            radius="sm" 
            size="sm"
            variant="light"
            className="text-rose-600 hover:bg-rose-50 font-semibold text-xs h-9"
            onClick={() => setIsDelOpen(true)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Contract Amount</div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">{fmt(totalAmount)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#234c6a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Initial Advance</div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">{fmt(advanceAmount)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Paid</div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">{fmt(totalPaid)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Remaining Due</div>
              <div className="text-2xl font-black text-amber-700 tracking-tight">{fmt(remainingDue)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Settlement Progress Card */}
      <Card className="p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Payment Progress</h3>
              <p className="text-xs text-zinc-500">
                {percentPaid >= 100 
                  ? 'This vendor contract is fully settled.' 
                  : `₹${fmt(remainingDue)} remaining to be cleared.`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-zinc-900">{percentPaid}%</span>
              <span className="text-xs text-zinc-500 ml-1.5 font-medium">({fmt(totalPaid)} / {fmt(totalAmount)})</span>
            </div>
          </div>

          <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                percentPaid >= 100 ? 'bg-emerald-600' : 'bg-[#234c6a]'
              }`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Main Grid: Details & Payments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vendor Profile, Contact & Logistics Cards */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* 1. Contact & Quick Connect Card */}
          <Card className="p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 pb-2.5 border-b border-zinc-100 flex items-center gap-2">
              <User size={16} className="text-[#234c6a]" /> Contact & Communication
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Contact Person</span>
                <span className="font-bold text-zinc-900">{booking.contact_person || 'Lead Representative'}</span>
              </div>

              {booking.phone && (
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Phone Number</span>
                  <div className="flex items-center justify-between">
                    <a href={`tel:${booking.phone}`} className="font-bold text-[#234c6a] hover:underline flex items-center gap-1.5">
                      <Phone size={12} /> {booking.phone}
                    </a>
                    <button
                      type="button"
                      onClick={sendWhatsApp}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {booking.email && (
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Email</span>
                  <a href={`mailto:${booking.email}`} className="font-medium text-zinc-700 hover:underline flex items-center gap-1.5">
                    <Mail size={12} className="text-zinc-400" /> {booking.email}
                  </a>
                </div>
              )}

              {booking.city && (
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">City / Location</span>
                  <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                    <MapPin size={12} className="text-zinc-400" /> {booking.city}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 2. Day-of Wedding Logistics Card */}
          <Card className="p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 pb-2.5 border-b border-zinc-100 flex items-center gap-2">
              <Clock size={16} className="text-amber-600" /> Day-of Logistics & Arrival
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Scheduled Arrival Time</span>
                <span className="font-black text-zinc-900 text-sm">
                  {booking.arrival_time || 'Pending Schedule'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Hall / Room Setup</span>
                <span className="font-medium text-zinc-700">
                  {booking.location_note || 'Main Venue Banquet'}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-0.5">Cash Handover Envelope</span>
                <span className="font-black text-amber-700 text-sm">
                  ₹{fmt(remainingDue)}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Prepare envelope for family custodian to disburse upon setup verification.
                </span>
              </div>
            </div>
          </Card>

          {/* 3. Contract Deliverables Checklist Card */}
          <Card className="p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 pb-2.5 border-b border-zinc-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" /> Contract Deliverables
            </h3>

            {Array.isArray(booking.deliverables) && booking.deliverables.length > 0 ? (
              <div className="space-y-2">
                {booking.deliverables.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-700 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                    <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-tight">{d}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">
                No itemized deliverables listed. Click Edit to add contract items.
              </p>
            )}

            {booking.notes && (
              <div className="mt-4 pt-3 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Notes</span>
                <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 leading-relaxed">
                  {booking.notes}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Linked Payments Table */}
        <div className="lg:col-span-2">
          <div className="border border-zinc-200/80 shadow-xs bg-white rounded-xl overflow-hidden">
            <div className="p-4 md:p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-zinc-600" /> Payment History
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {linkedExpenses.length} {linkedExpenses.length === 1 ? 'payment' : 'payments'} recorded for this booking
                </p>
              </div>
              <Button 
                radius="sm" 
                size="sm" 
                className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold"
                onClick={() => setIsPayOpen(true)}
              >
                <Plus size={14} /> Add Payment
              </Button>
            </div>

            {linkedExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-zinc-400 mb-3">No payments linked to this booking yet.</p>
                <div className="flex justify-center gap-2">
                  <Button 
                    radius="sm" 
                    size="sm" 
                    className="bg-zinc-900 text-white font-semibold text-xs"
                    onClick={() => setIsPayOpen(true)}
                  >
                    <Plus size={14} /> Record Payment
                  </Button>
                  <Button 
                    radius="sm" 
                    size="sm" 
                    variant="outline"
                    className="border-zinc-300 text-zinc-700 font-semibold text-xs"
                    onClick={() => setIsAttachOpen(true)}
                  >
                    <Paperclip size={14} /> Attach Existing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600">
                  <thead className="bg-zinc-50 text-zinc-700 font-bold border-b border-zinc-200/70">
                    <tr>
                      <th className="p-3.5">Payment Item</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Paid By</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-center">Receipt</th>
                      <th className="p-3.5 text-center">Detach</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {linkedExpenses
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map(exp => (
                        <tr key={exp.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-zinc-900 block">{exp.item}</span>
                            <span className="text-[10px] text-zinc-400">ID: #{exp.id}</span>
                          </td>
                          <td className="p-3.5 text-zinc-700">{formatDate(exp.date)}</td>
                          <td className="p-3.5 text-zinc-700">{exp.paid_by || 'Me'}</td>
                          <td className="p-3.5 text-right font-bold text-zinc-900">₹{fmt(exp.amount)}</td>
                          <td className="p-3.5 text-center">
                            {exp.receipt_url ? (
                              <a 
                                href={exp.receipt_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#234c6a] font-bold hover:underline"
                              >
                                View <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => confirmDetach(exp)}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                              title="Detach payment from this booking"
                            >
                              <Unlink size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {linkedExpenses.length > pageSize && (
              <div className="p-3 border-t border-zinc-100 bg-zinc-50/40">
                <TablePagination
                  totalItems={linkedExpenses.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      <TailwindModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title="Edit Vendor & Contract"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Vendor Name *</label>
              <input 
                type="text" 
                value={editForm.vendor || ''} 
                onChange={e => setEditForm(p => ({ ...p, vendor: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Service Provided *</label>
              <input 
                type="text" 
                value={editForm.service || ''} 
                onChange={e => setEditForm(p => ({ ...p, service: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Category</label>
              <select 
                value={editForm.category || 'Photography'} 
                onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Hiring Stage</label>
              <select 
                value={editForm.hiring_stage || 'Hired'} 
                onChange={e => setEditForm(p => ({ ...p, hiring_stage: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800"
              >
                {HIRING_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">City</label>
              <input 
                type="text" 
                value={editForm.city || ''} 
                onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Contract Amount (₹)</label>
              <input 
                type="number" 
                value={editForm.amount || ''} 
                onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-black" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Initial Advance (₹)</label>
              <input 
                type="number" 
                value={editForm.advance || ''} 
                onChange={e => setEditForm(p => ({ ...p, advance: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-black text-emerald-700" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Event Date</label>
              <input 
                type="date" 
                value={editForm.event_date || ''} 
                onChange={e => setEditForm(p => ({ ...p, event_date: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Contact Person</label>
              <input 
                type="text" 
                value={editForm.contact_person || ''} 
                onChange={e => setEditForm(p => ({ ...p, contact_person: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Phone Number</label>
              <input 
                type="text" 
                value={editForm.phone || ''} 
                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
            <h4 className="text-xs font-bold text-zinc-800 mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" /> Day-of Wedding Logistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Arrival Time</label>
                <input 
                  type="text" 
                  value={editForm.arrival_time || ''} 
                  onChange={e => setEditForm(p => ({ ...p, arrival_time: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs" 
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Setup Hall / Room</label>
                <input 
                  type="text" 
                  value={editForm.location_note || ''} 
                  onChange={e => setEditForm(p => ({ ...p, location_note: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">Deliverables Checklist (One per line)</label>
            <textarea 
              rows={3} 
              value={editForm.deliverables || ''} 
              onChange={e => setEditForm(p => ({ ...p, deliverables: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button radius="sm" size="sm" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              radius="sm" 
              size="sm" 
              className="bg-[#1b3c53] hover:bg-[#234c6a] text-white font-bold text-xs" 
              onClick={handleUpdate} 
              isLoading={saving}
            >
              Update Vendor
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Delete Confirm Modal */}
      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Vendor?">
        <div className="p-2 space-y-3">
          <p className="text-zinc-600 text-xs">Are you sure you want to permanently delete this vendor record?</p>
          <div className="flex justify-end gap-2">
            <Button radius="sm" size="sm" variant="outline" onClick={() => setIsDelOpen(false)} className="text-xs">Cancel</Button>
            <Button radius="sm" size="sm" className="bg-rose-600 text-white font-bold text-xs" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Detach Confirm Modal */}
      <TailwindModal isOpen={!!detachTarget} onClose={() => setDetachTarget(null)} title="Detach Payment?">
        <div className="p-2 space-y-3">
          <p className="text-zinc-600 text-xs">
            Detach payment "{detachTarget?.item}" (₹{fmt(detachTarget?.amount)}) from this vendor? The payment will remain in your Payments tab.
          </p>
          <div className="flex justify-end gap-2">
            <Button radius="sm" size="sm" variant="outline" onClick={() => setDetachTarget(null)} className="text-xs">Cancel</Button>
            <Button radius="sm" size="sm" className="bg-amber-600 text-white font-bold text-xs" isLoading={detaching} onClick={handleDetach}>
              Confirm Detach
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Modals for Adding / Attaching Payments */}
      <AttachPaymentModal 
        isOpen={isAttachOpen} 
        onClose={() => setIsAttachOpen(false)} 
        booking={booking} 
        onSuccess={loadData} 
      />
      <AddExpenseModal 
        isOpen={isPayOpen} 
        onClose={() => setIsPayOpen(false)} 
        prefillBookingId={booking.id} 
        onSuccess={loadData} 
      />
    </div>
  );
}
