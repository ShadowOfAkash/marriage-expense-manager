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
  ArrowRight, ArrowUpRight, Edit3, Clock, Check, Send, Plus,
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
  '#18181B', // Charcoal Black
  '#3F3F46', // Dark Zinc
  '#52525B', // Neutral Zinc
  '#71717A', // Medium Zinc
  '#A1A1AA', // Light Slate
  '#D4D4D8', // Soft Silver
  '#27272A', // Deep Zinc
  '#09090B', // Pitch Black
  '#E4E4E7', // Pale Zinc
  '#1E293B', // Slate Dark
  '#334155', // Slate Mid
  '#64748B'  // Slate Light
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111111] text-white border border-zinc-800 rounded-2xl p-3.5 shadow-2xl text-xs min-w-[160px]">
      <div className="font-semibold text-zinc-400 mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#fff' }} />
            <span className="text-zinc-300">{p.name}</span>
          </div>
          <span className="font-bold text-white">{fmt(p.value)}</span>
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

  const firstName = weddingProfile?.groom_name 
    || (currentUser?.displayName && !currentUser.displayName.includes('@') && !currentUser.displayName.includes('.')
        ? currentUser.displayName.split(' ')[0] 
        : 'Akash');

  const coupleTitle = weddingProfile?.groom_name && weddingProfile?.bride_name
    ? `${weddingProfile.groom_name} & ${weddingProfile.bride_name}`
    : 'Akash & Shivangi';

  const locationStr = weddingProfile?.wedding_location || 'Saket Nagar, Kanpur, Uttar Pradesh, India';

  const avgContribution = savings.length > 0
    ? Math.round(totalSavings / savings.length)
    : 0;

  const defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — Dark Hero  (Full width edge-to-edge)
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[#111111] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Greeting */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] leading-tight tracking-tight mb-12">
            <span className="font-extrabold text-white">{firstName},</span>{' '}
            <span className="font-normal text-zinc-400">here's</span>
            <br />
            <span className="font-normal text-zinc-400">what's happening</span>
          </h1>

          {/* 4 Stat Numbers — inline like Hitchd */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-8">
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2 text-white">
                {fmt(totalSavings)}
              </div>
              <div className="text-sm text-zinc-400 font-medium">Total received</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2 text-white">
                {fmt(0)}
              </div>
              <div className="text-sm text-zinc-400 font-medium">Received today</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2 text-white">
                {fmt(avgContribution)}
              </div>
              <div className="text-sm text-zinc-400 font-medium">Average contribution</div>
            </div>
            <div className="md:border-l md:border-zinc-800 md:pl-10">
              <div className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight leading-none mb-2 text-white">
                {savings.length}
              </div>
              <div className="text-sm text-zinc-400 font-medium">Contributions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* SECTION 2 — Couple Info Bar (Hitchd Style) */}
        <div>
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Couple Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-zinc-200 shadow-sm">
                <img 
                  src={weddingProfile?.groom_photo_url || defaultAvatar} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <div className="font-bold text-zinc-900 text-base">{coupleTitle}</div>
                <div className="text-xs text-zinc-400 font-normal mt-0.5">
                  {locationStr && <span>{locationStr}</span>}
                  {locationStr && <span> · </span>}
                  <span>{countdownDays != null && countdownDays > 0 ? `${countdownDays} days left until ceremony` : '122 days left until ceremony'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddExpOpen(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-zinc-900 text-white text-xs sm:text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Log Expense
              </button>
              <button
                onClick={() => setIsAddSavOpen(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-white text-zinc-900 text-xs sm:text-sm font-bold border border-zinc-200 hover:bg-zinc-50 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Add Contribution
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 — Wedding Portals & Overview (Exact Hitchd Cards)
            ═══════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Wedding Portals & Overview</h2>
            <span className="text-xs text-zinc-400 font-normal hidden sm:block">Real-time status across key areas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { badge: 'PAYMENTS & KHARCHA', title: 'Shaadi Payments', path: '/expenses' },
              { badge: 'BOOKINGS & ADVANCES', title: 'Vendor Contracts', path: '/bookings' },
              { badge: 'FAMILY & INVITATIONS', title: 'Guests & RSVPs', path: '/guests' },
              { badge: 'MILESTONES & TASKS', title: 'Wedding Roadmap', path: '/checklist' },
            ].map(card => (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                className="bg-white border border-zinc-200 rounded-3xl p-7 min-h-[160px] flex flex-col justify-between cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase">{card.badge}</span>
                  <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:border-zinc-400 transition-colors">
                    <ArrowUpRight size={15} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-6 group-hover:text-black">
                  {card.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4 — Financial Analytics & Dynamics (Monochrome Premium Theme)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Cashflow Overview */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-7 sm:p-8 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase">CASHFLOW & LIQUIDITY</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {fmt(totalSavings)} Total
                </span>
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1 mb-1">
                Cumulative Treasury
              </div>
              <p className="text-xs text-zinc-400 font-normal mb-6">
                Net received contributions and liquid reserves over time
              </p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181B" stopOpacity={0.16}/>
                      <stop offset="95%" stopColor="#18181B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#A1A1AA" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}
                  />
                  <YAxis 
                    stroke="#A1A1AA" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={fmtK}
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Total Saved" stroke="#18181B" strokeWidth={2.5} fill="url(#colorCum)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Monthly Comparison */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-7 sm:p-8 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase">MONTHLY BREAKDOWN</span>
                <div className="flex items-center gap-3 text-xs font-semibold text-zinc-600">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-900" /> Expenses</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-300" /> Savings</span>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1 mb-1">
                Cashflow Activity
              </div>
              <p className="text-xs text-zinc-400 font-normal mb-6">
                Month-by-month spending vs inward savings
              </p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#A1A1AA" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}
                  />
                  <YAxis 
                    stroke="#A1A1AA" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={fmtK}
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F4F5' }} />
                  <Bar dataKey="expenses" name="Expenses" fill="#18181B" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="savings" name="Savings" fill="#D4D4D8" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5 — Category Distribution & Recent Activity
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 3: Categories Split */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-7 sm:p-8 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase">BUDGET ALLOCATION</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {categories.length} Categories
                </span>
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1 mb-1">
                Category Split
              </div>
              <p className="text-xs text-zinc-400 font-normal mb-6">
                Spending distribution across services
              </p>
            </div>

            {pieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-zinc-400 text-xs">No expenses recorded</div>
            ) : (
              <div>
                <div className="h-[200px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={84}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-zinc-900 leading-none">{fmt(totalExpenses)}</span>
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">Total Spent</span>
                  </div>
                </div>

                {/* Top Category Legend Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-100">
                  {pieData.slice(0, 4).map((c, i) => (
                    <span key={c.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200/80 text-[11px] font-medium text-zinc-700">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="truncate max-w-[90px]">{c.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Recent Activity */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/90 rounded-3xl p-7 sm:p-8 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[0.08em] text-zinc-400 uppercase">LATEST TRANSACTIONS</span>
                <button
                  onClick={() => navigate('/expenses')}
                  className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 transition-colors cursor-pointer group"
                  title="View all payments"
                >
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1 mb-1">
                Recent Activity
              </div>
              <p className="text-xs text-zinc-400 font-normal mb-6">
                Real-time transactions and advance payments logged
              </p>
            </div>

            {expenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-10">
                <Receipt size={40} className="mb-3 opacity-20" />
                <p className="text-xs">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 5).map(e => (
                  <div 
                    key={e.id} 
                    onClick={() => navigate('/expenses')}
                    className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all shrink-0">
                        <Receipt size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 text-sm truncate group-hover:text-black">
                          {e.description || e.category}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span>{formatDate(e.date)}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-semibold">{e.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="font-extrabold text-zinc-900 text-sm sm:text-base tracking-tight">
                        {fmt(e.amount)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">
                        {e.payment_type || 'Direct'}
                      </div>
                    </div>
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
