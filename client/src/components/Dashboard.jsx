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
      {/* ── 0. Top Profile Progress Card ── */}
      <div className="mb-6 bg-gradient-to-r from-[#FAF7F2] via-white to-[#FDF9F3] border border-amber-200/90 rounded-3xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/20 via-rose-100/20 to-transparent rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9b1c1c] via-rose-600 to-amber-500 text-amber-100 flex items-center justify-center shrink-0 shadow-md shadow-rose-900/10 ring-2 ring-amber-200/60">
              <Sparkles size={22} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-serif font-black text-sm md:text-base text-zinc-900 tracking-tight">
                  {profileProgress === 100 ? '✨ Shubh Vivah Profile Complete!' : 'Personalize Your Couple Wedding Vibe'}
                </h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {profileProgress}% Completed
                </span>
              </div>

              <p className="text-xs text-zinc-500 line-clamp-1 mb-2">
                {profileProgress === 100 
                  ? 'Your couple portraits, Muhurat countdown, and wedding theme are active across the entire portal.' 
                  : `Add ${pendingMilestones.slice(0, 2).map(m => m.label).join(' & ')} to give the portal your unique wedding vibe.`}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-400 via-rose-500 to-[#9b1c1c] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${profileProgress}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] hover:from-[#801717] hover:to-[#9b1c1c] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-900/40"
            >
              <Heart size={14} className="fill-white/80" />
              <span>{profileProgress === 100 ? 'View Couple Profile' : 'Upload Photos & Complete Profile'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Couple Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-[#FFFDFB] to-[#F5ECE0] border border-amber-200/80 p-6 md:p-8 mb-6 shadow-xs">
        {/* Cover Photo Backdrop if Available */}
        {weddingProfile?.cover_photo_url && (
          <img 
            src={weddingProfile.cover_photo_url} 
            alt="Wedding Cover" 
            className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" 
          />
        )}
        {/* Subtle romantic accents */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left Hero Section: Portraits + Names */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left flex-1 min-w-0">
            
            {/* Ornate Circular Couple Portraits */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center -space-x-4 cursor-pointer group shrink-0"
              title="Click to manage bride & groom photos"
            >
              {/* Groom Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-md group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-amber-200 font-serif font-black text-xl">
                    {weddingProfile?.groom_photo_url ? (
                      <img src={weddingProfile.groom_photo_url} alt="Groom" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex flex-col items-center justify-center text-[10px] font-bold text-amber-200">
                        <span>🤵</span>
                        <span className="text-[9px] text-amber-300/80">+ Photo</span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-amber-300 text-[9px] font-bold text-amber-200 whitespace-nowrap shadow-xs">
                  {weddingProfile?.groom_name ? weddingProfile.groom_name.split(' ')[0] : 'वर (Groom)'}
                </span>
              </div>

              {/* Auspicious Center Heart Connector */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-[#9b1c1c] border-2 border-amber-200 text-white flex items-center justify-center shadow-lg transform -translate-y-1">
                <Heart size={13} className="fill-white animate-pulse" />
              </div>

              {/* Bride Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-tr from-rose-400 via-amber-200 to-rose-500 shadow-md group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-rose-200 font-serif font-black text-xl">
                    {weddingProfile?.bride_photo_url ? (
                      <img src={weddingProfile.bride_photo_url} alt="Bride" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex flex-col items-center justify-center text-[10px] font-bold text-rose-200">
                        <span>👰</span>
                        <span className="text-[9px] text-rose-300/80">+ Photo</span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-rose-300 text-[9px] font-bold text-rose-200 whitespace-nowrap shadow-xs">
                  {weddingProfile?.bride_name ? weddingProfile.bride_name.split(' ')[0] : 'वधू (Bride)'}
                </span>
              </div>
            </div>

            {/* Couple Text & Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-amber-200/80 text-[#9b1c1c] text-xs font-bold shadow-2xs">
                  <Heart size={12} className="fill-[#9b1c1c]" />
                  <span>{sideLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>शुभ विवाह • Shubh Vivah</span>
                </span>
                {weddingProfile?.wedding_location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-zinc-200/80 text-zinc-600 text-xs font-medium">
                    <MapPin size={12} className="text-[#047857]" />
                    <span>{weddingProfile.wedding_location}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight leading-tight mb-1.5 font-serif">
                {coupleTitle}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-600 font-medium flex items-center justify-center sm:justify-start gap-2">
                {weddingDateStr ? (
                  <>
                    <Calendar size={14} className="text-[#9b1c1c]" />
                    <span>{new Date(weddingDateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </>
                ) : (
                  <span>Set your wedding date to unlock the countdown & auspicious ceremony timeline</span>
                )}
              </p>
            </div>
          </div>

          {/* Right Hero Side: Live Countdown & Edit Profile */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {countdownDays !== null && (
              <div className="bg-white/95 backdrop-blur-xs border border-amber-200/80 rounded-2xl px-5 py-3.5 shadow-xs text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Auspicious Muhurat
                </div>
                <div className="text-2xl md:text-3xl font-black text-zinc-900 font-serif">
                  {countdownDays > 0 ? (
                    <>
                      {countdownDays} <span className="text-sm font-semibold text-[#9b1c1c]">Days to Go! 🎉</span>
                    </>
                  ) : countdownDays === 0 ? (
                    <span className="text-xl text-[#9b1c1c]">Today! 🎊</span>
                  ) : (
                    <span className="text-sm text-zinc-600">Celebrated ✨</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="px-3.5 py-2 rounded-xl bg-white border border-amber-200 hover:border-amber-300 text-xs font-semibold text-zinc-700 hover:text-zinc-900 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Heart size={13} className="text-rose-600 fill-rose-500/20" />
              <span>Couple Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. View Mode Tabs ── */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('suite')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'suite'
                ? 'bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-amber-50/70'
            }`}
          >
            <span>🌸 Vivah Suite</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-amber-50/70'
            }`}
          >
            <span>📊 Financial Deep-Dive</span>
          </button>
        </div>

        {/* Action button */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddExpOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] hover:from-[#801717] hover:to-[#9b1c1c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-rose-900/40"
          >
            <Plus size={14} className="text-amber-200" /> Add Payment
          </button>
        </div>
      </div>

      {/* ── 3. B2C Wedding Suite View ── */}
      {activeTab === 'suite' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* Sacred Ceremony Journey Ribbon */}
          <div className="bg-white rounded-3xl border border-amber-200/70 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" /> Sacred Ceremonies & Rituals
                </span>
              </div>
              <button
                onClick={() => navigate('/checklist')}
                className="text-xs font-bold text-[#9b1c1c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Ceremony Roadmap</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { id: 'roka', name: 'Roka & Sagai', icon: '🌿', sub: 'Engagement' },
                { id: 'haldi', name: 'Haldi Rasam', icon: '💛', sub: 'Turmeric Glow' },
                { id: 'mehendi', name: 'Mehendi Magic', icon: '✨', sub: 'Henna Day' },
                { id: 'sangeet', name: 'Sangeet Night', icon: '🪕', sub: 'Music & Dance' },
                { id: 'vivah', name: 'Baraat & Vivah', icon: '🔥', sub: 'Sacred Pheras' },
                { id: 'reception', name: 'Grand Reception', icon: '🥂', sub: 'Vidai & Feast' }
              ].map((ceremony, idx) => (
                <div
                  key={ceremony.id}
                  onClick={() => navigate('/checklist')}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5ECE0] border border-amber-200/60 hover:border-amber-300 transition-all cursor-pointer group text-center flex flex-col justify-between shadow-2xs"
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{ceremony.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 group-hover:text-[#9b1c1c] transition-colors">{ceremony.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{ceremony.sub}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-amber-800/80 flex items-center justify-center gap-0.5">
                    <span>Ritual {idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Planning Pulse Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Countdown / Milestone */}
            <div 
              onClick={() => navigate('/checklist')}
              className="bg-white p-5 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Countdown</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1 font-serif">
                {countdownDays !== null ? `${countdownDays} Days` : 'Set Date'}
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">
                {countdownDays > 0 ? `~${Math.round(countdownDays / 30)} months to prepare` : 'Wedding timeline'}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#9b1c1c] group-hover:translate-x-0.5 transition-transform">
                <span>View Timeline</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* Checklist Progress */}
            <div 
              onClick={() => navigate('/checklist')}
              className="bg-white p-5 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Checklist Pulse</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ListChecks size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1 font-serif">
                {completedTasksCount} <span className="text-sm font-medium text-zinc-400">/ {totalTasksCount || 51} done</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${checklistPercent}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{checklistPercent}% Complete</span>
                <span className="text-[#9b1c1c] font-semibold flex items-center gap-0.5">Tasks <ChevronRight size={12} /></span>
              </div>
            </div>

            {/* Guest RSVP Pulse */}
            <div 
              onClick={() => navigate('/guests')}
              className="bg-white p-5 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Mehmaan RSVPs</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#9b1c1c] flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1 font-serif">
                {guestSummary?.confirmed || 0} <span className="text-sm font-medium text-zinc-400">Confirmed</span>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">
                {guestSummary?.total || 0} total invited ({guestSummary?.pending || 0} awaiting RSVP)
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#047857] group-hover:translate-x-0.5 transition-transform">
                <span>Dispatch Invites</span> <ChevronRight size={14} />
              </div>
            </div>

            {/* Budget Snapshot */}
            <div 
              onClick={() => navigate('/expenses')}
              className="bg-white p-5 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Kharcha & Budget</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#9b1c1c] flex items-center justify-center">
                  <IndianRupee size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1 font-serif">
                {fmt(totalExpenses)}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-[#9b1c1c] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, budgetUtilization)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{budgetUtilization}% of {fmt(budgetTotal)}</span>
                <span className="text-[#9b1c1c] font-semibold flex items-center gap-0.5">Details <ChevronRight size={12} /></span>
              </div>
            </div>

            {/* Vivah Fund & Shagun Pulse */}
            <div 
              onClick={() => navigate('/savings')}
              className="bg-white p-5 rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Vivah Fund</span>
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <PiggyBank size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 mb-1 font-serif text-[#9b1c1c]">
                {fmt(totalSavings)}
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1">
                {savings.length} {savings.length === 1 ? 'deposit' : 'deposits'} & family blessings
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#d97706] group-hover:translate-x-0.5 transition-transform">
                <span>View Treasury</span> <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* ── Upcoming Tasks & Quick Actions 2-Column ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Next Milestones (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-amber-200/70 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#9b1c1c] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 font-serif">Next Upcoming Milestones</h3>
                    <p className="text-xs text-zinc-500">Check off tasks as rituals approach</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checklist')}
                  className="text-xs font-bold text-[#9b1c1c] hover:underline flex items-center gap-1 cursor-pointer"
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
                <div className="divide-y divide-amber-100/60">
                  {upcomingTasks.map(task => (
                    <div key={task.id || task.task_id} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id || task.task_id)}
                          className="w-6 h-6 rounded-lg border-2 border-amber-300 hover:border-[#9b1c1c] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Mark complete"
                        >
                          <Check size={12} className="text-transparent group-hover:text-[#9b1c1c]" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 font-medium text-amber-900">{task.category || 'General'}</span>
                            {task.timeline_stage && <span>• {task.timeline_stage}</span>}
                          </div>
                        </div>
                      </div>

                      {task.estimated_cost > 0 && (
                        <span className="text-xs font-bold text-zinc-700 shrink-0 font-serif">
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
              <div className="bg-white rounded-3xl border border-amber-200/70 p-6 shadow-xs">
                <h3 className="font-extrabold text-sm text-zinc-900 mb-3 font-serif">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => navigate('/guests')}
                    className="p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <Users size={18} className="mb-2 text-emerald-700" />
                    <span>WhatsApp Invites</span>
                  </button>

                  <button
                    onClick={() => navigate('/vendors')}
                    className="p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <Store size={18} className="mb-2 text-amber-700" />
                    <span>Vendor Bazaar</span>
                  </button>

                  <button
                    onClick={() => navigate('/savings')}
                    className="p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <PiggyBank size={18} className="mb-2 text-amber-700" />
                    <span>Vivah Fund & Shagun</span>
                  </button>

                  <button
                    onClick={() => setIsAddExpOpen(true)}
                    className="p-3.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-[#9b1c1c] text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <Receipt size={18} className="mb-2 text-[#9b1c1c]" />
                    <span>Log Kharcha</span>
                  </button>

                  <button
                    onClick={() => navigate('/profile')}
                    className="p-3.5 rounded-2xl bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200 text-pink-900 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <Heart size={18} className="mb-2 text-rose-600 fill-rose-500/20" />
                    <span>Couple Profile</span>
                  </button>

                  <button
                    onClick={() => setIsTelegramModalOpen(true)}
                    className="p-3.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <Send size={18} className="mb-2 text-sky-700" />
                    <span>Telegram Bot</span>
                  </button>
                </div>
              </div>

              {/* Vendor Category Hub Banner */}
              <div 
                onClick={() => navigate('/vendors')}
                className="bg-gradient-to-br from-[#FAF7F2] to-[#F5ECE0] border border-amber-200/80 rounded-3xl p-5 shadow-xs cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#9b1c1c] uppercase tracking-wider mb-1">
                  <Store size={14} /> Vendor Discovery
                </div>
                <h4 className="font-extrabold text-base text-zinc-900 mb-1 font-serif">
                  Explore 12 Wedding Categories
                </h4>
                <p className="text-xs text-zinc-500 mb-3">
                  Find photographers, banquet venues, decorators, and caterers near {weddingProfile?.wedding_location || 'you'}.
                </p>
                <span className="text-xs font-bold text-[#9b1c1c] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
              baseColor="#9b1c1c"
              onClick={() => navigate('/expenses')}
            />
            <StatCard
              label="Remaining Budget"
              value={fmt(remainingBudget)}
              Icon={Wallet}
              helpText={budgetUtilization > 100 ? 'Budget exceeded' : 'Available to spend'}
              isAlert={budgetUtilization > 100}
              baseColor="#047857"
              onClick={() => navigate('/expenses')}
            />
            <StatCard
              label="Total Savings"
              value={fmt(totalSavings)}
              Icon={TrendingUp}
              helpText="Accumulated funds"
              baseColor="#d97706"
              onClick={() => navigate('/savings')}
            />
            <StatCard
              label="Net Position"
              value={fmt(totalSavings - totalExpenses)}
              Icon={IndianRupee}
              helpText={totalSavings >= totalExpenses ? 'Fully funded' : 'Savings deficit'}
              isAlert={totalSavings < totalExpenses}
              baseColor="#b45309"
            />
          </div>

          {/* Recharts Analytics: Area + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Accumulation Area Chart */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200/70 shadow-xs">
              <h3 className="font-extrabold text-sm text-zinc-800 mb-4 font-serif">Savings vs Cumulative Growth</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" name="Total Savings" stroke="#047857" strokeWidth={2} fillOpacity={1} fill="url(#cumColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Comparison Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-amber-200/70 shadow-xs">
              <h3 className="font-extrabold text-sm text-zinc-800 mb-4 font-serif">Monthly Expenses vs Savings</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="expenses" name="Expenses" fill="#9b1c1c" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="savings" name="Savings" fill="#047857" radius={[4, 4, 0, 0]} />
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
