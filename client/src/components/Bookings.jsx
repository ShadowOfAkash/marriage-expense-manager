import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { 
  Search, Plus, CalendarCheck, IndianRupee, AlignLeft, 
  Calendar, User, Briefcase, CreditCard, ChevronDown, 
  Tag, ExternalLink, Pencil, Trash2 
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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
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
    <div className="px-4 sm:px-8 lg:px-12 py-8 md:py-10 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <CalendarCheck size={24} />
            </span>
            <span>Vendor Contracts & Bookings</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base mt-2">
            Track vendor milestone contracts, event dates, advances paid, and balances due
          </p>
        </div>
        <Button 
          radius="sm" 
          className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm h-11 px-5 rounded-2xl shadow-md cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all" 
          onClick={openAdd}
        >
          <Plus size={18} /> Create Booking / Contract
        </Button>
      </div>

      {/* 2. Booking Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <CalendarCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Booked Value</div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">{fmt(totalBooked)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Paid / Advances</div>
              <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                {fmt(totalPaid)} <span className="text-xs font-semibold text-emerald-600 ml-1">({totalBooked > 0 ? Math.round((totalPaid / totalBooked) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <IndianRupee size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Remaining Balance Due</div>
              <div className="text-2xl md:text-3xl font-black text-amber-700 tracking-tight">{fmt(totalRemaining)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Search and View Switcher Toolbar */}
      <div className="bg-white border border-amber-200/70 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-2.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by vendor, service, category, or ID (e.g. BK-1234)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          {filtered.length > 0 && (
            <span className="text-xs text-zinc-400 font-medium mr-2 whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? 'contract' : 'contracts'}
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-white text-rose-700 shadow-2xs border border-rose-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>🎴 Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white text-rose-700 shadow-2xs border border-rose-200'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>📄 Table</span>
          </button>
        </div>
      </div>

      {/* 4. Primary Content Container */}
      <div className="shadow-xs border border-amber-200/70 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xs">
        {filtered.length > 0 ? (
          <>
            {viewMode === 'cards' ? (
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((b) => {
                  const tAmt = Number(b.amount) || 0;
                  const advAmt = Number(b.advance) || 0;
                  const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
                  const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                  const paid = expPaid > 0 ? expPaid : advAmt;
                  const pct = tAmt > 0 ? Math.min(100, Math.round((paid / tAmt) * 100)) : 0;
                  const remaining = Math.max(0, tAmt - paid);

                  return (
                    <div key={b.id} className="festive-card p-6 md:p-7 relative overflow-hidden bg-white border border-amber-200/70 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                      <div>
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            #BK-{String(b.id).slice(-4)}
                          </span>
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {b.category || 'Vendor'}
                          </span>
                        </div>

                        {/* Vendor Name & Service */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-200">
                            {b.vendor ? b.vendor.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link to={`/bookings/${b.id}`} className="font-serif font-bold text-base md:text-lg text-zinc-900 hover:text-rose-700 transition-colors block truncate">
                              {b.vendor}
                            </Link>
                            <p className="text-xs md:text-sm text-zinc-500 font-medium truncate mt-0.5">
                              {b.service || 'Wedding Service'}
                            </p>
                            {b.event_date && (
                              <p className="text-xs text-zinc-500 font-medium mt-1.5 flex items-center gap-1.5">
                                <Calendar size={13} className="text-amber-600" />
                                <span>Ceremony: {formatDate(b.event_date)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Payment Progress Bar */}
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/80 mb-4">
                          <div className="flex items-baseline justify-between text-xs mb-2">
                            <span className="font-bold text-zinc-900">{fmt(paid)} <span className="text-zinc-400 font-normal text-[11px]">paid</span></span>
                            <span className="font-bold text-zinc-900">{fmt(tAmt)} <span className="text-zinc-400 font-normal text-[11px]">total</span></span>
                          </div>
                          <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden mb-2">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 100 ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-rose-700">Due: {fmt(remaining)}</span>
                            <span className="font-bold text-zinc-600">{pct}% Complete</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-4 border-t border-zinc-100 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => openPay(b.id)}
                          className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <CreditCard size={15} /> Pay Installment
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                          className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                          title="View Contract"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                          title="Edit Contract"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(b.id)}
                          className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Contract"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                    <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                      <th className="py-4 px-6 whitespace-nowrap">BOOKING ID</th>
                      <th className="py-4 px-6 whitespace-nowrap">VENDOR</th>
                      <th className="py-4 px-6 whitespace-nowrap">SERVICE</th>
                      <th className="py-4 px-6 whitespace-nowrap">CATEGORY</th>
                      <th className="py-4 px-6 whitespace-nowrap">EVENT DATE</th>
                      <th className="py-4 px-6 min-w-[220px]">PAYMENT PROGRESS</th>
                      <th className="py-4 px-6 text-right whitespace-nowrap">ACTIONS</th>
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
                      <tr key={b.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <Link 
                            to={`/bookings/${b.id}`} 
                            className="text-sm font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                          >
                            #BK-{String(b.id).slice(-4)}
                          </Link>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <Link 
                            to={`/bookings/${b.id}`} 
                            className="text-sm font-semibold text-zinc-900 hover:text-rose-700 hover:underline"
                          >
                            {b.vendor}
                          </Link>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-sm text-zinc-600">
                          {b.service}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {b.category || 'Miscellaneous'}
                          </span>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-sm text-zinc-600">
                          {b.event_date ? (
                            <span className="inline-flex items-center gap-2">
                              <Calendar size={14} className="text-amber-600 shrink-0" />
                              {formatDate(b.event_date)}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>

                        <td className="py-4 px-6 min-w-[220px]">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-baseline justify-between text-sm">
                              <span className="font-semibold text-zinc-900">
                                {fmt(paid)}
                                <span className="text-zinc-400 font-normal text-xs ml-1">of {fmt(tAmt)}</span>
                              </span>
                              <span className={`text-xs font-semibold ${pct >= 100 ? 'text-emerald-700' : 'text-zinc-600'}`}>
                                {pct >= 100 ? 'Settled' : `${pct}%`}
                              </span>
                            </div>
                            
                            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 100 ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

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

                        <td className="py-4 px-6 text-right whitespace-nowrap">
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
            )}

            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[6, 12, 24, 50]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-amber-600">
              <CalendarCheck size={34} />
            </div>
            <h3 className="text-zinc-800 font-bold text-base">No bookings found</h3>
            <p className="text-zinc-500 text-xs mt-1">Get started by creating your first vendor booking.</p>
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
