import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Chip
} from '@heroui/react'
import {
  TrendingUp, Wallet,
  PieChart as PieIcon, BarChart2, Receipt,
  ChevronRight, IndianRupee,
  Smartphone, Users, Heart, Calendar, MapPin,
  Sparkles, CheckCircle2, Store, ListChecks,
  ArrowRight, Edit3, Clock, Check, Send, Plus,
  PiggyBank, Camera
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { api, fmt, fmtK, formatDate, MONTH_NAMES } from '../utils/api'
import { AddExpenseModal, AddSavingModal } from './SharedModals'
import { TelegramModal } from './TelegramModal'
import TablePagination from './TablePagination'
import OnboardingWizard from './OnboardingWizard'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const CAT_COLORS = [
  '#9b1c1c', // Royal Sindoor
  '#b45309', // Marigold Amber
  '#047857', // Mehendi Emerald
  '#d97706', // Warm Gold
  '#be123c', // Festive Crimson
  '#0e7490', // Royal Teal
  '#4338ca', // Royal Indigo
  '#a16207', // Mustard Gold
  '#854d0e', // Warm Ochre
  '#15803d', // Forest Leaf
  '#b91c1c', // Crimson Red
  '#92400e'  // Deep Sandalwood
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200/50 rounded-2xl p-3.5 shadow-xl text-sm min-w-[160px]">
      <div className="font-bold text-zinc-800 mb-2 text-xs">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-zinc-600 text-xs">{p.name}</span>
          </div>
          <span className="font-bold text-zinc-900 text-xs">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('suite'); // 'suite' (B2C) | 'analytics' (ERP deep-dive)
  
  // Data States
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [savings, setSavings] = useState([])
  const [categories, setCategories] = useState([])
  const [guestSummary, setGuestSummary] = useState(null)
  const [weddingProfile, setWeddingProfile] = useState(null)
  const [checklistTasks, setChecklistTasks] = useState([])
  const [bookings, setBookings] = useState([])

  // Modal States
  const [isAddExpOpen, setIsAddExpOpen] = useState(false)
  const [isAddSavOpen, setIsAddSavOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Telegram States
  const [telegramCode, setTelegramCode] = useState(null)
  const [telegramId, setTelegramId] = useState(null)
  const [telegramBotUsername, setTelegramBotUsername] = useState('MarriageExpenseManagementBot')
  const [isTelegramLinked, setIsTelegramLinked] = useState(false)
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  // Pagination for transactions table
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const handleGenerateTelegramCode = async () => {
    try {
      setGeneratingCode(true);
      const res = await api.generateTelegramCode();
      setTelegramCode(res.code);
      toast({ title: 'Code Generated', description: 'Send this code to the Telegram bot!', status: 'success' });
    } catch (e) {
      toast({ title: 'Failed to generate code', description: e.message, status: 'error' });
    } finally {
      setGeneratingCode(false);
    }
  }

  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true)
      const [sum, exp, sav, cats, tgStatus, gSum, profile, tasks, bks] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getExpenses().catch(() => []),
        api.getSavings().catch(() => []),
        api.getCategories().catch(() => []), 
        api.getTelegramStatus().catch(() => ({ isLinked: false, activeCode: null, telegramId: null })),
        api.getGuestSummary().catch(() => null),
        api.getWeddingProfile().catch(() => null),
        api.getChecklistTasks().catch(() => []),
        api.getBookings().catch(() => [])
      ])
      
      setSummary(sum);
      setExpenses(Array.isArray(exp) ? exp : (exp?.expenses || []));
      setSavings(Array.isArray(sav) ? sav : (sav?.savings || []));
      setCategories(Array.isArray(cats) ? cats : (cats?.categories || []));
      setGuestSummary(gSum);
      setWeddingProfile(profile);
      setChecklistTasks(Array.isArray(tasks) ? tasks : (tasks?.tasks || []));
      setBookings(Array.isArray(bks) ? bks : (bks?.bookings || []));

      if (tgStatus.activeCode) setTelegramCode(tgStatus.activeCode);
      if (tgStatus.telegramId) setTelegramId(tgStatus.telegramId);
      if (tgStatus.botUsername) setTelegramBotUsername(tgStatus.botUsername);
      setIsTelegramLinked(!!tgStatus.isLinked);
    } catch (e) {
      toast({ title: 'Error loading dashboard', description: e.message, status: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { loadAll() }, [loadAll])

  // Quick toggle a task completed directly from dashboard
  const handleToggleTask = async (taskId) => {
    try {
      await api.toggleChecklistTask(taskId);
      setChecklistTasks(prev => {
        const list = Array.isArray(prev) ? prev : (prev?.tasks || []);
        return list.map(t => t.id === taskId || t.task_id === taskId ? { ...t, completed: t.completed ? 0 : 1 } : t);
      });
      toast({ title: 'Task Updated', description: 'Great job staying on track!', status: 'success' });
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, status: 'error' });
    }
  };

  // Recharts Trends (for Financial Analytics tab)
  const savingsTrend = useMemo(() => {
    const sorted = [...savings].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month)
    })
    let cum = 0
    return sorted.map(s => {
      cum += s.amount
      const m = s.month || 'Jan'
      const y = s.year || new Date().getFullYear()
      return { name: `${m.slice(0,3)} '${String(y).slice(2)}`, monthly: s.amount, cumulative: cum }
    })
  }, [savings])

  const monthlyComparison = useMemo(() => {
    const map = {}
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const sort = (yr, mo) => yr * 12 + mo

    savings.forEach(s => {
      const yr = s.year || new Date().getFullYear()
      const mi = MONTH_NAMES.indexOf(s.month)
      const k  = `${(s.month||'').slice(0,3)} '${String(yr).slice(2)}`
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(yr, mi) }
      map[k].savings += s.amount
    })
    expenses.forEach(e => {
      const d  = new Date(e.date)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const k  = `${months[mo]} '${String(yr).slice(2)}`
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(yr, mo) }
      map[k].expenses += e.amount
    })
    return Object.values(map).sort((a, b) => a._sort - b._sort)
  }, [savings, expenses])

  const pieData = useMemo(
    () => categories.map(c => ({ name: c.category, value: c.total })),
    [categories]
  )

  // Calculations for Wedding Suite
  const weddingDateStr = weddingProfile?.wedding_date || '';
  const countdownDays = useMemo(() => {
    if (!weddingDateStr) return null;
    const diff = new Date(weddingDateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [weddingDateStr]);

  const taskList = Array.isArray(checklistTasks) ? checklistTasks : (checklistTasks?.tasks || []);
  const totalTasksCount = taskList.length;
  const completedTasksCount = taskList.filter(t => t.completed).length;
  const checklistPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const upcomingTasks = useMemo(() => {
    const list = Array.isArray(checklistTasks) ? checklistTasks : (checklistTasks?.tasks || []);
    return list.filter(t => !t.completed).slice(0, 4);
  }, [checklistTasks]);

  const totalSavings = Number(summary?.totalSavings || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const budgetTotal = Number(summary?.budget || weddingProfile?.estimated_budget || 0);
  const remainingBudget = Math.max(0, budgetTotal - totalExpenses);
  const budgetUtilization = budgetTotal > 0 ? Math.round((totalExpenses / budgetTotal) * 100) : 0;

  // Profile Completeness Milestones
  const profileMilestones = useMemo(() => [
    { key: 'groom_name', label: 'Groom Name', done: Boolean(weddingProfile?.groom_name?.trim()), weight: 15 },
    { key: 'bride_name', label: 'Bride Name', done: Boolean(weddingProfile?.bride_name?.trim()), weight: 15 },
    { key: 'groom_photo', label: 'Groom Photo', done: Boolean(weddingProfile?.groom_photo_url), weight: 15 },
    { key: 'bride_photo', label: 'Bride Photo', done: Boolean(weddingProfile?.bride_photo_url), weight: 15 },
    { key: 'wedding_date', label: 'Muhurat Date', done: Boolean(weddingProfile?.wedding_date), weight: 15 },
    { key: 'wedding_location', label: 'Destination City', done: Boolean(weddingProfile?.wedding_location?.trim()), weight: 15 },
    { key: 'story_or_budget', label: 'Budget & Theme', done: Boolean((weddingProfile?.estimated_budget || 0) > 0 || weddingProfile?.cover_photo_url), weight: 10 },
  ], [weddingProfile]);

  const profileProgress = useMemo(() => {
    return profileMilestones.reduce((acc, m) => acc + (m.done ? m.weight : 0), 0);
  }, [profileMilestones]);

  const pendingMilestones = useMemo(() => {
    return profileMilestones.filter(m => !m.done);
  }, [profileMilestones]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-medium">Opening your wedding suite...</span>
        </div>
      </div>
    )
  }

  const firstName = currentUser?.displayName?.split(' ')[0] || weddingProfile?.groom_name || 'there';

  const coupleTitle = weddingProfile?.groom_name && weddingProfile?.bride_name
    ? `${weddingProfile.groom_name} & ${weddingProfile.bride_name}`
    : 'Our Wedding';

  const locationStr = weddingProfile?.wedding_location || '';

  const avgContribution = savings.length > 0
    ? Math.round(totalSavings / savings.length)
    : 0;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — Dark Hero  (Full width edge-to-edge)
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[#1A1A1A] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Greeting */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] leading-tight tracking-tight mb-12">
            <span className="font-bold">{firstName},</span>{' '}
            <span className="font-serif italic font-normal text-zinc-400">here's</span>
            <br />
            <span className="font-serif italic font-normal text-zinc-400">what's happening</span>
          </h1>

          {/* 4 Stat Numbers — inline like Hitchd */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-8">
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2">
                {fmt(totalSavings)}
              </div>
              <div className="text-sm text-zinc-500 font-medium">Total received</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2">
                {fmt(0)}
              </div>
              <div className="text-sm text-zinc-500 font-medium">Received today</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2">
                {fmt(avgContribution)}
              </div>
              <div className="text-sm text-zinc-500 font-medium">Average contribution</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2">
                {savings.length}
              </div>
              <div className="text-sm text-zinc-500 font-medium">Contributions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* SECTION 2 — Couple Info Bar */}
        <div>
        <div className="bg-[#F5F5F0] rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Couple Avatar */}
            <div className="w-11 h-11 rounded-full bg-zinc-300 overflow-hidden shrink-0 border-2 border-white shadow-sm">
              {weddingProfile?.groom_photo_url ? (
                <img src={weddingProfile.groom_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-400 flex items-center justify-center text-white font-bold text-sm">
                  {(weddingProfile?.groom_name?.[0] || 'A').toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-zinc-900 text-[15px]">{coupleTitle}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {locationStr && <span>{locationStr}</span>}
                {locationStr && countdownDays != null && <span> · </span>}
                {countdownDays != null && (
                  <span>{countdownDays > 0 ? `${countdownDays} days left until ceremony` : 'Wedding day!'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddExpOpen(true)}
              className="px-4 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Log Expense
            </button>
            <button
              onClick={() => setIsAddSavOpen(true)}
              className="px-4 py-2.5 rounded-full bg-white text-zinc-900 text-xs font-bold border border-zinc-200 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Add Contribution
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — Wedding Portals & Overview
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">Wedding Portals & Overview</h2>
          <span className="text-xs text-zinc-400 font-medium hidden sm:block">Real-time status across key areas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { badge: 'Payments & Kharcha', title: 'Shaadi Payments', path: '/expenses', value: fmt(totalExpenses) },
            { badge: 'Bookings & Advances', title: 'Vendor Contracts', path: '/bookings', value: `${bookings.length} bookings` },
            { badge: 'Family & Invitations', title: 'Guests & RSVPs', path: '/guests', value: `${weddingProfile?.guest_count || 0} guests` },
            { badge: 'Milestones & Tasks', title: 'Wedding Roadmap', path: '/checklist', value: `${checklistPercent}% done` },
          ].map(card => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white border border-zinc-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-zinc-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{card.badge}</span>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-600 transition-colors" />
              </div>
              <div className="font-bold text-zinc-900 text-base">{card.title}</div>
              <div className="text-xs text-zinc-500 mt-1 font-medium">{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — Charts
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-base text-zinc-900 mb-6">Cashflow Overview</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181B" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#18181B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulative" name="Total Saved" stroke="#18181B" strokeWidth={2} fill="url(#colorCum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-base text-zinc-900 mb-6">Monthly Breakdown</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F4F5' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="savings" name="Savings" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — Category Breakdown + Recent Activity
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-base text-zinc-900 mb-6">Categories</h3>
          {pieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-zinc-400 text-sm">No expenses yet</div>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-zinc-900">Recent Activity</h3>
            <button
              onClick={() => navigate('/expenses')}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-10">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {expenses.slice(0, 5).map(e => (
                <div key={e.id} className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 text-sm">{e.description || e.category}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{formatDate(e.date)} · {e.category}</div>
                    </div>
                  </div>
                  <div className="font-bold text-zinc-900 text-sm">{fmt(e.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── Modals ── */}
      {isAddExpOpen && (
        <AddExpenseModal isOpen={isAddExpOpen} onClose={() => setIsAddExpOpen(false)} onSuccess={() => { setIsAddExpOpen(false); loadAll(); }} />
      )}
      {isAddSavOpen && (
        <AddSavingModal isOpen={isAddSavOpen} onClose={() => setIsAddSavOpen(false)} onSuccess={() => { setIsAddSavOpen(false); loadAll(); }} />
      )}
      {isEditProfileOpen && (
        <OnboardingWizard initialProfile={weddingProfile} onComplete={(p) => { setWeddingProfile(p); setIsEditProfileOpen(false); loadAll(); }} onDismiss={() => setIsEditProfileOpen(false)} />
      )}
    </>
  )
}
