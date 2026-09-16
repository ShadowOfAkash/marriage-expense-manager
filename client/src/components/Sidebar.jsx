import React, { useState } from 'react';
import { 
  LayoutDashboard, Receipt, PiggyBank, LogOut, 
  ChevronLeft, ChevronRight, CalendarCheck, 
  X, Sparkles, AlertTriangle, Users, ListChecks, Store 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ mobileOpen, setMobileOpen, weddingProfile, onEditProfile }) {
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
    { id: 'dashboard', label: 'Vivah Suite', sub: 'Overview & Muhurat', icon: LayoutDashboard },
    { id: 'checklist', label: 'Shaadi Roadmap', sub: 'Checklist & To-Dos', icon: ListChecks },
    { id: 'vendors',   label: 'Vendor Bazaar', sub: 'Explore & Quotes', icon: Store },
    { id: 'guests',    label: 'Mehmaan & RSVPs', sub: 'Guest List & Invites', icon: Users },
    { id: 'bookings',  label: 'Vendor Contracts', sub: 'Bookings & Advances', icon: CalendarCheck },
    { id: 'expenses',  label: 'Shaadi Kharcha', sub: 'Payments & Bills', icon: Receipt },
    { id: 'savings',   label: 'Shagun & Fund', sub: 'Treasury & Gifts', icon: PiggyBank },
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

  const coupleDisplayName = (weddingProfile?.groom_name && weddingProfile?.bride_name)
    ? `${weddingProfile.groom_name} & ${weddingProfile.bride_name}`
    : (weddingProfile?.story_title || 'Shubh Vivah');

  // Days Countdown Calculation
  const daysToGo = (() => {
    if (!weddingProfile?.wedding_date) return null;
    const diff = new Date(weddingProfile.wedding_date) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const planningSide = weddingProfile?.planning_side || 'Both';
  const sideLabel = planningSide === 'Groom' ? 'Ladkewale 🎩' : planningSide === 'Bride' ? 'Ladkiwale 👰' : 'Joint Vivah 💍';

  const navContent = (isMobileView = false) => (
    <div className="flex flex-col h-full overflow-visible bg-[#FAF7F2]">
      {/* Brand Header */}
      <div className={`flex items-center px-4 h-20 border-b border-amber-200/60 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-transparent ${
        isMobileView || isExpanded ? 'justify-between' : 'justify-center'
      }`}>
        {!isMobileView && !isExpanded ? (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <Sparkles size={18} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0 ring-2 ring-amber-200/50">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="font-serif font-bold text-base tracking-tight text-zinc-900 leading-tight truncate">
                  {coupleDisplayName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full tracking-wide truncate">
                    {sideLabel}
                  </span>
                  {daysToGo !== null && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full tracking-wide">
                      {daysToGo === 0 ? 'Today! 🎉' : `${daysToGo}d to go`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isMobileView && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-amber-100/60 transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav Links */}
      <div className={`flex-1 flex flex-col gap-1.5 p-3.5 ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}`}>
        <div className={`text-[10px] font-bold text-amber-800/60 uppercase tracking-widest px-3 mb-1 ${
          !isMobileView && !isExpanded ? 'hidden' : 'block'
        }`}>
          Vivah Planner
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
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/5 text-rose-800 font-bold border-l-4 border-rose-600 shadow-xs'
                    : 'text-zinc-600 hover:text-rose-700 hover:bg-amber-100/40 font-medium'
                } ${isMobileView || isExpanded ? 'justify-start' : 'justify-center'}`}
              >
                <Icon size={19} className={isActive ? 'text-rose-600 shrink-0' : 'text-zinc-400 group-hover/menu:text-rose-500 shrink-0 transition-colors'} />
                {(isMobileView || isExpanded) && (
                  <div className="ml-3 min-w-0">
                    <span className="text-sm block leading-tight truncate">{item.label}</span>
                    <span className="text-[10px] text-zinc-400 block leading-tight truncate">{item.sub}</span>
                  </div>
                )}
              </button>

              {/* Tooltip on Hover when Menu is Collapsed */}
              {!isMobileView && !isExpanded && (
                <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/menu:opacity-100 transition-all duration-150 transform group-hover/menu:translate-x-0 -translate-x-1">
                  <div className="relative bg-zinc-900 text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border border-amber-500/30 whitespace-nowrap flex items-center">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-amber-500/30 rotate-45" />
                    <span className="relative z-10">{item.label}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Info & Quick Actions Footer */}
      <div className="border-t border-amber-200/60 p-3 flex flex-col gap-2 bg-[#F4EFEA]/80 overflow-visible">
        {(isMobileView || isExpanded) && onEditProfile && (
          <button
            type="button"
            onClick={onEditProfile}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>Customize Vivah Details</span>
          </button>
        )}

        {(isMobileView || isExpanded) && currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 border border-amber-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-800 truncate">
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
            className={`w-full flex items-center px-3.5 py-2 rounded-xl cursor-pointer text-zinc-500 hover:bg-rose-100/60 hover:text-rose-700 transition-colors text-left ${
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
        className={`relative hidden md:flex bg-[#FAF7F2] text-zinc-900 h-screen sticky top-0 flex-col border-r border-amber-200/60 z-40 transition-all duration-200 shrink-0 shadow-xs ${
          isExpanded ? 'w-[250px]' : 'w-[74px] overflow-visible'
        }`}
      >
        {/* Toggle button */}
        <button
          type="button"
          onClick={toggleExpanded}
          className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-white border border-amber-200 text-zinc-600 hover:text-rose-700 hover:bg-amber-50 shadow-md flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-76 max-w-[85vw] bg-[#FAF7F2] text-zinc-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-amber-200">
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
