import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Chip
} from '@heroui/react'
import {
  TrendingUp, Wallet,
  PieChart as PieIcon, BarChart2, Receipt,
  ChevronRight, IndianRupee,
  Smartphone, Users
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
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const CAT_COLORS = [
  '#1b3c53', // Deep Navy
  '#234c6a', // Ocean Blue
  '#456882', // Slate Blue
  '#5b809d', // Muted Blue
  '#7492a8', // Soft Steel
  '#99afbf', // Mist Blue
  '#d2c1b6', // Warm Sand / Beige
  '#b8a496', // Toasted Almond
  '#9d8778', // Warm Taupe
  '#816b5c', // Mocha
  '#3d5a73', // Deep Steel
  '#517088'  // Dusk Blue
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xl text-sm min-w-[160px]">
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

function StatCard({ label, value, Icon, helpText, arrowType, onClick, subtext, baseColor = '#1b3c53', isAlert = false }) {
  return (
    <Card 
      isPressable={!!onClick} onClick={onClick} className={`border ${isAlert ? 'border-rose-200 bg-rose-50/20' : 'border-zinc-200/80 bg-white'} shadow-sm rounded-xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''} p-4 md:p-5`}>
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
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs" 
            style={{ backgroundColor: baseColor + '1A', color: baseColor }}
          >
            <Icon size={20} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, action, color = '#1b3c53' }) {
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
          <Button radius="sm" size="sm" variant="outline" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAction}>
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
  const toast = useToast()
  
  const [telegramCode, setTelegramCode] = useState(null)
  const [telegramId, setTelegramId] = useState(null)
  const [telegramBotUsername, setTelegramBotUsername] = useState('MarriageExpenseManagementBot')
  const [isTelegramLinked, setIsTelegramLinked] = useState(false)
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [guestSummary, setGuestSummary] = useState(null)

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
      const [sum, exp, sav, cats, tgStatus, gSum] = await Promise.all([
        api.getSummary(), api.getExpenses(), api.getSavings(), api.getCategories(), 
        api.getTelegramStatus().catch(() => ({isLinked: false, activeCode: null, telegramId: null})),
        api.getGuestSummary().catch(() => null)
      ])
      setSummary(sum); setExpenses(exp); setSavings(sav); setCategories(cats); setGuestSummary(gSum)
      if (tgStatus.activeCode) setTelegramCode(tgStatus.activeCode);
      if (tgStatus.telegramId) setTelegramId(tgStatus.telegramId);
      if (tgStatus.botUsername) setTelegramBotUsername(tgStatus.botUsername);
      setIsTelegramLinked(!!tgStatus.isLinked);
    } catch (e) {
      toast({ title: 'Error loading data', description: e.message, status: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { loadAll() }, [loadAll])

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

  const totalSavings = Number(summary?.totalSavings || 0);
  const totalExpenses = Number(summary?.totalExpenses || 0);
  const netBalance = totalSavings - totalExpenses;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Overview</h1>
          <div className="text-zinc-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card isPressable onClick={() => setIsAddExpOpen(true)} className="p-4 md:p-5 cursor-pointer bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-200/80 rounded-xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Receipt size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-sm">Add Payment</div>
                  <div className="text-xs text-zinc-500">Log vendor expense</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </div>
          </div>
        </Card>

        <Card isPressable onClick={() => setIsAddSavOpen(true)} className="p-4 md:p-5 cursor-pointer bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-200/80 rounded-xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#234c6a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-sm">Log Saving</div>
                  <div className="text-xs text-zinc-500">Record contribution</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </div>
          </div>
        </Card>

        <Card isPressable onClick={() => navigate('/guests')} className="p-4 md:p-5 cursor-pointer bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-200/80 rounded-xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#325a77] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-sm">Guest List</div>
                  <div className="text-xs text-zinc-500">
                    {guestSummary?.totalGuests !== undefined 
                      ? `${guestSummary.totalGuests} Guests (${guestSummary.expectedAttendance || 0} Exp)` 
                      : 'Guests & attendance'}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </div>
          </div>
        </Card>

        <Card isPressable onClick={() => setIsTelegramModalOpen(true)} className="p-4 md:p-5 cursor-pointer bg-white hover:-translate-y-0.5 hover:shadow-md transition-all border border-zinc-200/80 rounded-xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#456882] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-sm">Telegram Bot</div>
                  {isTelegramLinked ? (
                     <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 flex-wrap">
                       <span>Connected ✓</span>
                       {telegramId && <span className="text-zinc-500 font-mono text-[11px] font-normal">({telegramId})</span>}
                     </div>
                  ) : (
                     <div className="text-xs text-zinc-500">Link account</div>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Core Financial Stat Cards (Aligned 3-column grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          label="Total Savings" 
          value={fmtK(totalSavings)} 
          Icon={TrendingUp} 
          baseColor="#234c6a" 
          helpText="Accumulated funds" 
          arrowType="increase" 
          subtext={`${savings.length} contributions logged`}
        />
        <StatCard 
          label="Total Payments" 
          value={fmtK(totalExpenses)} 
          Icon={IndianRupee} 
          baseColor="#1b3c53" 
          helpText="Expenditures paid" 
          subtext={`${expenses.length} payments recorded`}
        />
        <StatCard 
          label="Net Balance" 
          value={fmtK(Math.abs(netBalance))} 
          Icon={Wallet} 
          baseColor={netBalance >= 0 ? "#234c6a" : "#e11d48"} 
          helpText={netBalance >= 0 ? 'Surplus' : 'Deficit'} 
          arrowType={netBalance >= 0 ? 'increase' : 'decrease'}
          isAlert={netBalance < 0}
          subtext={netBalance >= 0 ? "Remaining funds available" : "Expenditures exceed savings"}
        />
      </div>

      {/* Row 1: Savings Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="p-4 md:p-6 border border-zinc-200/80 shadow-sm rounded-xl">
          <div>
            <SectionHeader icon={TrendingUp} title="Savings Trend" subtitle="Cumulative & monthly deposits over time" />
            {savingsTrend.length > 0 ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#456882" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#456882" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="monGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1b3c53" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1b3c53" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717A' }} tickFormatter={fmtK} width={58} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#52525B' }} />
                    <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#456882" fill="url(#cumGrad)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="monthly"    name="Monthly"    stroke="#1b3c53" fill="url(#monGrad)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} message="No savings data yet" actionLabel="Log Savings →" onAction={() => setIsAddSavOpen(true)} />
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-6 border border-zinc-200/80 shadow-sm rounded-xl">
          <div>
            <SectionHeader icon={PieIcon} title="Category Breakdown" subtitle="Spending distribution by category" />
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
                        <span className="text-[10px] text-zinc-700 font-semibold shrink-0">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState icon={PieIcon} message="No payments yet" actionLabel="Add Payment →" onAction={() => setIsAddExpOpen(true)} />
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Monthly Comparison (Full Width) */}
      <div className="mb-5">
        <Card className="p-4 md:p-6 border border-zinc-200/80 shadow-sm rounded-xl">
          <div>
            <SectionHeader 
              icon={BarChart2} 
              title="Monthly Financial Comparison" 
              subtitle="Side-by-side comparison of monthly deposits vs payments" 
            />
            {monthlyComparison.length > 0 ? (
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 10, right: 15, left: 0, bottom: 0 }} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717A' }} tickFormatter={fmtK} width={60} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#52525B', paddingTop: '8px' }} />
                    <Bar dataKey="savings"  name="Savings"  fill="#456882" radius={[6,6,0,0]} maxBarSize={36} />
                    <Bar dataKey="expenses" name="Payments" fill="#1b3c53" radius={[6,6,0,0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart2} message="Add savings and expenses to view comparison chart" />
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Recent Payments Table */}
      <div className="border border-zinc-200/80 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="p-4 md:p-5 border-b border-zinc-100">
          <SectionHeader
            icon={Receipt}
            title="Recent Payments"
            subtitle={expenses.length > 0 ? `Showing ${Math.min(expenses.length, pageSize)} of ${expenses.length} entries` : 'No entries yet'}
            action={
              <Button radius="sm" size="sm" variant="light" className="bg-zinc-900 text-white hover:bg-zinc-800 font-semibold" onClick={() => navigate('/expenses')}>
                View All <ChevronRight size={16} />
              </Button>
            }
          />
        </div>
        {expenses.length > 0 ? (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                  <tr className="text-zinc-500 font-semibold text-xs tracking-wider">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">DESCRIPTION</th>
                    <th className="py-3 px-4 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((e) => (
                    <tr key={e.id} className="hover:bg-[#1b3c53]/[0.04] transition-colors">
                      <td className="py-3 px-4"><span className="text-xs text-zinc-500 font-medium">{formatDate(e.date)}</span></td>
                      <td className="py-3 px-4">
                        {e.payment_type === 'Advance' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#234c6a]/15 text-[#234c6a] border border-[#234c6a]/30">
                            Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-zinc-700 truncate block max-w-[240px]">
                          {e.description || <span className="text-zinc-300">—</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right"><span className="font-bold text-zinc-900">{fmt(e.amount)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={expenses.length}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="p-6">
            <EmptyState icon={IndianRupee} message="No payments logged yet" actionLabel="Add First Payment →" onAction={() => setIsAddExpOpen(true)} />
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddExpOpen} 
        onClose={() => setIsAddExpOpen(false)} 
        onSuccess={async (newExp) => {
          if (newExp && newExp.id) {
            setExpenses(prev => [newExp, ...prev.filter(e => e.id !== newExp.id)]);
          }
          await loadAll();
        }} 
      />
      <AddSavingModal 
        isOpen={isAddSavOpen} 
        onClose={() => setIsAddSavOpen(false)} 
        onSuccess={async (newSav) => {
          if (newSav && newSav.id) {
            setSavings(prev => [newSav, ...prev.filter(s => s.id !== newSav.id)]);
          }
          await loadAll();
        }} 
      />
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        isLinked={isTelegramLinked}
        currentTelegramId={telegramId}
        activeCode={telegramCode}
        botUsername={telegramBotUsername}
        onStatusChange={(status) => {
          if (status.isLinked !== undefined) setIsTelegramLinked(status.isLinked);
          if (status.telegramId !== undefined) setTelegramId(status.telegramId);
          if (status.activeCode !== undefined) setTelegramCode(status.activeCode);
        }}
      />
    </div>
  )
}
