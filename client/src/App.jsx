import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login     from './components/Login'
import Sidebar   from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import Bookings  from './components/Bookings'
import BookingDetail from './components/BookingDetail'
import Guests    from './components/Guests'
import GuestRsvpPortal from './components/GuestRsvpPortal'
import Checklist from './components/Checklist'
import VendorDiscovery from './components/VendorDiscovery'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { Menu, Sparkles, Share, X } from 'lucide-react'

function IosInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('ios_pwa_dismissed')
    if (isIos && !isStandalone && !dismissed) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 inset-x-3 z-50 p-3.5 bg-zinc-950/95 backdrop-blur-md text-white rounded-2xl border border-zinc-800 shadow-2xl flex items-center justify-between gap-3 text-xs md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Share size={15} />
        </div>
        <div>
          <p className="font-semibold text-zinc-100">Install on iPhone Home Screen</p>
          <p className="text-zinc-400 text-[11px] leading-tight">
            Tap the Safari <span className="text-amber-400 font-bold">Share</span> button, then choose <span className="text-white font-bold">"Add to Home Screen"</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem('ios_pwa_dismissed', 'true')
          setShow(false)
        }}
        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
        aria-label="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  )
}

function MainApp() {
  const { currentUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  
  const pageTitles = {
    dashboard: 'Dashboard',
    checklist: 'Checklist',
    vendors: 'Vendors',
    guests: 'Guests',
    bookings: 'Bookings',
    expenses: 'Payments',
    savings: 'Savings'
  }
  const currentTab = location.pathname.split('/')[1] || 'dashboard'
  const currentTitle = pageTitles[currentTab] || 'Marriage Manager'

  if (!currentUser) return <Login />

  return (
    <div className="flex min-h-screen bg-zinc-50 flex-col md:flex-row">
      <IosInstallBanner />

      {/* Mobile Top Navigation Header with iOS Safe Area support */}
      <header className="md:hidden sticky top-0 z-30 bg-zinc-950 text-white px-4 pt-safe pb-3 flex items-center justify-between border-b border-zinc-900 shadow-sm">
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
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/vendors" element={<VendorDiscovery />} />
          <Route path="/guests" element={<Guests />} />
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
          <Routes>
            <Route path="/rsvp/:token" element={<GuestRsvpPortal />} />
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
