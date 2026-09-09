import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { 
  ArrowLeft, CalendarCheck, Calendar, IndianRupee, Tag, 
  Briefcase, User, AlignLeft, CreditCard, Plus, Pencil, 
  Trash2, Paperclip, ChevronDown, CheckCircle2, Clock, 
  ExternalLink, FileText, Unlink
} from 'lucide-react';
import { api, fmt, formatDate, CATEGORIES } from '../utils/api';
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
      setEditForm({ ...found, category: found.category || 'Photography' });
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

  const handleUpdate = async () => {
    if (!editForm.vendor || !editForm.service) {
      return toast({ title: 'Vendor and Service are required', status: 'warning' });
    }
    setSaving(true);
    try {
      await api.updateBooking(booking.id, editForm);
      setIsEditOpen(false);
      setBooking(prev => ({ ...prev, ...editForm }));
      toast({ title: 'Booking updated successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to update booking', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBooking(booking.id);
      toast({ title: 'Booking deleted successfully', status: 'success' });
      navigate('/bookings');
    } catch (err) {
      toast({ title: 'Failed to delete booking', status: 'error' });
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
      toast({ title: 'Payment detached from booking', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to detach payment', description: err.message, status: 'error' });
    } finally {
      setDetaching(false);
    }
  };

  if (loading || !booking) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-400 text-sm font-medium animate-pulse">Loading booking details...</div>
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
            <ArrowLeft size={14} /> Back to All Bookings
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              {booking.vendor}
            </h1>
            <span className="text-xs font-semibold text-[#234c6a] bg-[#234c6a]/10 px-2 py-0.5 rounded-md border border-[#234c6a]/20">
              #BK-{String(booking.id).slice(-4)}
            </span>
            <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-800 border border-zinc-200/80 font-medium text-xs">
              {booking.category || 'Miscellaneous'}
            </Chip>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5">{booking.service}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            radius="sm" 
            variant="outline" 
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs h-9"
            onClick={() => setIsAttachOpen(true)}
          >
            <Paperclip size={14} /> Attach Payment
          </Button>
          <Button 
            radius="sm" 
            className="bg-zinc-900 text-white hover:bg-zinc-950 font-semibold text-xs h-9 shadow-xs"
            onClick={() => setIsPayOpen(true)}
          >
            <CreditCard size={14} /> Record Payment
          </Button>
          <Button 
            radius="sm" 
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs h-9"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil size={14} /> Edit
          </Button>
          <Button 
            radius="sm" 
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
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Booked Value</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(totalAmount)}</div>
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
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(advanceAmount)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#456882] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Paid</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(totalPaid)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Remaining Due</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(remainingDue)}</div>
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
                  ? 'This booking is fully paid and settled.' 
                  : `${fmt(remainingDue)} remaining to be cleared before event.`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-zinc-900">{percentPaid}%</span>
              <span className="text-xs text-zinc-500 ml-1.5 font-medium">({fmt(totalPaid)} / {fmt(totalAmount)})</span>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
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
        {/* Left Column: Booking Details Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <FileText size={16} className="text-zinc-600" /> Booking Information
            </h3>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Vendor</span>
                <span className="font-bold text-zinc-900">{booking.vendor}</span>
              </div>

              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Service</span>
                <span className="font-medium text-zinc-800">{booking.service}</span>
              </div>

              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Category</span>
                <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-800 border border-zinc-200/80 font-medium text-xs">
                  {booking.category || 'Miscellaneous'}
                </Chip>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Booking Date</span>
                  <span className="font-medium text-zinc-700 text-xs flex items-center gap-1.5">
                    <Calendar size={13} className="text-zinc-400" />
                    {booking.booking_date ? formatDate(booking.booking_date) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Event Date</span>
                  <span className="font-medium text-zinc-700 text-xs flex items-center gap-1.5">
                    <Calendar size={13} className="text-zinc-400" />
                    {booking.event_date ? formatDate(booking.event_date) : '—'}
                  </span>
                </div>
              </div>

              {booking.notes && (
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-1">Notes</span>
                  <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 leading-relaxed">
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>
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

            {linkedExpenses.length > 0 ? (
              <>
                <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                    <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap">DATE</th>
                      <th className="py-3 px-4 whitespace-nowrap">TYPE</th>
                      <th className="py-3 px-4">DESCRIPTION</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">AMOUNT</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">RECEIPT</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {linkedExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#1b3c53]/[0.04] transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-zinc-600 font-medium">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {exp.payment_type === 'Advance' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#234c6a]/15 text-[#234c6a] border border-[#234c6a]/30">
                              Advance
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-800 font-medium">
                          {exp.description || <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap text-sm font-bold text-zinc-900">
                          {fmt(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {exp.receipt_url ? (
                            <a 
                              href={exp.receipt_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#234c6a] hover:underline"
                            >
                              <Paperclip size={13} /> View
                            </a>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            radius="sm"
                            size="sm"
                            variant="light"
                            className="text-zinc-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold h-8 px-2.5 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            onClick={() => confirmDetach(exp)}
                            title="Detach payment from this booking"
                          >
                            <Unlink size={13} />
                            <span>Detach</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={currentPage}
                totalItems={linkedExpenses.length}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          ) : (
              <div className="py-14 text-center px-4">
                <CreditCard size={32} className="mx-auto text-zinc-300 mb-2" />
                <h4 className="text-sm font-bold text-zinc-700">No payment records yet</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  {advanceAmount > 0 
                    ? `An initial advance of ${fmt(advanceAmount)} was noted at booking. You can record payments to track transactions.` 
                    : 'Log payments as you make advances or installments to this vendor.'}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button 
                    radius="sm" 
                    size="sm" 
                    className="bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-xs"
                    onClick={() => setIsPayOpen(true)}
                  >
                    <Plus size={14} /> Record Payment
                  </Button>
                  <Button 
                    radius="sm" 
                    size="sm" 
                    variant="outline"
                    className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs"
                    onClick={() => setIsAttachOpen(true)}
                  >
                    <Paperclip size={14} /> Attach Existing
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      <TailwindModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Booking">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><User size={12} /> Vendor Name</Label>
              <Input radius="sm" value={editForm.vendor || ''} onChange={e => setEditForm(p => ({ ...p, vendor: e.target.value }))} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Briefcase size={12} /> Service Provided</Label>
              <Input radius="sm" value={editForm.service || ''} onChange={e => setEditForm(p => ({ ...p, service: e.target.value }))} />
            </TextField>

            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Tag size={12} /> Category</Label>
              <div className="relative">
                <select 
                  value={editForm.category || 'Photography'} 
                  onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} 
                  className="w-full h-10 pl-3 pr-8 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border border-zinc-200 outline-none appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Total Amount</Label>
              <Input radius="sm" type="number" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Advance Paid</Label>
              <Input radius="sm" type="number" value={editForm.advance || ''} onChange={e => setEditForm(p => ({ ...p, advance: e.target.value }))} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Booking Date</Label>
              <Input radius="sm" type="date" value={editForm.booking_date || ''} onChange={e => setEditForm(p => ({ ...p, booking_date: e.target.value }))} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Event Date</Label>
              <Input radius="sm" type="date" value={editForm.event_date || ''} onChange={e => setEditForm(p => ({ ...p, event_date: e.target.value }))} />
            </TextField>
          </div>

          <div>
            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Notes</Label>
              <Input radius="sm" placeholder="Additional details..." value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </TextField>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-zinc-100">
            <Button radius="sm" variant="light" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              radius="sm" 
              className="bg-zinc-900 text-white hover:bg-zinc-800" 
              onPress={handleUpdate} 
              onClick={handleUpdate} 
              isLoading={saving}
            >
              Update Booking
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Delete Confirm Modal */}
      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Booking?">
        <div className="p-2">
          <p className="text-zinc-600 mb-6">This action cannot be undone. Are you sure you want to permanently delete this booking?</p>
          <div className="flex justify-end gap-2">
            <Button radius="sm" variant="light" onClick={() => setIsDelOpen(false)}>Cancel</Button>
            <Button 
              radius="sm" 
              className="bg-red-600 text-white hover:bg-red-700 font-bold" 
              onPress={handleDelete} 
              onClick={handleDelete}
            >
              Delete Booking
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Detach Payment Confirmation Modal */}
      <TailwindModal 
        isOpen={!!detachTarget} 
        onClose={() => setDetachTarget(null)} 
        title="Detach Payment from Booking?"
      >
        <div className="p-2">
          <p className="text-sm text-zinc-600 mb-2">
            Are you sure you want to detach this payment of <strong className="text-zinc-900">{detachTarget ? fmt(detachTarget.amount) : ''}</strong> from <strong className="text-zinc-900">{booking?.vendor}</strong>?
          </p>
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs text-zinc-500 mb-6">
            The payment will remain in your payment records as an independent expense and will no longer count towards this booking's payment progress.
          </div>
          <div className="flex justify-end gap-2">
            <Button radius="sm" variant="light" onClick={() => setDetachTarget(null)}>Cancel</Button>
            <Button 
              radius="sm" 
              className="bg-[#234c6a] text-white hover:bg-[#1b3c53] font-semibold text-xs" 
              onPress={handleDetach}
              onClick={handleDetach}
              isLoading={detaching}
            >
              <Unlink size={14} /> Detach Payment
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Record Payment Modal */}
      <AddExpenseModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSuccess={async (newExp) => {
          if (newExp && newExp.id) {
            setExpenses(prev => [newExp, ...prev.filter(e => e.id !== newExp.id)]);
          }
          await loadData();
        }}
        initialBookingId={booking?.id}
      />

      {/* Attach Existing Payment Modal */}
      <AttachPaymentModal
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        booking={booking}
        expenses={expenses}
        onSuccess={async () => {
          await loadData();
        }}
        onRecordNew={() => setIsPayOpen(true)}
      />
    </div>
  );
}
