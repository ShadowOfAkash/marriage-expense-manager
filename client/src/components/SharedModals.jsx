import React, { useState, useRef, useEffect } from 'react';
import { TailwindModal } from './TailwindModal';
import { Button, Select, ListBox, Label, Input, TextField } from "@heroui/react";
import { Plus, Tag, IndianRupee, Calendar, AlignLeft, Camera, Image as ImageIcon, CalendarDays, StickyNote, CalendarCheck, CreditCard } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { api, CATEGORIES, MONTH_NAMES } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

const EMPTY_EXP_FORM = { description: '', amount: '', date: '', receipt_url: '', booking_id: '', payment_type: 'Normal' };

export function AddExpenseModal({ isOpen, onClose, onSuccess, initialBookingId }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    if (isOpen) {
      api.getBookings().then(setBookings).catch(() => {});
      if (initialBookingId) {
        setForm(p => ({
          ...p,
          booking_id: initialBookingId,
          payment_type: 'Advance',
          date: p.date || new Date().toISOString().split('T')[0]
        }));
      }
    } else {
      setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
    }
  }, [isOpen, initialBookingId]);


  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        try {
          const aiData = await api.scanReceipt(base64String, file.type);
          setForm(prev => ({
            ...prev,
            description: aiData.description || '',
            amount: aiData.amount ? String(aiData.amount) : '',
            date: aiData.date || new Date().toISOString().split('T')[0],
            receipt_url: aiData.receipt_url || ''
          }));
          toast({ title: 'Receipt Scanned!', status: 'success', duration: 3000 });
        } catch (err) {
          toast({ title: 'Scan Failed', description: err.message, status: 'error', duration: 3000 });
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setScanning(false);
    }
  };

  const handleAdd = async () => {
    if (!form.amount || !form.date) return toast({ title: 'Fill required fields (Amount, Date)', status: 'warning' });
    setSaving(true);
    try {
      const created = await api.addExpense({
        ...form,
        amount: Number(form.amount),
        booking_id: form.booking_id ? Number(form.booking_id) : null,
        payment_type: form.payment_type || 'Normal'
      });
      toast({ title: 'Payment saved!', status: 'success' });
      setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
      onClose();
      if (onSuccess) await onSuccess(created);
    } catch {
      toast({ title: 'Error saving', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TailwindModal isOpen={isOpen} onClose={onClose} title="Add New Payment">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleScan({ target: { files: [e.dataTransfer.files[0]] } });
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-all mb-6 flex flex-col items-center gap-3"
          >
            {form.receipt_url ? (
              <>
                <ImageIcon size={32} className="text-zinc-900" />
                <span className="font-bold text-zinc-900">Document Uploaded Successfully!</span>
                <span className="text-sm text-zinc-500">Click or drag another to replace</span>
                <Button radius="sm" size="sm" variant="outline" className="mt-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white" onClick={(e) => { e.stopPropagation(); window.open(form.receipt_url, '_blank'); }}>
                  View Document
                </Button>
                {scanning && <span className="text-sm text-zinc-700 font-bold">Analyzing...</span>}
              </>
            ) : (
              <>
                <Camera size={32} className="text-zinc-900" />
                <span className="font-bold text-zinc-900">Drag & Drop Receipt (Image/PDF)</span>
                <span className="text-sm text-zinc-500">or click to browse your files</span>
                {scanning && <span className="text-sm text-zinc-700 font-bold">Analyzing with AI...</span>}
              </>
            )}
            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleScan} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CreditCard size={12} /> Payment Type</Label>
              <div className="relative">
                <select
                  value={form.payment_type || 'Normal'}
                  onChange={(e) => setF('payment_type', e.target.value)}
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
                  value={form.booking_id || ''}
                  onChange={(e) => setF('booking_id', e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                >
                  <option value="">— None (Independent) —</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.vendor} - {b.service}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Amount</Label>
              <Input radius="sm" 
                type="number" 
                value={form.amount} 
                onChange={e => setF('amount', e.target.value)} 
                startContent={<span className="text-zinc-500 font-bold">₹</span>}
              />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Date</Label>
              <Input radius="sm" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </TextField>

            <div className="col-span-2">
              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Description</Label>
                <Input radius="sm" 
                  value={form.description} 
                  onChange={e => setF('description', e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} 
                />
              </TextField>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button radius="sm" variant="solid" className="bg-zinc-900 text-white hover:bg-zinc-800" onPress={handleAdd} onClick={handleAdd} isLoading={saving}>
              <Plus size={15} /> Save Payment
            </Button>
            <Button radius="sm" variant="light" onClick={() => setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] })}>
              Clear
            </Button>
          </div>
        </TailwindModal>
  );
}

export function AddSavingModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const currentMonth = () => new Date().toLocaleString('default', { month: 'long' });
  const currentYear = () => new Date().getFullYear();
  
  const [form, setForm] = useState({ month: currentMonth(), year: currentYear(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast({ title: 'Enter amount', status: 'warning' });
    setSaving(true);
    try {
      const created = await api.addSavings(form);
      toast({ title: 'Savings logged!', status: 'success' });
      setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' });
      onClose();
      if (onSuccess) await onSuccess(created);
    } catch {
      toast({ title: 'Error saving', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TailwindModal isOpen={isOpen} onClose={onClose} title="Log Saving">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarDays size={12} /> Month</Label>
              <div className="relative">
                <select
                  value={form.month || ''}
                  onChange={(e) => setF('month', e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                >
                  <option value="" disabled>— Select —</option>
                  {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarDays size={12} /> Year</Label>
              <Input radius="sm" type="number" value={form.year} onChange={e => setF('year', e.target.value)} />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Amount</Label>
              <Input radius="sm" 
                type="number" 
                value={form.amount} 
                onChange={e => setF('amount', e.target.value)} 
                startContent={<span className="text-zinc-500 font-bold">₹</span>}
              />
            </TextField>

            <TextField>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><StickyNote size={12} /> Notes</Label>
              <Input radius="sm" 
                value={form.note} 
                onChange={e => setF('note', e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleAdd()} 
              />
            </TextField>
          </div>
          <div className="flex gap-2 mt-6">
            <Button radius="sm" variant="solid" className="bg-zinc-900 text-white hover:bg-zinc-800" onPress={handleAdd} onClick={handleAdd} isLoading={saving}>
              <Plus size={15} /> Save Entry
            </Button>
            <Button radius="sm" variant="light" onClick={() => setForm({ month: currentMonth(), year: currentYear(), amount: '', note: '' })}>
              Clear
            </Button>
          </div>
        </TailwindModal>
  );
}
