import React, { useState } from 'react';
import { 
  LayoutDashboard, Receipt, PiggyBank, LogOut, 
  ChevronLeft, ChevronRight, CalendarCheck, 
  X, Sparkles, AlertTriangle, Users, ListChecks 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const { logout, currentUser } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_expanded', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'guests',    label: 'Guests',    icon: Users },
    { id: 'bookings',  label: 'Vendors & Bookings', icon: CalendarCheck },
    { id: 'expenses',  label: 'Payments',  icon: Receipt },
    { id: 'savings',   label: 'Savings',   icon: PiggyBank },
  ];

  const handleNav = (id) => {
    navigate('/' + id);
    if (setMobileOpen) setMobileOpen(false);
  };

  const triggerSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      setShowSignOutModal(false);
      navigate('/');
      if (setMobileOpen) setMobileOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const navContent = (isMobileView = false) => (
    <div className="flex flex-col h-full overflow-visible">
      {/* Brand Header */}
      <div className={`flex items-center px-3.5 h-16 border-b border-zinc-900/80 ${
        isMobileView || isExpanded ? 'justify-between' : 'justify-center'
      }`}>
        {!isMobileView && !isExpanded ? (
          <div className="w-8 h-8 rounded-lg bg-[#234c6a] flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles size={16} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#234c6a] flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  Marriage <span className="text-[#7492a8]">Manager</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase truncate">
                  Expense & Planning
                </div>
              </div>
            </div>

            {isMobileView && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav Links */}
      <div className={`flex-1 flex flex-col gap-1.5 p-3 ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}`}>
        <div className={`text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-1 ${
          !isMobileView && !isExpanded ? 'hidden' : 'block'
        }`}>
          Navigation
        </div>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative group/menu flex items-center w-full">
              <button
                type="button"
                onClick={() => handleNav(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#234c6a] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100 font-medium'
                } ${isMobileView || isExpanded ? 'justify-start' : 'justify-center'}`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-zinc-400'} />
                {(isMobileView || isExpanded) && (
                  <span className="ml-3 text-sm">{item.label}</span>
                )}
              </button>

              {/* Tooltip on Hover when Menu is Collapsed */}
              {!isMobileView && !isExpanded && (
                <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/menu:opacity-100 transition-all duration-150 transform group-hover/menu:translate-x-0 -translate-x-1">
                  <div className="relative bg-zinc-900 text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-md shadow-2xl border border-zinc-700/80 whitespace-nowrap flex items-center">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-700/80 rotate-45" />
                    <span className="relative z-10">{item.label}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-zinc-900/80 p-3 flex flex-col gap-1 bg-zinc-950/60 overflow-visible">
        {(isMobileView || isExpanded) && currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900/50">
            <div className="w-7 h-7 rounded-full bg-[#1b3c53] text-zinc-200 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-zinc-200 truncate">
                {currentUser.displayName || currentUser.email.split('@')[0]}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>
        )}

        <div className="relative group/logout flex items-center w-full">
          <button
            type="button"
            onClick={triggerSignOut}
            title={!isExpanded ? "Sign Out" : undefined}
            className={`w-full flex items-center px-3.5 py-2 rounded-lg cursor-pointer text-zinc-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left ${
              isMobileView || isExpanded ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut size={16} />
            {(isMobileView || isExpanded) && (
              <span className="ml-3 text-xs font-semibold">Sign Out</span>
            )}
          </button>

          {/* Tooltip on Hover when Menu is Collapsed */}
          {!isMobileView && !isExpanded && (
            <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/logout:opacity-100 transition-all duration-150 transform group-hover/logout:translate-x-0 -translate-x-1">
              <div className="relative bg-zinc-900 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-md shadow-2xl border border-rose-900/60 whitespace-nowrap flex items-center">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-rose-900/60 rotate-45" />
                <span className="relative z-10">Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible md+) */}
      <aside
        className={`relative hidden md:flex bg-zinc-950 text-white h-screen sticky top-0 flex-col border-r border-zinc-900 z-40 transition-all duration-200 shrink-0 ${
          isExpanded ? 'w-[240px]' : 'w-[72px] overflow-visible'
        }`}
      >
        {/* Toggle button: half on menu border edge and half floating */}
        <button
          type="button"
          onClick={toggleExpanded}
          className="absolute -right-3 top-5 z-50 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-md flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none"
          aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft size={13} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={13} strokeWidth={2.5} />
          )}
        </button>

        {navContent(false)}
      </aside>

      {/* Mobile Drawer (visible only when mobileOpen is true on < md) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-72 max-w-[80vw] bg-zinc-950 text-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent(true)}
          </div>
        </div>
      )}

      {/* Sign Out Warning Modal */}
      {showSignOutModal && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => !signingOut && setShowSignOutModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 border border-zinc-200/80 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={22} className="text-amber-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900">Sign Out</h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Are you sure you want to sign out? You will need to sign in again to access your dashboard and bookings.
              </p>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={confirmSignOut}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <LogOut size={14} />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
