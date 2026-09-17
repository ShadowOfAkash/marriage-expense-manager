import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { Search, Plus, Filter, Tag, ChevronDown, Receipt, Calendar, Pencil, Trash2, Image as ImageIcon, Paperclip, X, IndianRupee, AlignLeft, CalendarCheck, CreditCard, Unlink } from 'lucide-react';
import { api, fmt, formatDate } from '../utils/api';
import { AddExpenseModal } from './SharedModals';
import { TailwindModal } from './TailwindModal';
import { ActionMenu } from './ActionMenu';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

// Full Screen Viewer (Tailwind converted from old Chakra)
function FullScreenViewer({ url, isPdf, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <Button radius="sm" isIconOnly variant="light" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={onClose}>
        <X size={24} />
      </Button>
      {isPdf ? (
        <iframe src={url} className="w-full h-full max-w-5xl bg-white rounded-lg" />
      ) : (
        <img src={url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Document" />
      )}
    </div>
  );
}

export default function Expenses() {
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Search & Filter
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modals
  const [editItem, setEditItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [detachTarget, setDetachTarget] = useState(null);
  const [detaching, setDetaching] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [bookings, setBookings] = useState([]);
  const loadData = async () => {
    try {
      const [expData, bkData] = await Promise.all([api.getExpenses(), api.getBookings()]);
      setExpenses(expData || []);
      setBookings(bkData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getBookingName = (bId) => {
    if (!bId) return "-";
    const b = bookings.find(x => String(x.id) === String(bId));
    if (!b) return "-";
    return b.vendor ? `${b.vendor} (${b.service || ''})` : (b.service || `Booking #${bId}`);
  };

  const filtered = useMemo(() => expenses.filter(e => {
    const pType = e.payment_type || 'Normal';
    const matchType = typeFilter ? pType === typeFilter : true;
    const bookingName = getBookingName(e.booking_id);
    const matchSearch = (e.description?.toLowerCase().includes(search.toLowerCase()) || 
      bookingName?.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  }), [expenses, search, typeFilter, bookings]);

  const filteredTotal = useMemo(() => filtered.reduce((sum, item) => sum + Number(item.amount || 0), 0), [filtered]);

  const openEdit = (e) => {
    setEditItem({ ...e, payment_type: e.payment_type || 'Normal' });
    setIsEditOpen(true);
  };

  const confirmDelete = (id) => {
    setDelId(id);
    setIsDelOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.deleteExpense(delId);
      setIsDelOpen(false);
      setExpenses(prev => prev.filter(e => e.id !== delId));
      toast({ title: 'Payment deleted', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to delete payment', description: err.message, status: 'error' });
    }
  };

  const confirmDetach = (e) => {
    setDetachTarget(e);
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

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = await api.updateExpense(editItem.id, editItem);
      setIsEditOpen(false);
      setExpenses(prev => prev.map(e => e.id === editItem.id ? (updated?.id ? updated : { ...e, ...editItem }) : e));
      toast({ title: 'Payment updated successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to update payment', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await api.uploadReceipt(file);
      setEditItem(p => ({ ...p, receipt_url: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const advanceTotal = useMemo(() => {
    return filtered.filter(e => e.payment_type === 'Advance').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filtered]);

  const normalTotal = useMemo(() => {
    return filtered.filter(e => e.payment_type !== 'Advance').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filtered]);

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 md:py-10 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Receipt size={24} />
            </span>
            <span>Shaadi Kharcha & Payments</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base mt-2">
            Track ceremony expenses, advance deposits, vendor settlements, and receipts
          </p>
        </div>
        <Button 
          radius="sm" 
          className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm h-11 px-5 rounded-2xl shadow-md cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all" 
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={18} /> Add Kharcha / Payment
        </Button>
      </div>

      {/* 2. Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <IndianRupee size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Kharcha</div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">{fmt(filteredTotal)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Advance Deposits</div>
              <div className="text-2xl md:text-3xl font-black text-amber-700 tracking-tight">{fmt(advanceTotal)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-7 border border-amber-200/70 shadow-xs hover:shadow-md transition-all bg-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Receipt size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Direct & Final Payments</div>
              <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">{fmt(normalTotal)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white border border-amber-200/70 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 flex items-center gap-3 w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-2.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search payments by description or booking..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-600 font-medium cursor-pointer px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
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

          <div className="relative w-full md:w-52">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 pl-4 pr-9 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-2xl text-xs font-semibold text-zinc-800 border border-zinc-200/80 outline-none appearance-none cursor-pointer"
            >
              <option value="">All Types ({expenses.length})</option>
              <option value="Normal">Normal Payments</option>
              <option value="Advance">Advance Deposits</option>
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900 whitespace-nowrap">
            Total: {fmt(filteredTotal)}
          </div>
        </div>
      </div>

      {/* 4. Primary Content Container */}
      <div className="shadow-xs border border-amber-200/70 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xs">
        {filtered.length > 0 ? (
          <>
            {viewMode === 'cards' ? (
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((e) => (
                  <div key={e.id} className="festive-card p-6 md:p-7 relative overflow-hidden bg-white border border-amber-200/70 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                          <Calendar size={14} className="text-amber-600" />
                          {formatDate(e.date)}
                        </span>
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                          e.payment_type === 'Advance' 
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {e.payment_type === 'Advance' ? 'Advance Deposit 💰' : 'Direct Payment ✅'}
                        </span>
                      </div>

                      <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight mb-3">
                        {fmt(e.amount)}
                      </div>

                      <p className="text-sm font-medium text-zinc-700 leading-relaxed mb-4 line-clamp-2">
                        {e.description || 'Wedding Ceremony Expense'}
                      </p>

                      {e.booking_id && getBookingName(e.booking_id) !== '-' && (
                        <div>
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            {getBookingName(e.booking_id)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                      {e.receipt_url ? (
                        <button
                          type="button"
                          onClick={() => setViewerUrl(e.receipt_url)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                        >
                          <Paperclip size={15} /> Receipt Attached
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">No receipt</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(e.id)}
                          className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                    <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                      <th className="py-4 px-6 whitespace-nowrap">DATE</th>
                      <th className="py-4 px-6 whitespace-nowrap">BOOKING</th>
                      <th className="py-4 px-6 whitespace-nowrap">PAYMENT TYPE</th>
                      <th className="py-4 px-6 min-w-[200px]">DESCRIPTION</th>
                      <th className="py-4 px-6 text-right whitespace-nowrap">AMOUNT</th>
                      <th className="py-4 px-6 text-right whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((e) => (
                    <tr key={e.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-xs font-medium text-zinc-600 flex items-center gap-2">
                          <Calendar size={14} className="text-zinc-400" />
                          {formatDate(e.date)}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {e.booking_id && getBookingName(e.booking_id) !== '-' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            {getBookingName(e.booking_id)}
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                confirmDetach(e);
                              }}
                              className="ml-1 text-rose-700/60 hover:text-rose-800 transition-colors cursor-pointer"
                              title="Detach from this booking"
                            >
                              <Unlink size={13} />
                            </button>
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium pl-2">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {e.payment_type === 'Advance' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6"><span className="text-sm text-zinc-800">{e.description || <span className="text-zinc-300">—</span>}</span></td>
                      <td className="py-4 px-6 text-right whitespace-nowrap"><span className="font-bold text-zinc-900">{fmt(e.amount)}</span></td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          {e.receipt_url ? (
                            <button 
                              type="button" 
                              title="View Document"
                              onClick={() => setViewerUrl(e.receipt_url)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              <Paperclip size={16} />
                            </button>
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                          <ActionMenu 
                            onEdit={() => openEdit(e)} 
                            onDelete={() => confirmDelete(e.id)} 
                            onDetach={e.booking_id ? () => confirmDetach(e) : null}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
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
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-amber-600">
              <Receipt size={34} />
            </div>
            <h3 className="text-zinc-800 font-bold text-base">No payments found</h3>
            <p className="text-zinc-500 text-xs mt-1">Try adjusting your search query or filter.</p>
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={async (newExp) => {
          if (newExp && newExp.id) {
            setExpenses(prev => [newExp, ...prev.filter(e => e.id !== newExp.id)]);
          }
          await loadData();
        }} 
      />

      {/* Edit Modal */}
      <TailwindModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Payment">
        {editItem && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CreditCard size={12} /> Payment Type</Label>
                <div className="relative">
                  <select
                    value={editItem.payment_type || 'Normal'}
                    onChange={(e) => setEditItem({ ...editItem, payment_type: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                  >
                    <option value="Normal">Normal Payment</option>
                    <option value="Advance">Advance Payment</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarCheck size={12} /> Linked Booking</Label>
                <div className="relative">
                  <select
                    value={editItem.booking_id || ''}
                    onChange={(e) => setEditItem({ ...editItem, booking_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                  >
                    <option value="">— None (Independent) —</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.vendor} - {b.service} ({fmt(b.amount)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Amount</Label>
                <Input radius="sm" type="number" value={editItem.amount} onChange={e => setEditItem({ ...editItem, amount: e.target.value })} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
              </TextField>

              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Date</Label>
                <Input radius="sm" type="date" value={editItem.date} onChange={e => setEditItem({ ...editItem, date: e.target.value })} />
              </TextField>

              <div className="col-span-2">
                <TextField>
                  <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Description</Label>
                  <Input radius="sm" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} />
                </TextField>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button radius="sm" as="label" variant="outline" className="border-zinc-300 hover:bg-zinc-100 cursor-pointer text-zinc-700" isLoading={isUploading}>
                <Paperclip size={16} className="mr-2" /> {editItem.receipt_url ? 'Change Document' : 'Attach Document'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
              </Button>
              {editItem.receipt_url && (
                <Button radius="sm" variant="light" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => setViewerUrl(editItem.receipt_url)}>
                  <ImageIcon size={16} className="mr-2" /> View
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
              <Button radius="sm" variant="light" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button radius="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" onPress={handleUpdate} onClick={handleUpdate} isLoading={saving}>Update Payment</Button>
            </div>
          </div>
        )}
      </TailwindModal>

      {/* Detach Confirm Modal */}
      <TailwindModal isOpen={!!detachTarget} onClose={() => setDetachTarget(null)} title="Detach Payment from Booking?">
        <div className="p-2">
          <p className="text-sm text-zinc-600 mb-2">
            Are you sure you want to detach this payment of <strong className="text-zinc-900">{detachTarget ? fmt(detachTarget.amount) : ''}</strong> from <strong className="text-zinc-900">{detachTarget ? getBookingName(detachTarget.booking_id) : ''}</strong>?
          </p>
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs text-zinc-500 mb-6">
            The payment will remain in your payment records as an independent expense and will no longer count towards the booking's total payments.
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

      {/* Delete Confirm Modal */}
      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Payment?">
        <div className="p-2">
          <p className="text-zinc-600 mb-6">This action cannot be undone. Are you sure you want to permanently delete this payment?</p>
          <div className="flex justify-end gap-2">
            <Button radius="sm" variant="light" onClick={() => setIsDelOpen(false)}>Cancel</Button>
            <Button radius="sm" className="bg-red-600 text-white hover:bg-red-700 font-bold" onPress={handleDelete} onClick={handleDelete}>Delete Payment</Button>
          </div>
        </div>
      </TailwindModal>

      {/* Full-Screen Document Viewer */}
      {viewerUrl && (() => {
        const isPdf = viewerUrl.toLowerCase().includes('.pdf');
        return <FullScreenViewer url={viewerUrl} isPdf={isPdf} onClose={() => setViewerUrl(null)} />;
      })()}
    </div>
  );
}
