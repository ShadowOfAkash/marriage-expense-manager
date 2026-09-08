import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card, Chip, Input, TextField, Label } from '@heroui/react';
import { Search, Plus, Filter, Tag, ChevronDown, Receipt, Calendar, Pencil, Trash2, Image as ImageIcon, Paperclip, X, IndianRupee, AlignLeft } from 'lucide-react';
import { api, fmt, formatDate, CATEGORIES } from '../utils/api';
import { AddExpenseModal } from './SharedModals';
import { TailwindModal } from './TailwindModal';

// Full Screen Viewer (Tailwind converted from old Chakra)
function FullScreenViewer({ url, isPdf, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <Button isIconOnly variant="light" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={onClose}>
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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [editItem, setEditItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => expenses.filter(e => {
    const matchCat = categoryFilter ? e.category === categoryFilter : true;
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [expenses, search, categoryFilter]);

  const openEdit = (e) => {
    setEditItem({ ...e });
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
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.updateExpense(editItem.id, editItem);
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <Receipt size={24} className="text-zinc-900" /> Payments
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track your wedding payments</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onClick={() => setIsAddOpen(true)}>
          <Plus size={18} /> Add Payment
        </Button>
      </div>

      <Card className="mb-6 shadow-sm border border-zinc-200">
        <Card.Content className="p-4 flex flex-col md:flex-row gap-4 items-center bg-zinc-50 rounded-xl">
          <Input
            placeholder="Search payments..."
            startContent={<Search size={16} className="text-zinc-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="w-full md:w-64 relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-4 bg-white hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-900 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </Card.Content>
      </Card>

      <Card className="shadow-sm border border-zinc-200">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-medium bg-zinc-50">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">DATE</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">CATEGORY</th>
                  <th className="py-3 px-4 font-medium min-w-[200px]">DESCRIPTION</th>
                  <th className="py-3 px-4 font-medium text-center whitespace-nowrap">DOCUMENT</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">AMOUNT</th>
                  <th className="py-3 px-4 font-medium text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap"><span className="text-sm text-zinc-600 font-medium"><Calendar size={12} className="inline mr-1 text-zinc-400" />{formatDate(e.date)}</span></td>
                    <td className="py-3 px-4 whitespace-nowrap"><Chip size="sm" variant="flat" color="default" className="bg-zinc-100 text-zinc-900 border border-zinc-300">{e.category}</Chip></td>
                    <td className="py-3 px-4"><span className="text-sm text-zinc-800">{e.description || "—"}</span></td>
                    <td className="py-3 px-4 text-center">
                      {e.receipt_url ? (
                        <Button isIconOnly size="sm" variant="light" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200" onClick={() => setViewerUrl(e.receipt_url)}>
                          <ImageIcon size={16} />
                        </Button>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap"><span className="font-bold text-zinc-900">{fmt(e.amount)}</span></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick={() => openEdit(e)}><Pencil size={14} /></Button>
                        <Button isIconOnly size="sm" variant="light" className="text-red-600 hover:bg-red-50" onClick={() => confirmDelete(e.id)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <Receipt size={40} className="text-zinc-300 mb-4" />
            <h3 className="text-zinc-500 font-medium">No payments found</h3>
          </div>
        )}
      </Card>

      <AddExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={loadData} />

      {/* Edit Modal */}
      <TailwindModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Payment">
        {editItem && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Tag size={12} /> Category</Label>
                <div className="relative">
                  <select
                    value={editItem.category || ''}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><IndianRupee size={12} /> Amount</Label>
                <Input type="number" value={editItem.amount} onChange={e => setEditItem({ ...editItem, amount: e.target.value })} startContent={<span className="text-zinc-500 font-bold">₹</span>} />
              </TextField>

              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Calendar size={12} /> Date</Label>
                <Input type="date" value={editItem.date} onChange={e => setEditItem({ ...editItem, date: e.target.value })} />
              </TextField>

              <TextField>
                <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><AlignLeft size={12} /> Description</Label>
                <Input value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} />
              </TextField>
            </div>

            <div className="flex items-center gap-3">
              <Button as="label" variant="outline" className="border-zinc-300 hover:bg-zinc-100 cursor-pointer text-zinc-700" isLoading={isUploading}>
                <Paperclip size={16} className="mr-2" /> {editItem.receipt_url ? 'Change Document' : 'Attach Document'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
              </Button>
              {editItem.receipt_url && (
                <Button variant="light" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => setViewerUrl(editItem.receipt_url)}>
                  <ImageIcon size={16} className="mr-2" /> View
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
              <Button variant="light" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={handleUpdate} isLoading={saving}>Update Payment</Button>
            </div>
          </div>
        )}
      </TailwindModal>

      {/* Delete Confirm Modal */}
      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Payment?">
        <div className="p-2">
          <p className="text-zinc-600 mb-6">This action cannot be undone. Are you sure you want to permanently delete this payment?</p>
          <div className="flex justify-end gap-2">
            <Button variant="light" onClick={() => setIsDelOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700 font-bold" onClick={handleDelete}>Delete Payment</Button>
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
