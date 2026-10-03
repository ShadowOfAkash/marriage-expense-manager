import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login     from './components/Login'
import TopNavbar from './components/TopNavbar'
import Dashboard from './components/Dashboard'
import Expenses  from './components/Expenses'
import Savings   from './components/Savings'
import Bookings  from './components/Bookings'
import BookingDetail from './components/BookingDetail'
import Guests    from './components/Guests'
import GuestRsvpPortal from './components/GuestRsvpPortal'
import Checklist from './components/Checklist'
import VendorDiscovery from './components/VendorDiscovery'
import OnboardingWizard from './components/OnboardingWizard'
import Profile from './components/Profile'
import { api } from './utils/api'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

function MainApp() {
  const { currentUser } = useAuth()
  const [weddingProfile, setWeddingProfile] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    if (!currentUser) return;
    api.getWeddingProfile()
      .then(prof => {
        setWeddingProfile(prof);
        if (!prof || !prof.onboarding_completed) {
          setShowOnboarding(true);
        }
      })
      .catch(err => console.warn('Wedding profile load warning:', err))
      .finally(() => setProfileLoaded(true));
  }, [currentUser]);

  if (!currentUser) return <Login />

  return (
    <div className="flex min-h-screen bg-[#FCFBFA] flex-col font-sans text-zinc-900">
      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard
          initialProfile={weddingProfile}
          onComplete={(savedProfile) => {
            setWeddingProfile(savedProfile);
            setShowOnboarding(false);
          }}
          onDismiss={weddingProfile?.onboarding_completed ? () => setShowOnboarding(false) : null}
        />
      )}

      {/* Modern Hitchd-Style Top Navigation */}
      <TopNavbar 
        weddingProfile={weddingProfile}
        onEditProfile={() => setShowOnboarding(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 min-w-0 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile weddingProfile={weddingProfile} onProfileUpdated={setWeddingProfile} />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/vendors" element={<VendorDiscovery />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/fund" element={<Savings />} />
          <Route path="/vivah-fund" element={<Savings />} />
          <Route path="/shagun" element={<Savings />} />
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
