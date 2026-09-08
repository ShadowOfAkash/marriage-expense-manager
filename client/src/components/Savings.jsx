import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Chip } from '@heroui/react';
import { Plus, PiggyBank, CalendarDays, TrendingUp } from 'lucide-react';
import { api, fmt, MONTH_NAMES } from '../utils/api';
import { AddSavingModal } from './SharedModals';

export default function Savings() {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try { 
      const data = await api.getSavings();
      data.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return MONTH_NAMES.indexOf(b.month) - MONTH_NAMES.indexOf(a.month);
      });
      setSavings(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const total = savings.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="max-w-7xl mx-auto py-7 px-4 md:px-6">
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-800 tracking-tight flex items-center gap-2">
            <PiggyBank size={24} className="text-zinc-900" /> Savings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Track your monthly wedding contributions</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md font-bold" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Log Saving
        </Button>
      </div>

      <Card className="mb-6 bg-zinc-50 border border-zinc-200">
        <Card.Content className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <TrendingUp size={28} className="text-zinc-900" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-600 uppercase tracking-wider mb-1">Total Accumulated</div>
              <div className="text-3xl font-extrabold text-zinc-900">{fmt(total)}</div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="shadow-sm border border-zinc-100">
        {savings.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500 font-medium">
                  <th className="py-3 px-4 font-medium">MONTH</th>
                  <th className="py-3 px-4 font-medium">YEAR</th>
                  <th className="py-3 px-4 font-medium">NOTE</th>
                  <th className="py-3 px-4 font-medium text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {savings.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-4"><span className="font-bold text-zinc-700">{s.month}</span></td>
                    <td className="py-3 px-4"><Chip size="sm" variant="flat" color="default" className="bg-zinc-100 text-zinc-900 border border-zinc-300">{s.year}</Chip></td>
                    <td className="py-3 px-4"><span className="text-sm text-zinc-500">{s.note || '—'}</span></td>
                    <td className="py-3 px-4 text-right"><span className="font-bold text-zinc-900">{fmt(s.amount)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <PiggyBank size={40} className="text-zinc-300 mb-4" />
            <h3 className="text-zinc-500 font-medium">No savings logged yet</h3>
          </div>
        )}
      </Card>

      <AddSavingModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={loadData} />
    </div>
  );
}
