import React, { useState, useEffect } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import { Plus, PiggyBank, TrendingUp, Calendar, Trash2, Layers, IndianRupee, Sparkles, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { api, fmt, MONTH_NAMES } from '../utils/api';
import { AddSavingModal } from './SharedModals';
import { TailwindModal } from './TailwindModal';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

export default function Savings() {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
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
      const list = Array.isArray(data) ? [...data] : [];
      list.sort((a, b) => {
        const yA = Number(a?.year) || 0;
        const yB = Number(b?.year) || 0;
        if (yB !== yA) return yB - yA;
        const mA = MONTH_NAMES.indexOf(a?.month);
        const mB = MONTH_NAMES.indexOf(b?.month);
        return mB - mA;
      });
      setSavings(list);
    } catch (e) {
      console.error('Failed to load savings:', e);
      setSavings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const total = Array.isArray(savings) ? savings.reduce((acc, curr) => acc + Number(curr?.amount || 0), 0) : 0;
  const avgContribution = (Array.isArray(savings) && savings.length > 0) ? Math.round(total / savings.length) : 0;

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
      toast({ title: 'Saving entry deleted', status: 'success' });
      await loadData();
    } catch (e) {
      toast({ title: 'Failed to delete saving', description: e.message, status: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Dark Hero */}
      <div className="w-full bg-[#111111] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">Contributions</h1>
              <p className="text-zinc-400 text-sm font-medium">Savings, shagun & family contributions</p>
            </div>
            <button onClick={() => setIsAddOpen(true)} className="px-5 py-3 rounded-full bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-100 transition-all shadow-sm flex items-center gap-2 cursor-pointer">
              <Plus size={16} /> Add Contribution
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6">
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mb-2">{fmt(total)}</div>
              <div className="text-sm text-zinc-500 font-medium">Total received</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mb-2">{fmt(avgContribution)}</div>
              <div className="text-sm text-zinc-500 font-medium">Average contribution</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mb-2">{savings.length}</div>
              <div className="text-sm text-zinc-500 font-medium">Total entries</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-end mb-6">
          <div className="inline-flex p-1.5 bg-zinc-50/70 border border-zinc-200 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs md:text-sm text-zinc-500 font-semibold">Loading your records...</p>
          </div>
        ) : savings.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
            <div className="w-18 h-18 rounded-2xl bg-zinc-50 flex items-center justify-center mb-4 text-zinc-400">
              <PiggyBank size={40} />
            </div>
            <h3 className="text-zinc-900 font-bold text-lg">No savings logged yet</h3>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1.5 max-w-sm text-center leading-relaxed">
              Start tracking your contributions and savings.
            </p>
            <button 
              className="mt-6 px-5 py-3 rounded-full bg-zinc-900 text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={16} /> Log First Contribution
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((s, i) => (
                <div 
                  key={s.id || i}
                  className="bg-white border border-zinc-200 rounded-3xl p-7 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between group relative overflow-hidden space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold">
                        <Calendar size={13} className="text-zinc-900" />
                        <span>{s.month} {s.year}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => confirmDelete(s.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="my-3">
                      <div className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase mb-1">DEPOSITED AMOUNT</div>
                      <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
                        {fmt(s.amount)}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-600 mt-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 leading-relaxed min-h-[56px]">
                      {s.note ? (
                        <span>{s.note}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Contribution deposit</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 text-zinc-500 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Added to Treasury
                    </span>
                    <span className="font-mono text-[11px]">#{String(s.id || '').slice(0, 6) || (i + 1)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <TablePagination
                currentPage={currentPage}
                totalItems={savings.length}
                pageSize={pageSize}
                pageSizeOptions={[6, 12, 24, 48]}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        ) : (
          <div className="shadow-sm border border-zinc-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-zinc-50 backdrop-blur-sm z-10 border-b border-zinc-200">
                  <tr className="text-zinc-500 font-bold text-xs tracking-wider">
                    <th className="py-4 px-6 whitespace-nowrap">MONTH</th>
                    <th className="py-4 px-6 whitespace-nowrap">YEAR</th>
                    <th className="py-4 px-6 min-w-[240px]">PURPOSE & NOTE</th>
                    <th className="py-4 px-6 text-right whitespace-nowrap">AMOUNT</th>
                    <th className="py-4 px-6 text-right whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {savings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-zinc-900 text-sm">{s.month}</span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-50 text-zinc-900 border border-zinc-200">
                          {s.year}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-zinc-600">{s.note || <span className="text-zinc-300">—</span>}</span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className="font-bold text-zinc-900 text-base">{fmt(s.amount)}</span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => confirmDelete(s.id)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

      <TailwindModal isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} title="Delete Saving Entry?">
        <div className="p-2">
          <p className="text-zinc-600 mb-6 text-sm">
            Are you sure you want to permanently delete this saving record? This will adjust your total accumulated balance.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsDelOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors border border-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Entry"}
            </button>
          </div>
        </div>
      </TailwindModal>
    </>
  );
}
