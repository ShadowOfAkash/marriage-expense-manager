import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@heroui/react';
import { LayoutDashboard, Receipt, PiggyBank, ChevronDown, LogOut, User, Gem, CalendarCheck } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

const TABS = [
  { id: 'bookings',  label: 'Bookings',  Icon: CalendarCheck },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'expenses',  label: 'Payments',  Icon: Receipt          },
  { id: 'savings',   label: 'Savings',   Icon: PiggyBank        },
];

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const toast = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.logout(); } catch (_) {}
    toast({ title: 'Logged out successfully', status: 'info' });
    onLogout();
  };

  return (
    <div className="bg-gradient-to-br from-[#1C1125] via-[#2D1242] to-[#3D1654] border-b border-[#BE185D40] sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-[68px] flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Gem size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-extrabold text-base tracking-tight leading-tight">Shaadi Tracker</div>
              <div className="text-white/50 text-[9px] tracking-widest uppercase leading-tight">Wedding Budget Manager</div>
            </div>
          </div>

          <div className="hidden md:flex bg-white/10 border border-white/10 rounded-2xl p-1 gap-1 items-center">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  className={`flex items-center gap-2 px-4 h-[34px] text-sm rounded-xl transition-all ${
                    isActive ? 'bg-white text-blue-700 font-bold shadow-md' : 'text-white/70 font-medium hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 hover:opacity-85 active:opacity-70 transition-opacity"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-600 to-purple-700 text-white font-bold text-xs flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-white text-sm font-semibold max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="text-white/50" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 overflow-hidden z-50">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-gray-800 truncate">{user.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <User size={14} /> Profile
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>

        </div>

        <div className="flex md:hidden pb-2 gap-1 bg-white/10 rounded-xl p-1 mb-1">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                className={`flex-1 flex items-center justify-center gap-2 h-8 text-xs rounded-lg transition-all ${
                  isActive ? 'bg-white text-blue-700 font-bold' : 'text-white/70 font-medium hover:bg-white/20 hover:text-white'
                }`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
