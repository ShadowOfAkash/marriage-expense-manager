import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import Bookings  from './components/Bookings'
import BookingDetail from './components/BookingDetail'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { Menu, Sparkles } from 'lucide-react'

function MainApp() {
  const { currentUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  
  const pageTitles = {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    expenses: 'Payments',
    savings: 'Savings'
  }
  const currentTab = location.pathname.split('/')[1] || 'dashboard'
  const currentTitle = pageTitles[currentTab] || 'Marriage Manager'

  if (!currentUser) return <Login />

  return (
    <div className="flex min-h-screen bg-zinc-50 flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-30 bg-zinc-950 text-white px-4 py-3 flex items-center justify-between border-b border-zinc-900 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#234c6a] flex items-center justify-center text-white">
            <Sparkles size={14} />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            {currentTitle}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#1b3c53] text-zinc-200 flex items-center justify-center text-xs font-bold border border-zinc-700">
          {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
        </div>
      </header>

      {/* Sidebar with Desktop & Mobile Drawer */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content View */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
