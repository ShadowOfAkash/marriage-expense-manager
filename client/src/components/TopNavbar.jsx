import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChevronDown, Menu, X, Sparkles } from 'lucide-react';

export default function TopNavbar({ weddingProfile, onEditProfile }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Payments', path: '/expenses' },
    { label: 'Contributions', path: '/savings' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Guests', path: '/guests' },
    { label: 'Roadmap', path: '/checklist' },
    { label: 'Contracts', path: '/bookings' },
  ];

  async function handleSignOut() {
    await logout();
    navigate('/');
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div
              className="font-serif text-white text-xl font-bold tracking-tight cursor-pointer select-none"
              onClick={() => navigate('/dashboard')}
            >
              hitchd
            </div>

            {/* Desktop Navigation — centered */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative px-3.5 py-4 text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right: Menu dropdown */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-2"
                >
                  Menu <ChevronDown size={14} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-zinc-100">
                        <p className="text-sm font-bold text-zinc-900 truncate">{currentUser?.displayName || 'Admin'}</p>
                        <p className="text-xs text-zinc-500 truncate">{currentUser?.email}</p>
                      </div>
                      <button
                        onClick={() => { setMenuOpen(false); onEditProfile?.(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <Sparkles size={14} /> Edit Profile
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); handleSignOut(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -mr-2 text-zinc-400 hover:text-white"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#1A1A1A] pt-14">
          <nav className="px-6 py-6 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="my-4 border-t border-white/10" />
            <button
              onClick={() => { setMobileOpen(false); onEditProfile?.(); }}
              className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2"
            >
              <Sparkles size={16} /> Edit Profile
            </button>
            <button
              onClick={() => { setMobileOpen(false); handleSignOut(); }}
              className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
