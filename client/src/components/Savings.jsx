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
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-6">
      {/* ── 1. Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9b1c1c] via-[#b91c1c] to-[#d97706] flex items-center justify-center text-amber-100 shadow-md shadow-amber-900/10 shrink-0">
              <PiggyBank size={22} className="text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight font-serif flex items-center gap-2">
                  Vivah Fund & Shagun Treasury
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-[10px] font-bold">
                  <Sparkles size={10} className="text-amber-600" /> शुभ बचत व शगुन
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Track family contributions, monthly savings & shagun treasury for your grand celebration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#9b1c1c] shadow-xs border border-amber-200/40'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#9b1c1c] shadow-xs border border-amber-200/40'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
          </div>

          <Button 
            radius="sm" 
            className="bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] hover:from-[#801717] hover:to-[#9b1c1c] text-white shadow-md font-bold text-xs cursor-pointer border border-rose-900/40" 
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={15} className="text-amber-200" /> Log Shagun / Deposit
          </Button>
        </div>
      </div>

      {/* ── 2. Top Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-amber-200/70 shadow-xs bg-white rounded-3xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7c1717] to-[#9b1c1c] text-amber-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Total Accumulated Fund</div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight font-serif">{fmt(total)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-amber-200/70 shadow-xs bg-white rounded-3xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <Layers size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Total Deposits Logged</div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight font-serif">
                {savings.length} {savings.length === 1 ? 'Deposit' : 'Deposits'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-amber-200/70 shadow-xs bg-white rounded-3xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <IndianRupee size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Average Contribution</div>
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight font-serif">{fmt(avgContribution)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. Savings View: Festive Cards vs Table ── */}
      {loading ? (
        <div className="py-20 text-center bg-white border border-amber-200/70 rounded-3xl shadow-xs">
          <div className="w-10 h-10 border-3 border-[#9b1c1c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500 font-semibold">Loading your wedding fund records...</p>
        </div>
      ) : savings.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white border border-amber-200/70 rounded-3xl shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-3 text-amber-500">
            <PiggyBank size={36} />
          </div>
          <h3 className="text-zinc-800 font-bold text-base font-serif">No savings logged yet</h3>
          <p className="text-zinc-400 text-xs mt-1 max-w-sm text-center">
            Start tracking your wedding funds, monthly salary contributions, or family shagun blessings.
          </p>
          <Button 
            radius="sm" 
            className="mt-4 bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] text-white font-bold text-xs cursor-pointer shadow-md"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={14} className="text-amber-200" /> Log First Contribution
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* 🎴 Festive Cards Grid */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((s, i) => (
              <div 
                key={s.id || i}
                className="bg-white border border-amber-200/70 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle festive background accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />

                <div>
                  {/* Top Badging Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF7F2] border border-amber-200/80 text-zinc-700 text-xs font-bold">
                      <Calendar size={12} className="text-[#9b1c1c]" />
                      <span>{s.month} {s.year}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => confirmDelete(s.id)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Amount Display */}
                  <div className="my-2">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Deposited Shagun</div>
                    <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight font-serif text-[#9b1c1c]">
                      {fmt(s.amount)}
                    </div>
                  </div>

                  {/* Note / Memo */}
                  <p className="text-xs text-zinc-600 mt-2 bg-amber-50/40 p-2.5 rounded-2xl border border-amber-100/60 leading-relaxed min-h-[48px]">
                    {s.note ? (
                      <span>📝 {s.note}</span>
                    ) : (
                      <span className="text-zinc-400 italic">Wedding contribution deposit</span>
                    )}
                  </p>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-amber-100/60 text-[11px] text-zinc-400">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Added to Treasury
                  </span>
                  <span className="font-mono">#{String(s.id || '').slice(0, 6) || (i + 1)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-amber-200/70 rounded-2xl shadow-2xs overflow-hidden">
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
        /* 📄 Detailed Table Mode */
        <div className="shadow-xs border border-amber-200/70 rounded-3xl overflow-hidden bg-white">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-[#FAF7F2] backdrop-blur-xs z-10 border-b border-amber-200/70">
                <tr className="text-zinc-600 font-bold text-xs tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">MONTH</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">YEAR</th>
                  <th className="py-3.5 px-4 min-w-[220px]">PURPOSE & NOTE</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">AMOUNT</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60">
                {savings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-zinc-900 font-serif">{s.month}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        {s.year}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm text-zinc-600">{s.note || <span className="text-zinc-300">—</span>}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-black text-zinc-900 font-serif text-[#9b1c1c]">{fmt(s.amount)}</span>
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
        </div>
      )}

      {/* Add Modal */}
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
            Are you sure you want to permanently delete this saving record? This will adjust your total accumulated wedding fund balance.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsDelOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Entry"}
            </button>
          </div>
        </div>
      </TailwindModal>
    </div>
  );
}
