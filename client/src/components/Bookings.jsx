import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { Search, Plus, CalendarCheck, Pencil, Trash2, IndianRupee, AlignLeft, Calendar, User, Briefcase, FileText, CreditCard } from 'lucide-react';
import { api, fmt, formatDate } from '../utils/api';
import { TailwindModal } from './TailwindModal';
import { ActionMenu } from './ActionMenu';
import { AddExpenseModal } from './SharedModals';
import { useToast } from '../contexts/ToastContext';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vendor: '', service: '', booking_date: new Date().toISOString().split('T')[0], event_date: '', amount: '', advance: '', status: 'Pending', notes: '' });

  const loadData = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => bookings.filter(b => {
    return b.vendor?.toLowerCase().includes(search.toLowerCase()) || b.service?.toLowerCase().includes(search.toLowerCase());
  }), [bookings, search]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.vendor || !form.service) return toast({ title: 'Vendor and Service are required', status: 'warning' });
    setSaving(true);
    try {
      await api.addBooking(form);
      setIsAddOpen(false);
      setForm({ vendor: '', service: '', booking_date: new Date().toISOString().split('T')[0], event_date: '', amount: '', advance: '', status: 'Pending', notes: '' });
      toast({ title: 'Booking created successfully', status: 'success' });
      loadData();
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
      toast({ title: 'Booking updated successfully', status: 'success' });
      loadData();
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
      toast({ title: 'Booking deleted successfully', status: 'success' });
      loadData();
    } catch (err) {
      toast({ title: 'Failed to delete booking', status: 'error' });
    }
  };

  
  const [payBookingId, setPayBookingId] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const openPay = (id) => {
    setPayBookingId(id);
    setIsPayOpen(true);
  };

  const openAdd = () => {
    setForm({ vendor: '', service: '', booking_date: new Date().toISOString().split('T')[0], event_date: '', amount: '', advance: '', status: 'Pending', notes: '' });
    setIsAddOpen(true);
  };

  const openEdit = (b) => {
    setForm({ ...b });
    setIsEditOpen(true);
  };

  const confirmDelete = (id) => {
    setDelId(id);
    setIsDelOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-0rem)] md:h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <CalendarCheck size={24} className="text-zinc-900" /> Bookings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage vendor bookings and event details</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onClick={openAdd}>
          <Plus size={18} /> Create Booking
        </Button>
      </div>

      <Card className="mb-4 shadow-sm border border-zinc-200 shrink-0">
        <Card.Content className="p-4 flex flex-col md:flex-row gap-4 items-center bg-zinc-50 rounded-xl">
          <Input
            placeholder="Search vendor or service..."
            startContent={<Search size={16} className="text-zinc-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </Card.Content>
      </Card>

      <Card className="shadow-sm border border-zinc-200 flex-1 flex flex-col overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-auto flex-1 w-full relative">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-zinc-50 z-10 shadow-[0_1px_0_0_#e4e4e7]">
                <tr className="text-zinc-500 font-medium bg-zinc-50">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">VENDOR</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">SERVICE</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">STATUS</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">TOTAL AMOUNT</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">ADVANCE</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">{b.vendor}</td>
                    <td className="py-3 px-4 text-zinc-600">{b.service}</td>
                    <td className="py-3 px-4">
                      <Chip size="sm" variant="flat" color="default" className="bg-zinc-100 text-zinc-900 border border-zinc-300">
                        {b.status}
                      </Chip>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap"><span className="font-bold text-zinc-900">{fmt(b.amount)}</span></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-zinc-600">{fmt(b.advance)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        <Button size="sm" variant="flat" className="bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 font-medium" onClick={() => openPay(b.id)}><CreditCard size={14} className="mr-1"/> Make Payment</Button>
                        <ActionMenu onEdit={() => openEdit(b)} onDelete={() => confirmDelete(b.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <CalendarCheck size={40} className="text-zinc-300 mb-4" />
            <h3 className="text-zinc-500 font-medium">No bookings found</h3>
          </div>
        )}
      </Card>

      {/* Add / Edit Booking Modal */}
      <TailwindModal isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }} title={isAddOpen ? "Create New Booking" : "Edit Booking"}>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><User size={12} /> Vendor Name</Label>
              <Input placeholder="e.g. Dream Photography" value={form.vendor} onChange={e => setF('vendor', e.target.value)} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Briefcase size={12} /> Service Provided</Label>
              <Input placeholder="e.g. Photography & Videography" value={form.service} onChange={e => setF('service', e.target.value)} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Total Amount</Label>
              <Input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Advance Paid</Label>
              <Input type="number" value={form.advance} onChange={e => setF('advance', e.target.value)} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Booking Date</Label>
              <Input type="date" value={form.booking_date} onChange={e => setF('booking_date', e.target.value)} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Event Date</Label>
              <Input type="date" value={form.event_date} onChange={e => setF('event_date', e.target.value)} />
            </TextField>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><FileText size={12} /> Status</Label>
              <div className="relative">
                <select value={form.status} onChange={e => setF('status', e.target.value)} className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none appearance-none cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Notes</Label>
              <Input placeholder="Additional details..." value={form.notes} onChange={e => setF('notes', e.target.value)} />
            </TextField>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
            <Button variant="light" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={isAddOpen ? handleAdd : handleUpdate} isLoading={saving}>
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
            <Button variant="light" onClick={() => setIsDelOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700 font-bold" onClick={handleDelete}>Delete Booking</Button>
          </div>
        </div>
      </TailwindModal>

    </div>
  );
}
