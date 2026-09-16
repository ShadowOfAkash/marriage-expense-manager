import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { 
  Search, Plus, CalendarCheck, IndianRupee, AlignLeft, 
  Calendar, User, Briefcase, CreditCard, ChevronDown, 
  Tag, ExternalLink 
} from 'lucide-react';
import { api, fmt, formatDate, CATEGORIES } from '../utils/api';
import { TailwindModal } from './TailwindModal';
import { BookingActionMenu } from './BookingActionMenu';
import { AddExpenseModal } from './SharedModals';
import { AttachPaymentModal } from './AttachPaymentModal';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

const EMPTY_BOOKING_FORM = {
  vendor: '',
  service: '',
  category: 'Photography',
  booking_date: new Date().toISOString().split('T')[0],
  event_date: '',
  amount: '',
  advance: '',
  notes: ''
};

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toast = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_BOOKING_FORM);

  // Payment Actions
  const [payBookingId, setPayBookingId] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [attachBooking, setAttachBooking] = useState(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const loadData = async () => {
    try {
      const [bkData, expData] = await Promise.all([api.getBookings(), api.getExpenses()]);
      setBookings(bkData || []);
      setExpenses(expData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Summary Metrics for top stats cards
  const totalBooked = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bookings]);

  const totalPaid = useMemo(() => {
    return bookings.reduce((sum, b) => {
      const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
      const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      return sum + (expPaid > 0 ? expPaid : (Number(b.advance) || 0));
    }, 0);
  }, [bookings, expenses]);

  const totalRemaining = useMemo(() => {
    return Math.max(0, totalBooked - totalPaid);
  }, [totalBooked, totalPaid]);

  const filtered = useMemo(() => bookings.filter(b => {
    const bookingCode = `BK-${String(b.id).slice(-4)}`.toLowerCase();
    return b.vendor?.toLowerCase().includes(search.toLowerCase()) || 
           b.service?.toLowerCase().includes(search.toLowerCase()) ||
           b.category?.toLowerCase().includes(search.toLowerCase()) ||
           bookingCode.includes(search.toLowerCase());
  }), [bookings, search]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.vendor || !form.service) return toast({ title: 'Vendor and Service are required', status: 'warning' });
    setSaving(true);
    try {
      const created = await api.addBooking(form);
      setIsAddOpen(false);
      setForm(EMPTY_BOOKING_FORM);
      if (created && created.id) {
        setBookings(prev => [created, ...prev.filter(b => b.id !== created.id)]);
      }
      toast({ title: 'Booking created successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to create booking', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.vendor || !form.service) return toast({ title: 'Vendor and Service are required', status: 'warning' });
    setSaving(true);
    try {
      await api.updateBooking(form.id, form);
      setIsEditOpen(false);
      setBookings(prev => prev.map(b => b.id === form.id ? { ...b, ...form } : b));
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
      await api.deleteBooking(delId);
      setIsDelOpen(false);
      setBookings(prev => prev.filter(b => b.id !== delId));
      toast({ title: 'Booking deleted successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to delete booking', status: 'error' });
    }
  };

  const openPay = (id) => {
    setPayBookingId(id);
    setIsPayOpen(true);
  };

  const openAdd = () => {
    setForm(EMPTY_BOOKING_FORM);
    setIsAddOpen(true);
  };

  const openEdit = (b) => {
    setForm({ ...b, category: b.category || 'Photography' });
    setIsEditOpen(true);
  };

  const confirmDelete = (id) => {
    setDelId(id);
    setIsDelOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <CalendarCheck size={24} className="text-zinc-900" /> Bookings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage vendor bookings, advances, and payment milestones</p>
        </div>
        <Button radius="sm" className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onClick={openAdd}>
          <Plus size={18} /> Create Booking
        </Button>
      </div>

      {/* Booking Statistics Cards (identical design to Savings page) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Booked Value</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(totalBooked)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#234c6a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Paid</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {fmt(totalPaid)} <span className="text-xs font-semibold text-[#234c6a] ml-1">({totalBooked > 0 ? Math.round((totalPaid / totalBooked) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#456882] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Remaining Balance</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(totalRemaining)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Toolbar */}
      <div className="mb-4 bg-white border border-zinc-200/80 rounded-xl p-2.5 shadow-xs flex items-center gap-3 shrink-0">
        <Search size={18} className="text-zinc-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by vendor, service, category, or ID (e.g. BK-1234)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 py-1"
        />
        {filtered.length > 0 && (
          <span className="text-xs text-zinc-400 font-medium mr-2 whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}
          </span>
        )}
      </div>

      {/* Table Container */}
      <div className="shadow-sm border border-zinc-200/80 flex-1 flex flex-col overflow-hidden rounded-xl bg-white">
        {filtered.length > 0 ? (
          <>
            <div className="overflow-auto flex-1 w-full relative">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                  <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">BOOKING ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">VENDOR</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">SERVICE</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">CATEGORY</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">EVENT DATE</th>
                    <th className="py-3.5 px-4 min-w-[220px]">PAYMENT PROGRESS</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((b) => {
                  const tAmt = Number(b.amount) || 0;
                  const advAmt = Number(b.advance) || 0;
                  const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
                  const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                  const paid = expPaid > 0 ? expPaid : advAmt;
                  const pct = tAmt > 0 ? Math.min(100, Math.round((paid / tAmt) * 100)) : 0;

                  return (
                    <tr key={b.id} className="hover:bg-[#1b3c53]/[0.04] transition-colors">
                      {/* 1. Booking ID (linked to detail page - same font as row) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link 
                          to={`/bookings/${b.id}`} 
                          className="text-sm font-semibold text-[#234c6a] hover:text-[#1b3c53] hover:underline"
                        >
                          #BK-{String(b.id).slice(-4)}
                        </Link>
                      </td>

                      {/* 2. Vendor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link 
                          to={`/bookings/${b.id}`} 
                          className="text-sm font-semibold text-zinc-900 hover:text-[#234c6a] hover:underline"
                        >
                          {b.vendor}
                        </Link>
                      </td>

                      {/* 3. Service */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-sm text-zinc-600">
                        {b.service}
                      </td>

                      {/* 4. Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                          {b.category || 'Miscellaneous'}
                        </span>
                      </td>

                      {/* 5. Event Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-sm text-zinc-600">
                        {b.event_date ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} className="text-zinc-400 shrink-0" />
                            {formatDate(b.event_date)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* 6. Payment & Progress (Intuitive, Uncluttered Horizontal Bar) */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="flex flex-col gap-1.5">
                          {/* Top: Paid / Total & Status */}
                          <div className="flex items-baseline justify-between text-sm">
                            <span className="font-semibold text-zinc-900">
                              {fmt(paid)}
                              <span className="text-zinc-400 font-normal text-xs ml-1">of {fmt(tAmt)}</span>
                            </span>
                            <span className={`text-xs font-semibold ${pct >= 100 ? 'text-emerald-700' : 'text-zinc-600'}`}>
                              {pct >= 100 ? 'Settled' : `${pct}%`}
                            </span>
                          </div>
                          
                          {/* Progress Track */}
                          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 100 ? 'bg-emerald-600' : 'bg-[#234c6a]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Bottom: Advance Breakdown & Remaining Due */}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Adv: <span className="text-zinc-700 font-medium">{fmt(advAmt)}</span></span>
                            {pct >= 100 ? (
                              <span className="text-emerald-600 font-medium">Fully paid</span>
                            ) : (
                              <span>Due: <span className="text-zinc-700 font-medium">{fmt(Math.max(0, tAmt - paid))}</span></span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 7. Actions: Only 3-dot icon button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <BookingActionMenu
                          onView={() => navigate(`/bookings/${b.id}`)}
                          onAttachPayment={() => {
                            setAttachBooking(b);
                            setIsAttachOpen(true);
                          }}
                          onRecordPayment={() => openPay(b.id)}
                          onDelete={() => confirmDelete(b.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
          <div className="py-20 flex flex-col items-center justify-center flex-1">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center mb-3 text-zinc-300">
              <CalendarCheck size={32} />
            </div>
            <h3 className="text-zinc-700 font-bold text-base">No bookings found</h3>
            <p className="text-zinc-400 text-xs mt-1">Get started by creating your first vendor booking.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Booking Modal (Status field deleted as requested) */}
      <TailwindModal isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }} title={isAddOpen ? "Create New Booking" : "Edit Booking"}>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><User size={12} /> Vendor Name</Label>
              <Input radius="sm" placeholder="e.g. Dream Photography" value={form.vendor} onChange={e => setF('vendor', e.target.value)} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Briefcase size={12} /> Service Provided</Label>
              <Input radius="sm" placeholder="e.g. Photography & Videography" value={form.service} onChange={e => setF('service', e.target.value)} />
            </TextField>

            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Tag size={12} /> Category</Label>
              <div className="relative">
                <select 
                  value={form.category || 'Photography'} 
                  onChange={e => setF('category', e.target.value)} 
                  className="w-full h-10 pl-3 pr-8 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border border-zinc-200 outline-none appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Total Amount</Label>
              <Input radius="sm" type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Advance Paid</Label>
              <Input radius="sm" type="number" value={form.advance} onChange={e => setF('advance', e.target.value)} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Booking Date</Label>
              <Input radius="sm" type="date" value={form.booking_date} onChange={e => setF('booking_date', e.target.value)} />
            </TextField>

            <div className="col-span-2">
              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Event Date</Label>
                <Input radius="sm" type="date" value={form.event_date} onChange={e => setF('event_date', e.target.value)} />
              </TextField>
            </div>
          </div>

          <div>
            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Notes</Label>
              <Input radius="sm" placeholder="Additional details..." value={form.notes} onChange={e => setF('notes', e.target.value)} />
            </TextField>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-zinc-100">
            <Button radius="sm" variant="light" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button 
              radius="sm" 
              className="bg-zinc-900 text-white hover:bg-zinc-800" 
              onPress={isAddOpen ? handleAdd : handleUpdate} 
              onClick={isAddOpen ? handleAdd : handleUpdate} 
              isLoading={saving}
            >
              {isAddOpen ? "Save Booking" : "Update Booking"}
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

      {/* Record Payment Modal */}
      <AddExpenseModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSuccess={async (newExp) => {
          if (newExp && newExp.id) {
            setExpenses(prev => [newExp, ...prev.filter(x => x.id !== newExp.id)]);
          }
          await loadData();
          toast({ title: 'Payment saved successfully', status: 'success' });
        }}
        initialBookingId={payBookingId}
      />

      {/* Attach Payment Modal */}
      <AttachPaymentModal
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        booking={attachBooking}
        expenses={expenses}
        onSuccess={async () => {
          await loadData();
        }}
        onRecordNew={() => setIsPayOpen(true)}
      />
    </div>
  );
}
