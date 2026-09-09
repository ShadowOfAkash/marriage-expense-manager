import React, { useState, useMemo } from 'react';
import { TailwindModal } from './TailwindModal';
import { Button, Label } from '@heroui/react';
import { Paperclip, Plus, Calendar, IndianRupee, Check, AlertCircle } from 'lucide-react';
import { api, fmt, formatDate } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

export function AttachPaymentModal({ isOpen, onClose, booking, expenses, onSuccess, onRecordNew }) {
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Available expenses: those that are NOT already linked to this booking
  const availableExpenses = useMemo(() => {
    if (!booking) return [];
    return (expenses || []).filter(e => !e.booking_id || String(e.booking_id) !== String(booking.id));
  }, [expenses, booking]);

  const handleAttach = async () => {
    if (!selectedExpenseId) {
      return toast({ title: 'Please select a payment to attach', status: 'warning' });
    }
    const exp = (expenses || []).find(e => String(e.id) === String(selectedExpenseId));
    if (!exp) return;

    setSaving(true);
    try {
      await api.updateExpense(exp.id, {
        ...exp,
        booking_id: booking.id,
        category: booking.category || exp.category || 'Miscellaneous'
      });
      toast({ title: 'Payment attached to booking successfully!', status: 'success' });
      setSelectedExpenseId('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast({ title: 'Failed to attach payment', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  return (
    <TailwindModal isOpen={isOpen} onClose={onClose} title="Attach Payment to Booking">
      <div className="flex flex-col gap-5">
        {/* Booking summary card */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Target Booking</span>
            <span className="text-sm font-bold text-zinc-900">{booking.vendor}</span>
            <span className="text-xs text-zinc-500 block">{booking.service} • {booking.category}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total Amount</span>
            <span className="text-sm font-bold text-zinc-900">{fmt(booking.amount)}</span>
          </div>
        </div>

        {availableExpenses.length > 0 ? (
          <div>
            <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-2">
              <Paperclip size={12} /> Select an Existing Payment to Attach
            </Label>
            
            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl bg-white">
              {availableExpenses.map((e) => {
                const isSelected = String(selectedExpenseId) === String(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedExpenseId(e.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#234c6a]/10 border-l-3 border-[#234c6a]' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs ${
                        isSelected ? 'border-[#234c6a] bg-[#234c6a] text-white' : 'border-zinc-300 bg-white'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">
                          {e.description || 'Payment'}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(e.date)}</span>
                          <span>•</span>
                          <span className="capitalize">{e.payment_type || 'Normal'}</span>
                          {e.booking_id && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600">Currently linked to #{e.booking_id}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-zinc-900">
                      {fmt(e.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-zinc-50 rounded-xl border border-zinc-200/60 p-4">
            <AlertCircle size={24} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-xs text-zinc-600 font-medium">No other payments found to attach.</p>
            <p className="text-[11px] text-zinc-400 mt-1">You can record a brand new payment for this booking instead.</p>
            {onRecordNew && (
              <Button 
                radius="sm" 
                size="sm" 
                className="mt-3 bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={() => { onClose(); onRecordNew(); }}
              >
                <Plus size={14} /> Record New Payment
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
          {onRecordNew && availableExpenses.length > 0 ? (
            <button
              type="button"
              onClick={() => { onClose(); onRecordNew(); }}
              className="text-xs font-semibold text-[#234c6a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Or Record New Payment
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <Button radius="sm" variant="light" onClick={onClose}>
              Cancel
            </Button>
            {availableExpenses.length > 0 && (
              <Button 
                radius="sm" 
                className="bg-zinc-900 text-white hover:bg-zinc-800"
                onPress={handleAttach}
                onClick={handleAttach}
                isLoading={saving}
                isDisabled={!selectedExpenseId}
              >
                Attach Payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </TailwindModal>
  );
}
