import React, { useState } from 'react';
import { Tooltip, Button } from '@heroui/react';
import { LayoutDashboard, Receipt, PiggyBank, LogOut, ChevronLeft, ChevronRight, User, CalendarCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const { logout, currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings',  label: 'Bookings',  icon: CalendarCheck },
    { id: 'expenses',  label: 'Payments',  icon: Receipt },
    { id: 'savings',   label: 'Savings',   icon: PiggyBank },
  ];

  return (
    <div
      className={`bg-zinc-950 text-white h-screen sticky top-0 flex flex-col border-r border-zinc-900 z-50 transition-all duration-200 ${
        isExpanded ? 'w-[240px]' : 'w-[72px]'
      }`}
    >
      <div className={`flex items-center p-4 h-[72px] ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        {isExpanded && (
          <span className="font-extrabold text-lg tracking-tight">
            Finance<span className="text-zinc-400">OS</span>
          </span>
        )}
        <Button
          isIconOnly
          variant="light"
          className="text-zinc-400 hover:text-white hover:bg-zinc-950"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>
      </div>

      <div className="h-px bg-zinc-950 mb-4 mx-4" />

      <div className="flex-1 flex flex-col gap-2 px-3">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <Tooltip content={!isExpanded ? item.label : ''} placement="right" key={item.id} isDisabled={isExpanded}>
              <div
                onClick={() => navigate('/' + item.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive ? 'bg-zinc-950 text-white' : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'
                } ${isExpanded ? 'justify-start' : 'justify-center mx-auto'}`}
              >
                <Icon size={20} />
                {isExpanded && <span className="ml-3 text-sm font-semibold">{item.label}</span>}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className="h-px bg-zinc-950 mt-4 mx-4" />
      
      {isExpanded && currentUser && (
        <div className="flex px-4 py-2 items-center mt-2">
          <User size={16} className="text-zinc-500 mr-2" />
          <span className="text-xs text-zinc-500 truncate">{currentUser.email}</span>
        </div>
      )}

      <div className="p-3">
        <Tooltip content={!isExpanded ? "Logout" : ''} placement="right" isDisabled={isExpanded}>
          <div
            onClick={logout}
            className={`flex items-center p-3 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-950 hover:text-white transition-colors ${
              isExpanded ? 'justify-start' : 'justify-center mx-auto'
            }`}
          >
            <LogOut size={20} />
            {isExpanded && <span className="ml-3 text-sm font-semibold">Logout</span>}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
