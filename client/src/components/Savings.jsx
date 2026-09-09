import React, { useState, useEffect } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import { Plus, PiggyBank, TrendingUp, Calendar, Trash2, Layers, IndianRupee } from 'lucide-react';
import { api, fmt, MONTH_NAMES } from '../utils/api';
import { AddSavingModal } from './SharedModals';
import { TailwindModal } from './TailwindModal';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

export default function Savings() {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try { 
      const data = await api.getSavings();
      data.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return MONTH_NAMES.indexOf(b.month) - MONTH_NAMES.indexOf(a.month);
      });
      setSavings(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const total = savings.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const avgContribution = savings.length > 0 ? Math.round(total / savings.length) : 0;

  const confirmDelete = (id) => {
    setDelId(id);
    setIsDelOpen(true);
  };

  const handleDelete = async () => {
    if (!delId) return;
    setDeleting(true);
    try {
      await api.deleteSavings(delId);
      setIsDelOpen(false);
      setSavings(prev => prev.filter(s => s.id !== delId));
      toast({ title: 'Saving deleted', status: 'success' });
      await loadData();
    } catch (e) {
      toast({ title: 'Failed to delete saving', description: e.message, status: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-7 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <PiggyBank size={24} className="text-zinc-900" /> Savings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Track your monthly wedding contributions and deposits</p>
        </div>
        <Button radius="sm" className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Log Saving
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Accumulated</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(total)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#234c6a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Contributions</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {savings.length} {savings.length === 1 ? 'deposit' : 'deposits'}
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
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Average Contribution</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">{fmt(avgContribution)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Savings Table */}
      <div className="shadow-sm border border-zinc-200/80 rounded-xl overflow-hidden bg-white">
        {savings.length > 0 ? (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                  <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">MONTH</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">YEAR</th>
                    <th className="py-3.5 px-4 min-w-[200px]">NOTE</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">AMOUNT</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {savings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-[#1b3c53]/[0.04] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-zinc-900">{s.month}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {s.year}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-zinc-600">{s.note || <span className="text-zinc-300">—</span>}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-zinc-900">{fmt(s.amount)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => confirmDelete(s.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={savings.length}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center mb-3 text-zinc-300">
              <PiggyBank size={32} />
            </div>
            <h3 className="text-zinc-700 font-bold text-base">No savings logged yet</h3>
            <p className="text-zinc-400 text-xs mt-1">Start tracking your wedding funds by logging your first saving.</p>
          </div>
        )}
      </div>

      <AddSavingModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={async (newSaving) => {
          if (newSaving && newSaving.id) {
            setSavings(prev => [newSaving, ...prev.filter(s => s.id !== newSaving.id)]);
          }
          await loadData();
        }} 
      />

      {/* Delete Confirmation Modal */}
      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Saving Entry?">
        <div className="p-2">
          <p className="text-zinc-600 mb-6 text-sm">
            Are you sure you want to permanently delete this saving record? This will adjust your total accumulated balance.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsDelOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Entry"}
            </button>
          </div>
        </div>
      </TailwindModal>
    </div>
  );
}
