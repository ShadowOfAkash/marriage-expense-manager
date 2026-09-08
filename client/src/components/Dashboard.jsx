import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { TailwindModal } from './TailwindModal';
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Modal, Input, TextField, Chip, Table
} from '@heroui/react'
import {
  Target, TrendingUp, Wallet, Clock, AlertCircle,
  PieChart as PieIcon, BarChart2, Activity, CalendarDays, Receipt, PiggyBank,
  ChevronRight, IndianRupee,
  Smartphone
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadialBarChart, RadialBar,
} from 'recharts'
import { api, fmt, fmtK, formatDate, MONTH_NAMES } from '../utils/api'
import { AddExpenseModal, AddSavingModal } from './SharedModals'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const CAT_COLORS = [
  '#BE185D','#7F55B0','#E09913','#0EA5E9','#10B981',
  '#F43F5E','#8B5CF6','#F59E0B','#06B6D4','#22C55E',
  '#EC4899','#A78BFA','#FBBF24','#38BDF8','#4ADE80',
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-3 shadow-xl text-sm min-w-[160px]">
      <div className="font-bold text-zinc-700 mb-2 text-xs">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-zinc-500 text-xs">{p.name}</span>
          </div>
          <span className="font-bold text-zinc-800 text-xs">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, Icon, helpText, arrowType, onClick, subtext, baseColor = '#1b2cc1' }) {
  return (
    <Card 
      className={`border border-zinc-100 shadow-sm rounded-xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
      isPressable={!!onClick}
      onClick={onClick}
    >
      <Card.Content className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-zinc-500 mb-1">{label}</div>
            <div className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">{value}</div>
            {helpText && (
              <div className="text-xs text-zinc-400 font-medium mt-1 flex items-center gap-1">
                {arrowType === 'increase' && <span className="text-zinc-900">↑</span>}
                {arrowType === 'decrease' && <span className="text-zinc-500">↓</span>}
                {helpText}
              </div>
            )}
            {subtext && <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">{subtext}</div>}
          </div>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" 
            style={{ backgroundColor: baseColor + '1A', color: baseColor }}
          >
            <Icon size={22} />
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, action, color = '#1B2CC1' }) {
  return (
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl border flex items-center justify-center"
          style={{ backgroundColor: color + '1A', borderColor: color + '33' }}
        >
          <Icon size={18} color={color} />
        </div>
        <div>
          <div className="font-bold text-base text-zinc-800">{title}</div>
          {subtitle && <div className="text-xs text-zinc-500 font-medium">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center">
          <Icon size={24} className="text-zinc-300" />
        </div>
        <span className="text-zinc-400 text-sm text-center">{message}</span>
        {actionLabel && (
          <Button size="sm" variant="outline" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [summary,    setSummary]    = useState(null)
  const [expenses,   setExpenses]   = useState([])
  const [savings,    setSavings]    = useState([])
  const [categories, setCategories] = useState([])
  
  const [isAddExpOpen, setIsAddExpOpen] = useState(false)
  const [isAddSavOpen, setIsAddSavOpen] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [budget,     setBudget]     = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const toast = useToast()
  
  const [telegramCode, setTelegramCode] = useState(null)
  const [isTelegramLinked, setIsTelegramLinked] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

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
      const [sum, exp, sav, cats, tgStatus] = await Promise.all([
        api.getSummary(), api.getExpenses(), api.getSavings(), api.getCategories(), api.getTelegramStatus().catch(() => ({isLinked: false, activeCode: null}))
      ])
      setSummary(sum); setExpenses(exp); setSavings(sav); setCategories(cats)
      if (tgStatus.activeCode) setTelegramCode(tgStatus.activeCode);
      if (tgStatus.isLinked) setIsTelegramLinked(true);
      setBudget(sum.budget || '')
    } catch (e) {
      toast({ title: 'Error loading data', description: e.message, status: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSaveBudget = async () => {
    try {
      await api.saveBudget(Number(budget))
      toast({ title: 'Budget goal saved!', status: 'success' })
      setIsOpen(false); loadAll()
    } catch {
      toast({ title: 'Error saving budget', status: 'error' })
    }
  }

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
    const key = (yr, mo) => {
      if (typeof mo !== 'number' || mo < 0 || mo > 11 || !MONTH_NAMES[mo]) return `Unk '${String(yr).slice(2)}`
      return `${MONTH_NAMES[mo].slice(0,3)} '${String(yr).slice(2)}`
    }
    const sort = (yr, mo) => yr * 12 + mo
    savings.forEach(s => {
      const mo = MONTH_NAMES.indexOf(s.month)
      const k  = key(s.year, mo >= 0 ? mo : 0)
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(s.year, mo >= 0 ? mo : 0) }
      map[k].savings += s.amount
    })
    expenses.forEach(e => {
      const d = new Date(e.date)
      const yr = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear()
      const mo = isNaN(d.getMonth()) ? 0 : d.getMonth()
      const k = key(yr, mo)
      if (!map[k]) map[k] = { name: k, savings: 0, expenses: 0, _sort: sort(yr, mo) }
      map[k].expenses += e.amount
    })
    return Object.values(map).sort((a, b) => a._sort - b._sort)
  }, [savings, expenses])

  const pieData = useMemo(
    () => categories.map(c => ({ name: c.category, value: c.total })),
    [categories]
  )

  const radialData = useMemo(() => [
    { name: 'Payments', value: Math.round(summary?.expenseProgress || 0), fill: '#BE185D' },
    { name: 'Savings',  value: Math.round(summary?.savingsProgress  || 0), fill: '#7F55B0' },
  ], [summary])

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-medium">Loading your wedding dashboard...</span>
        </div>
      </div>
    )
  }

  const sp = (summary?.savingsProgress || 0).toFixed(1)
  const ep = (summary?.expenseProgress || 0).toFixed(1)

  return (
    <div className="max-w-7xl mx-auto py-7 px-4 md:px-6">

      <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-800 tracking-tight">Overview</h1>
          <div className="text-zinc-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <Button
          size="sm"
          className="bg-zinc-900 text-white shadow-md hover:shadow-lg transition-all"
          onClick={() => setIsOpen(true)}
        >
          <Target size={14} /> Set Budget Goal
        </Button>
      </div>

      <TailwindModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Set Total Budget Goal">
            <p className="text-sm text-zinc-500 mb-3">Enter the total amount planned for your wedding</p>
            <TextField>
              <Input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 2000000"
                startContent={<span className="text-zinc-900 font-bold bg-zinc-100 px-2 rounded-l-md">₹</span>}
                onKeyDown={e => e.key === 'Enter' && handleSaveBudget()}
              />
            </TextField>
            <Button
              className="w-full mt-4 bg-zinc-900 text-white font-bold"
              onClick={handleSaveBudget}
            >
              <IndianRupee size={14} /> Save Budget Goal
            </Button>
          </TailwindModal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card isPressable onClick={() => setIsAddExpOpen(true)} className="bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-100">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center">
                  <Receipt size={24} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900">Add Payment</div>
                  <div className="text-sm text-zinc-500">Log payment</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </div>
          </Card.Content>
        </Card>

        <Card isPressable onClick={() => setIsAddSavOpen(true)} className="bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-100">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900">Log Saving</div>
                  <div className="text-sm text-zinc-500">Record deposit</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </div>
          </Card.Content>
        </Card>

        <Card isPressable onClick={handleGenerateTelegramCode} className="bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-200">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900">Telegram</div>
                  {isTelegramLinked ? (
                     <div className="text-xs font-bold text-zinc-900">Connected ✓</div>
                  ) : telegramCode ? (
                     <div className="text-xs font-bold text-zinc-600">Code: {telegramCode}</div>
                  ) : (
                     <div className="text-sm text-zinc-500">{generatingCode ? 'Loading...' : 'Link account'}</div>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-300" />
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Budget Goal" value={fmtK(summary?.budget)} Icon={Target} baseColor="#0EA5E9" helpText="Total target" onClick={() => setIsOpen(true)} />
        <StatCard label="Total Savings" value={fmtK(summary?.totalSavings)} Icon={TrendingUp} baseColor="#10B981" helpText={`${sp}% of goal`} arrowType="increase" />
        <StatCard label="Total Payments" value={fmtK(summary?.totalExpenses)} Icon={IndianRupee} baseColor="#1B2CC1" helpText={`${ep}% of goal`} />
        <StatCard label="Still Required" value={fmtK(summary?.amountStillRequired)} Icon={Clock} baseColor="#404040" helpText="More savings needed" />
        <StatCard label="Available Balance" value={fmtK(Math.abs(summary?.availableBalance || 0))} Icon={Wallet} baseColor="#7F55B0" helpText={(summary?.availableBalance || 0) >= 0 ? 'Surplus' : 'Deficit'} arrowType={(summary?.availableBalance || 0) >= 0 ? 'increase' : 'decrease'} />
      </div>

      <Card className="mb-6 border border-zinc-100 shadow-sm">
        <Card.Content className="p-6">
          <SectionHeader icon={Activity} title="Budget Progress" subtitle="Savings and spending vs goal" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="text-sm font-semibold text-zinc-700">Savings Progress</span>
                </div>
                <div className="bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-lg px-2.5 py-0.5 text-[11px] font-bold">{sp}%</div>
              </div>
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-800 transition-all duration-700" 
                  style={{ width: `${Math.min(100, Math.max(0, summary?.savingsProgress || 0))}%` }} 
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-zinc-400">
                <span>{fmt(summary?.totalSavings)} saved</span>
                <span>Goal: {fmt(summary?.budget)}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                  <span className="text-sm font-semibold text-zinc-700">Payments vs Budget</span>
                </div>
                <div className="bg-blue-50 text-zinc-900 border border-blue-200 rounded-lg px-2.5 py-0.5 text-[11px] font-bold">{ep}%</div>
              </div>
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 transition-all duration-700" 
                  style={{ width: `${Math.min(100, Math.max(0, summary?.expenseProgress || 0))}%` }} 
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-zinc-400">
                <span>{fmt(summary?.totalExpenses)} spent</span>
                <span>of {fmt(summary?.budget)}</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="border border-zinc-100 shadow-sm">
          <Card.Content className="p-6">
            <SectionHeader icon={TrendingUp} title="Savings Trend" subtitle="Cumulative & monthly over time" />
            {savingsTrend.length > 0 ? (
              <div className="w-full h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7F55B0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7F55B0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="monGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F7F7F7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                    <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#7F55B0" fill="url(#cumGrad)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="monthly"    name="Monthly"    stroke="#10B981" fill="url(#monGrad)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} message="No savings data yet" actionLabel="Log Savings →" onAction={() => setIsAddSavOpen(true)} />
            )}
          </Card.Content>
        </Card>

        <Card className="border border-zinc-100 shadow-sm">
          <Card.Content className="p-6">
            <SectionHeader icon={PieIcon} title="Category Breakdown" subtitle="Spending by category" />
            {pieData.length > 0 ? (
              <>
                <div className="w-full h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="max-h-[72px] overflow-y-auto mt-2">
                  <div className="grid grid-cols-2 gap-1">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="text-[10px] text-zinc-600 truncate flex-1">{d.name}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold shrink-0">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                </>
            ) : (
              <EmptyState icon={PieIcon} message="No payments yet" actionLabel="Add Payment →" onAction={() => setIsAddExpOpen(true)} />
            )}
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Card className="border border-zinc-100 shadow-sm lg:col-span-2">
          <Card.Content className="p-6">
            <SectionHeader icon={BarChart2} title="Monthly Comparison" subtitle="Savings vs payments per month" />
            {monthlyComparison.length > 0 ? (
              <div className="w-full h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F7F7F7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                    <Bar dataKey="savings"  name="Savings"  fill="#7F55B0" radius={[6,6,0,0]} maxBarSize={32} />
                    <Bar dataKey="expenses" name="Payments" fill="#18181b" radius={[6,6,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart2} message="Add savings and expenses to see chart" />
            )}
          </Card.Content>
        </Card>

        <Card className="border border-zinc-100 shadow-sm">
          <Card.Content className="p-6">
            <SectionHeader icon={Target} title="Goal Meter" subtitle="% of budget goal" />
            <div className="w-full h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="100%" innerRadius="40%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar background={{ fill: '#F9FAFB' }} dataKey="value" cornerRadius={4} />
                  <Tooltip formatter={v => `${v}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-px bg-zinc-100 my-3" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="text-xs text-zinc-600 font-semibold">Savings</span>
                </div>
                <span className="text-xs font-bold text-[#7F55B0]">{sp}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                  <span className="text-xs text-zinc-600 font-semibold">Expenses</span>
                </div>
                <span className="text-xs font-bold text-[#BE185D]">{ep}%</span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="border border-zinc-100 shadow-sm">
        <Card.Content className="p-6">
          <SectionHeader
            icon={Receipt}
            title="Recent Payments"
            subtitle={`Last ${Math.min(expenses.length, 6)} entries`}
            action={
              <Button size="sm" variant="light" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => navigate('/expenses')}>
                View All <ChevronRight size={16} />
              </Button>
            }
          />
          {expenses.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500 font-medium">
                    <th className="py-3 px-2 font-medium">DATE</th>
                    <th className="py-3 px-2 font-medium">CATEGORY</th>
                    <th className="py-3 px-2 font-medium">DESCRIPTION</th>
                    <th className="py-3 px-2 font-medium text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {expenses.slice(0, 6).map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-2"><span className="text-xs text-zinc-500">{formatDate(e.date)}</span></td>
                      <td className="py-3 px-2"><Chip size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" variant="flat">{e.category}</Chip></td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-zinc-700 truncate block max-w-[180px]">
                          {e.description || <span className="text-zinc-300">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right"><span className="font-bold text-zinc-800">{fmt(e.amount)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={IndianRupee} message="No payments logged yet" actionLabel="Add First Payment →" onAction={() => setIsAddExpOpen(true)} />
          )}
        </Card.Content>
      </Card>

      <AddExpenseModal isOpen={isAddExpOpen} onClose={() => setIsAddExpOpen(false)} />
      <AddSavingModal isOpen={isAddSavOpen} onClose={() => setIsAddSavOpen(false)} />

    </div>
  )
}
