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
  ArrowRight, Edit3, Clock, Check, Send, Plus
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
  '#D97757', // Warm Rose Gold
  '#2E6F5E', // Royal Emerald
  '#D4AF37', // Champagne Gold
  '#C86D51', // Terracotta
  '#456882', // Slate
  '#E9C46A', // Warm Amber
  '#264653', // Deep Forest
  '#9D816B', // Warm Taupe
  '#B55F45', // Deep Rose
  '#5B809D', // Soft Muted Blue
  '#E76F51', // Coral Gold
  '#816B5C'  // Mocha
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-rose-100 rounded-2xl p-3.5 shadow-xl text-sm min-w-[160px]">
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

function StatCard({ label, value, Icon, helpText, arrowType, onClick, subtext, baseColor = '#D97757', isAlert = false }) {
  return (
    <Card 
      isPressable={!!onClick} onClick={onClick} className={`border ${isAlert ? 'border-rose-200 bg-rose-50/20' : 'border-rose-100/80 bg-white'} shadow-xs rounded-2xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''} p-4 md:p-5`}>
        <div>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 truncate">{label}</div>
            <div className={`text-xl md:text-2xl font-extrabold tracking-tight ${isAlert ? 'text-rose-700' : 'text-zinc-900'}`}>{value}</div>
            {helpText && (
              <div className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                isAlert ? 'text-rose-600' : arrowType === 'increase' ? 'text-emerald-600' : 'text-zinc-500'
              }`}>
                {arrowType === 'increase' && <span>↑</span>}
                {arrowType === 'decrease' && <span>↓</span>}
                {helpText}
              </div>
            )}
            {subtext && <div className="text-[11px] text-zinc-400 mt-0.5 font-medium truncate">{subtext}</div>}
          </div>
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs" 
            style={{ backgroundColor: baseColor + '15', color: baseColor }}
          >
            <Icon size={20} />
          </div>
        </div>
      </div>
    </Card>
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
      setExpenses(exp);
      setSavings(sav);
      setCategories(cats);
      setGuestSummary(gSum);
      setWeddingProfile(profile);
      setChecklistTasks(tasks);
      setBookings(bks);

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
      setChecklistTasks(prev => prev.map(t => t.id === taskId || t.task_id === taskId ? { ...t, completed: t.completed ? 0 : 1 } : t));
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

  const totalTasksCount = checklistTasks.length;
  const completedTasksCount = checklistTasks.filter(t => t.completed).length;
  const checklistPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const upcomingTasks = useMemo(() => {
    return checklistTasks.filter(t => !t.completed).slice(0, 4);
  }, [checklistTasks]);

  const totalSavings = Number(summary?.totalSavings || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const budgetTotal = Number(summary?.budget || weddingProfile?.estimated_budget || 0);
  const remainingBudget = Math.max(0, budgetTotal - totalExpenses);
  const budgetUtilization = budgetTotal > 0 ? Math.round((totalExpenses / budgetTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#D97757] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-medium">Opening your wedding suite...</span>
        </div>
      </div>
    )
  }

  // Display couple title
  const coupleTitle = weddingProfile?.story_title || 
    (weddingProfile?.groom_name && weddingProfile?.bride_name
      ? `${weddingProfile.groom_name} & ${weddingProfile.bride_name}'s Wedding`
      : 'Our Wedding Celebration');

  const sideLabel = weddingProfile?.planning_side === 'Groom'
    ? "🤵 Groom's Side Planning"
    : weddingProfile?.planning_side === 'Bride'
    ? "👰 Bride's Side Planning"
    : "💍 Joint Wedding Planning";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* ── 1. Couple Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-[#FFFDFB] to-[#F5ECE0] border border-rose-200/70 p-6 md:p-8 mb-6 shadow-sm">
        {/* Subtle romantic accents */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-rose-200/80 text-[#D97757] text-xs font-bold shadow-2xs">
                <Heart size={12} className="fill-[#D97757]" />
                <span>{sideLabel}</span>
              </span>
              {weddingProfile?.wedding_location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-zinc-200/80 text-zinc-600 text-xs font-medium">
                  <MapPin size={12} className="text-[#2E6F5E]" />
                  <span>{weddingProfile.wedding_location}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tight leading-tight mb-2">
              {coupleTitle}
            </h1>

            <p className="text-sm text-zinc-600 font-medium flex items-center gap-2">
              {weddingDateStr ? (
                <>
                  <Calendar size={14} className="text-[#D97757]" />
                  <span>{new Date(weddingDateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </>
              ) : (
                <span>Set your wedding date to unlock the countdown & personalized milestones</span>
              )}
            </p>
          </div>

          {/* Right Hero Side: Live Countdown & Edit Profile */}
          <div className="flex flex-row md:flex-col items-end gap-3 w-full md:w-auto justify-between md:justify-end">
            {countdownDays !== null && (
              <div className="bg-white/90 backdrop-blur-xs border border-rose-200/80 rounded-2xl px-5 py-3.5 shadow-sm text-center">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles size={11} className="text-[#D97757]" /> The Big Day
                </div>
                <div className="text-2xl md:text-3xl font-black text-zinc-900">
                  {countdownDays > 0 ? (
                    <>
                      {countdownDays} <span className="text-sm font-semibold text-[#D97757]">Days to Go! 🎉</span>
                    </>
                  ) : countdownDays === 0 ? (
                    <span className="text-xl text-[#D97757]">Today! 🎊</span>
                  ) : (
                    <span className="text-sm text-zinc-600">Celebrated ✨</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-xs font-semibold text-zinc-700 hover:text-zinc-900 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} className="text-zinc-500" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. View Mode Tabs ── */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('suite')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'suite'
                ? 'bg-[#D97757] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <span>🌸 Wedding Suite</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#D97757] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <span>📊 Financial Deep-Dive</span>
          </button>
        </div>

        {/* Action button */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddExpOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Add Payment
          </button>
        </div>
      </div>

      {/* ── 3. B2C Wedding Suite View ── */}
      {activeTab === 'suite' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 4 Planning Pulse Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Countdown / Milestone */}
            <div 
              onClick={() => navigate('/checklist')}
              className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Countdown</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1">
                {countdownDays !== null ? `${countdownDays} Days` : 'Set Date'}
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">
                {countdownDays > 0 ? `~${Math.round(countdownDays / 30)} months to prepare` : 'Wedding timeline'}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#D97757] group-hover:translate-x-0.5 transition-transform">
                <span>View Timeline</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* Checklist Progress */}
            <div 
              onClick={() => navigate('/checklist')}
              className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Checklist Pulse</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ListChecks size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1">
                {completedTasksCount} <span className="text-sm font-medium text-zinc-400">/ {totalTasksCount || 51} done</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-2 mb-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${checklistPercent}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{checklistPercent}% Complete</span>
                <span className="text-[#D97757] font-semibold flex items-center gap-0.5">Tasks <ChevronRight size={12} /></span>
              </div>
            </div>

            {/* Guest RSVP Pulse */}
            <div 
              onClick={() => navigate('/guests')}
              className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Guest RSVPs</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1">
                {guestSummary?.confirmed || 0} <span className="text-sm font-medium text-zinc-400">Confirmed</span>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">
                {guestSummary?.total || 0} total invited ({guestSummary?.pending || 0} awaiting RSVP)
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2E6F5E] group-hover:translate-x-0.5 transition-transform">
                <span>Guest Manager</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* Budget Snapshot */}
            <div 
              onClick={() => navigate('/expenses')}
              className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Budget Health</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#D97757] flex items-center justify-center">
                  <IndianRupee size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1">
                {fmt(totalExpenses)}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-[#D97757] to-[#C86D51] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, budgetUtilization)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{budgetUtilization}% of {fmt(budgetTotal)}</span>
                <span className="text-[#D97757] font-semibold flex items-center gap-0.5">Details <ChevronRight size={12} /></span>
              </div>
            </div>
          </div>

          {/* ── Upcoming Tasks & Quick Actions 2-Column ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Next Milestones (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-rose-100/90 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#D97757] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900">Next Upcoming Milestones</h3>
                    <p className="text-xs text-zinc-500">Check off tasks as you complete them</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checklist')}
                  className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>All Tasks ({totalTasksCount})</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 text-sm">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-zinc-700">All caught up!</p>
                  <p className="text-xs text-zinc-400 mt-1">Add more custom tasks in your checklist.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {upcomingTasks.map(task => (
                    <div key={task.id || task.task_id} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id || task.task_id)}
                          className="w-6 h-6 rounded-full border border-zinc-300 hover:border-emerald-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Mark complete"
                        >
                          <Check size={12} className="text-transparent group-hover:text-emerald-500" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 font-medium text-zinc-600">{task.category || 'General'}</span>
                            {task.timeline_stage && <span>• {task.timeline_stage}</span>}
                          </div>
                        </div>
                      </div>

                      {task.estimated_cost > 0 && (
                        <span className="text-xs font-bold text-zinc-600 shrink-0">
                          ~{fmt(task.estimated_cost)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Vendor Shortcuts (1 Col) */}
            <div className="space-y-4">
              {/* Quick Action Buttons */}
              <div className="bg-white rounded-3xl border border-rose-100/90 p-6 shadow-xs">
                <h3 className="font-extrabold text-sm text-zinc-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/vendors')}
                    className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 text-[#234c6a] text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <Store size={18} className="mb-2" />
                    <span>Find Vendors</span>
                  </button>

                  <button
                    onClick={() => navigate('/guests')}
                    className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 text-[#2E6F5E] text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <Users size={18} className="mb-2" />
                    <span>Invite Guests</span>
                  </button>

                  <button
                    onClick={() => setIsAddExpOpen(true)}
                    className="p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-100 text-[#D97757] text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <Receipt size={18} className="mb-2" />
                    <span>Add Expense</span>
                  </button>

                  <button
                    onClick={() => setIsTelegramModalOpen(true)}
                    className="p-3 rounded-xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <Send size={18} className="mb-2" />
                    <span>Telegram Bot</span>
                  </button>
                </div>
              </div>

              {/* Vendor Category Hub Banner */}
              <div 
                onClick={() => navigate('/vendors')}
                className="bg-gradient-to-br from-[#FAF7F2] to-[#F5ECE0] border border-rose-200/80 rounded-3xl p-5 shadow-xs cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#D97757] uppercase tracking-wider mb-1">
                  <Store size={14} /> Vendor Discovery
                </div>
                <h4 className="font-extrabold text-base text-zinc-900 mb-1">
                  Explore 12 Wedding Categories
                </h4>
                <p className="text-xs text-zinc-500 mb-3">
                  Find photographers, banquet venues, decorators, and caterers near {weddingProfile?.wedding_location || 'you'}.
                </p>
                <span className="text-xs font-bold text-[#D97757] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Marketplace <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Financial Deep-Dive View (Preserved ERP Charts & Tables) ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Expenses"
              value={fmt(totalExpenses)}
              Icon={Receipt}
              helpText={`${budgetUtilization}% of budget`}
              isAlert={budgetUtilization > 100}
              baseColor="#D97757"
              onClick={() => navigate('/expenses')}
            />
            <StatCard
              label="Remaining Budget"
              value={fmt(remainingBudget)}
              Icon={Wallet}
              helpText={budgetUtilization > 100 ? 'Budget exceeded' : 'Available to spend'}
              isAlert={budgetUtilization > 100}
              baseColor="#2E6F5E"
              onClick={() => navigate('/expenses')}
            />
            <StatCard
              label="Total Savings"
              value={fmt(totalSavings)}
              Icon={TrendingUp}
              helpText="Accumulated funds"
              baseColor="#D4AF37"
              onClick={() => navigate('/savings')}
            />
            <StatCard
              label="Net Position"
              value={fmt(totalSavings - totalExpenses)}
              Icon={IndianRupee}
              helpText={totalSavings >= totalExpenses ? 'Fully funded' : 'Savings deficit'}
              isAlert={totalSavings < totalExpenses}
              baseColor="#234c6a"
            />
          </div>

          {/* Recharts Analytics: Area + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Accumulation Area Chart */}
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs">
              <h3 className="font-extrabold text-sm text-zinc-800 mb-4">Savings vs Cumulative Growth</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E6F5E" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2E6F5E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" name="Total Savings" stroke="#2E6F5E" strokeWidth={2} fillOpacity={1} fill="url(#cumColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Comparison Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs">
              <h3 className="font-extrabold text-sm text-zinc-800 mb-4">Monthly Expenses vs Savings</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="expenses" name="Expenses" fill="#D97757" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="savings" name="Savings" fill="#2E6F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Breakdown Pie + Transactions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs">
              <h3 className="font-extrabold text-sm text-zinc-800 mb-4">Expenses by Category</h3>
              {pieData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-xs text-zinc-400">
                  No expense records yet
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => fmt(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Transactions Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-rose-100 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-sm text-zinc-800">Recent Transactions</h3>
                <button
                  onClick={() => navigate('/expenses')}
                  className="text-xs font-bold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({expenses.length})</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-xs text-zinc-400">
                  No expenses recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 overflow-x-auto">
                  {expenses.slice(0, 5).map(e => (
                    <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-zinc-800">{e.description || e.category}</div>
                        <div className="text-[11px] text-zinc-400">{formatDate(e.date)} • {e.category}</div>
                      </div>
                      <div className="font-extrabold text-zinc-900">{fmt(e.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {isAddExpOpen && (
        <AddExpenseModal
          isOpen={isAddExpOpen}
          onClose={() => setIsAddExpOpen(false)}
          onSuccess={() => { setIsAddExpOpen(false); loadAll(); }}
        />
      )}

      {isAddSavOpen && (
        <AddSavingModal
          isOpen={isAddSavOpen}
          onClose={() => setIsAddSavOpen(false)}
          onSuccess={() => { setIsAddSavOpen(false); loadAll(); }}
        />
      )}

      {isTelegramModalOpen && (
        <TelegramModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          telegramCode={telegramCode}
          telegramId={telegramId}
          telegramBotUsername={telegramBotUsername}
          isTelegramLinked={isTelegramLinked}
          generatingCode={generatingCode}
          onGenerateCode={handleGenerateTelegramCode}
          onRefresh={loadAll}
        />
      )}

      {isEditProfileOpen && (
        <OnboardingWizard
          initialProfile={weddingProfile}
          onComplete={(p) => {
            setWeddingProfile(p);
            setIsEditProfileOpen(false);
            loadAll();
          }}
          onDismiss={() => setIsEditProfileOpen(false)}
        />
      )}
    </div>
  )
}
