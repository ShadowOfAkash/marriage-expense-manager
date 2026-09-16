import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Chip, Input } from '@heroui/react';
import { 
  Search, Plus, CalendarCheck, IndianRupee, 
  Calendar, User, Briefcase, CreditCard, ChevronDown, 
  Tag, ExternalLink, Heart, MessageCircle, Scale, 
  CheckCircle2, Archive, Phone, Mail, MapPin, 
  Printer, Star, ArrowRight, Check, X, Filter, 
  Store, FileSpreadsheet, Clock, Trash2, Pencil,
  ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import { api, fmt, formatDate, CATEGORIES, HIRING_STAGES, INDIAN_CITIES } from '../utils/api';
import { TailwindModal } from './TailwindModal';
import { BookingActionMenu } from './BookingActionMenu';
import { AddExpenseModal } from './SharedModals';
import { AttachPaymentModal } from './AttachPaymentModal';
import TablePagination from './TablePagination';
import { useToast } from '../contexts/ToastContext';

const EMPTY_BOOKING_FORM = {
  vendor: '',
  service: '',
  category: 'Photography',
  hiring_stage: 'Shortlisted',
  booking_date: new Date().toISOString().split('T')[0],
  event_date: '',
  amount: '',
  advance: '',
  contact_person: '',
  phone: '',
  email: '',
  city: 'Delhi NCR',
  rating: 4.8,
  deliverables: '',
  arrival_time: '',
  location_note: '',
  notes: ''
};

export default function Bookings() {
  const navigate = useNavigate();
  const toast = useToast();

  // Primary Data State
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Navigation: 'pipeline' | 'financials' | 'marketplace' | 'compare' | 'callsheet'
  const [viewMode, setViewMode] = useState('pipeline');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All Cities');

  // Pagination for Financials Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_BOOKING_FORM);

  // Payment Actions
  const [payBookingId, setPayBookingId] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [attachBooking, setAttachBooking] = useState(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  // Marketplace State
  const [marketplaceVendors, setMarketplaceVendors] = useState([]);
  const [mktLoading, setMktLoading] = useState(false);
  const [mktCategory, setMktCategory] = useState('All');
  const [mktCity, setMktCity] = useState('All Cities');
  const [mktSearch, setMktSearch] = useState('');

  // Comparison Matrix State
  const [compareIds, setCompareIds] = useState([]);

  // 1. Initial Data Fetch
  const loadData = async () => {
    try {
      const [bkData, expData] = await Promise.all([api.getBookings(), api.getExpenses()]);
      setBookings(bkData || []);
      setExpenses(expData || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to load vendor records', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplace = async () => {
    setMktLoading(true);
    try {
      const res = await api.getMarketplaceVendors({
        category: mktCategory !== 'All' ? mktCategory : undefined,
        city: mktCity !== 'All Cities' ? mktCity : undefined,
        search: mktSearch || undefined
      });
      setMarketplaceVendors(res.vendors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMktLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (viewMode === 'marketplace') {
      loadMarketplace();
    }
  }, [viewMode, mktCategory, mktCity, mktSearch]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalBooked = 0;
    let totalPaid = 0;
    const stageCounts = {
      Shortlisted: 0,
      Inquired: 0,
      Evaluating: 0,
      Hired: 0,
      Declined: 0
    };

    bookings.forEach(b => {
      const st = b.hiring_stage || 'Hired';
      if (stageCounts[st] !== undefined) stageCounts[st]++;
      else stageCounts.Hired++;

      if (st === 'Hired') {
        const amt = Number(b.amount) || 0;
        totalBooked += amt;
        const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
        const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        totalPaid += (expPaid > 0 ? expPaid : (Number(b.advance) || 0));
      }
    });

    return {
      totalBooked,
      totalPaid,
      totalRemaining: Math.max(0, totalBooked - totalPaid),
      stageCounts
    };
  }, [bookings, expenses]);

  // Filtered Bookings for Pipeline & Table
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const bookingCode = `BK-${String(b.id).slice(-4)}`.toLowerCase();
      const matchesSearch = !search || 
        b.vendor?.toLowerCase().includes(search.toLowerCase()) || 
        b.service?.toLowerCase().includes(search.toLowerCase()) ||
        b.category?.toLowerCase().includes(search.toLowerCase()) ||
        b.city?.toLowerCase().includes(search.toLowerCase()) ||
        bookingCode.includes(search.toLowerCase());

      const matchesCat = categoryFilter === 'All' || b.category === categoryFilter;
      const matchesStage = stageFilter === 'All' || (b.hiring_stage || 'Hired') === stageFilter;
      const matchesCity = cityFilter === 'All Cities' || b.city === cityFilter;

      return matchesSearch && matchesCat && matchesStage && matchesCity;
    });
  }, [bookings, search, categoryFilter, stageFilter, cityFilter]);

  // Form Field Helper
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Pipeline Stage Transition
  const handleStageChange = async (id, newStage) => {
    try {
      await api.updateBookingStage(id, newStage);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, hiring_stage: newStage } : b));
      toast({ title: `Moved to ${newStage}`, status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to update hiring stage', status: 'error' });
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.toggleBookingFavorite(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, is_favorite: updated.is_favorite } : b));
      toast({ 
        title: updated.is_favorite ? 'Added to favorites ❤️' : 'Removed from favorites', 
        status: 'info' 
      });
    } catch (err) {
      toast({ title: 'Failed to update favorite', status: 'error' });
    }
  };

  // 1-Click WhatsApp Outreach Generator
  const sendWhatsAppInquiry = (vendor) => {
    const phone = (vendor.phone || '').replace(/[^0-9]/g, '');
    const dateStr = vendor.event_date ? `for our wedding on ${formatDate(vendor.event_date)}` : 'for our upcoming wedding';
    const text = encodeURIComponent(
      `Namaste ${vendor.contact_person || vendor.vendor}! 🙏\n\n` +
      `We are planning our wedding celebrations and came across your work for "${vendor.service}". ` +
      `We would love to inquire about your availability and standard package quotes ${dateStr}.\n\n` +
      `Looking forward to connecting with you!\n— Sent via Marriage Expense Manager`
    );
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Shortlist Vendor from Marketplace
  const handleShortlistMarketplace = async (mktVendor) => {
    try {
      const created = await api.shortlistMarketplaceVendor(mktVendor.id, mktVendor.typical_quote);
      setBookings(prev => [created, ...prev]);
      toast({ title: `Shortlisted "${mktVendor.vendor}"!`, description: 'Added to your hiring pipeline', status: 'success' });
      setViewMode('pipeline');
    } catch (err) {
      toast({ title: 'Failed to shortlist vendor', status: 'error' });
    }
  };

  // Add / Edit Modal Submit
  const handleSaveForm = async () => {
    if (!form.vendor || !form.service) {
      return toast({ title: 'Vendor and Service are required', status: 'warning' });
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        deliverables: typeof form.deliverables === 'string'
          ? form.deliverables.split('\n').map(s => s.trim()).filter(Boolean)
          : form.deliverables
      };

      if (form.id) {
        await api.updateBooking(form.id, payload);
        toast({ title: 'Vendor updated successfully', status: 'success' });
        setIsEditOpen(false);
      } else {
        const created = await api.addBooking(payload);
        toast({ title: 'Vendor created successfully', status: 'success' });
        setIsAddOpen(false);
      }
      setForm(EMPTY_BOOKING_FORM);
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to save vendor', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBooking(delId);
      setIsDelOpen(false);
      setBookings(prev => prev.filter(b => b.id !== delId));
      toast({ title: 'Vendor deleted successfully', status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to delete vendor', status: 'error' });
    }
  };

  const openAdd = (presetStage = 'Shortlisted', presetCategory = 'Photography') => {
    setForm({
      ...EMPTY_BOOKING_FORM,
      hiring_stage: presetStage,
      category: presetCategory
    });
    setIsAddOpen(true);
  };

  const openEdit = (b) => {
    setForm({
      ...b,
      deliverables: Array.isArray(b.deliverables) ? b.deliverables.join('\n') : (b.deliverables || '')
    });
    setIsEditOpen(true);
  };

  // Toggle Comparison Selection
  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) {
        toast({ title: 'Comparison limit reached', description: 'You can compare up to 4 vendors side-by-side.', status: 'info' });
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareVendors = useMemo(() => {
    return bookings.filter(b => compareIds.includes(b.id));
  }, [bookings, compareIds]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* 1. Header & Navigation Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#234c6a] bg-[#234c6a]/10 px-2.5 py-0.5 rounded-full border border-[#234c6a]/20 flex items-center gap-1.5">
              <Store size={13} /> The Knot & WeddingWire Vendor Suite
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
            Vendors & Bookings
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-0.5">
            Discover pros, evaluate quotes side-by-side, manage contracts, and print day-of call-sheets.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {compareIds.length > 0 && (
            <Button
              radius="sm"
              size="sm"
              className="bg-blue-600 text-white font-bold text-xs h-9 shadow-xs"
              onClick={() => setViewMode('compare')}
            >
              <Scale size={14} /> Compare ({compareIds.length})
            </Button>
          )}

          <Button
            radius="sm"
            size="sm"
            variant="outline"
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold text-xs h-9"
            onClick={() => setViewMode('callsheet')}
          >
            <Printer size={14} /> Day-of Call-Sheet
          </Button>

          <Button
            radius="sm"
            size="sm"
            className="bg-[#1b3c53] hover:bg-[#234c6a] text-white font-bold text-xs h-9 shadow-xs"
            onClick={() => openAdd('Shortlisted')}
          >
            <Plus size={15} /> Add Custom Vendor
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <Card className="p-4 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Hired Value</span>
            <div className="w-7 h-7 rounded-lg bg-[#234c6a]/10 text-[#234c6a] flex items-center justify-center font-bold">
              <CalendarCheck size={14} />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-zinc-900 mt-2">
            ₹{fmt(summary.totalBooked)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {summary.stageCounts.Hired} vendors officially booked
          </div>
        </Card>

        <Card className="p-4 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Paid / Advance</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard size={14} />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-700 mt-2">
            ₹{fmt(summary.totalPaid)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {summary.totalBooked > 0 ? Math.round((summary.totalPaid / summary.totalBooked) * 100) : 0}% of booked committed
          </div>
        </Card>

        <Card className="p-4 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Pending Balance</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-700 mt-2">
            ₹{fmt(summary.totalRemaining)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Due on or after event days
          </div>
        </Card>

        <Card className="p-4 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Heart size={14} />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-zinc-900 mt-2">
            {bookings.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-rose-600 font-semibold">{summary.stageCounts.Shortlisted} Saved</span> • 
            <span className="text-blue-600 font-semibold">{summary.stageCounts.Evaluating} Reviewing</span>
          </div>
        </Card>
      </div>

      {/* 3. Sub-View Navigation Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'pipeline'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            <CalendarCheck size={14} className="text-[#234c6a]" />
            Pipeline (Kanban)
            <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 rounded-full font-semibold">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('financials')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'financials'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            <CreditCard size={14} className="text-emerald-600" />
            Contracts & Payments
          </button>

          <button
            type="button"
            onClick={() => setViewMode('marketplace')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'marketplace'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            <Store size={14} className="text-purple-600" />
            Marketplace Directory
          </button>

          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'compare'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            <Scale size={14} className="text-blue-600" />
            Comparison Matrix
            {compareIds.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-bold">
                {compareIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('callsheet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'callsheet'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
            }`}
          >
            <Printer size={14} className="text-amber-600" />
            Day-of Call-Sheet
          </button>
        </div>

        {/* Global Quick Filter Bar */}
        {(viewMode === 'pipeline' || viewMode === 'financials') && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search vendor, city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#234c6a]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: HIRING PIPELINE (KANBAN BOARD) - Inspired by WeddingWire India
          ========================================================================= */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {HIRING_STAGES.map(stage => {
            const stageVendors = filteredBookings.filter(b => (b.hiring_stage || 'Hired') === stage.key);
            return (
              <div 
                key={stage.key}
                className="bg-zinc-100/70 rounded-2xl p-3 border border-zinc-200/80 flex flex-col min-w-[260px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      stage.key === 'Shortlisted' ? 'bg-rose-500' :
                      stage.key === 'Inquired' ? 'bg-amber-500' :
                      stage.key === 'Evaluating' ? 'bg-blue-500' :
                      stage.key === 'Hired' ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`} />
                    <h3 className="text-xs font-black text-zinc-800 tracking-tight">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60 shadow-xs">
                    {stageVendors.length}
                  </span>
                </div>

                {/* Vendor Cards in Column */}
                <div className="flex-1 space-y-2.5 min-h-[350px]">
                  {stageVendors.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-[11px] text-zinc-400 font-medium">No vendors in {stage.label}</p>
                      <button
                        type="button"
                        onClick={() => openAdd(stage.key)}
                        className="mt-1.5 text-[10px] font-bold text-[#234c6a] hover:underline"
                      >
                        + Add {stage.label}
                      </button>
                    </div>
                  ) : (
                    stageVendors.map(vendor => (
                      <Card
                        key={vendor.id}
                        className="p-3.5 bg-white border border-zinc-200/80 shadow-xs rounded-xl hover:shadow-md transition-shadow group relative"
                      >
                        {/* Top: Category & Favorite */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                            {vendor.category || 'Vendor'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(vendor.id, e)}
                              className={`p-1 rounded-md transition-colors ${
                                vendor.is_favorite ? 'text-rose-600' : 'text-zinc-300 hover:text-zinc-500'
                              }`}
                              title={vendor.is_favorite ? 'Favorited' : 'Add to favorites'}
                            >
                              <Heart size={14} fill={vendor.is_favorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCompare(vendor.id)}
                              className={`p-1 rounded-md text-[10px] font-bold transition-colors ${
                                compareIds.includes(vendor.id)
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                              }`}
                              title="Compare side-by-side"
                            >
                              <Scale size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Title & Service */}
                        <Link 
                          to={`/bookings/${vendor.id}`}
                          className="block group-hover:text-[#234c6a] transition-colors"
                        >
                          <h4 className="text-sm font-black text-zinc-900 line-clamp-1">
                            {vendor.vendor}
                          </h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {vendor.service}
                          </p>
                        </Link>

                        {/* City & Rating */}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-600">
                          {vendor.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-zinc-400" />
                              {vendor.city}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star size={11} fill="currentColor" /> {vendor.rating || 4.8}
                          </span>
                        </div>

                        {/* Quoted Amount */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Quote</span>
                            <div className="text-xs font-black text-zinc-900">
                              ₹{fmt(vendor.amount)}
                            </div>
                          </div>
                          
                          {/* Quick Action: WhatsApp Outreach */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => sendWhatsAppInquiry(vendor)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Send WhatsApp Inquiry"
                            >
                              <MessageCircle size={13} />
                            </button>
                            {vendor.phone && (
                              <a
                                href={`tel:${vendor.phone}`}
                                className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                                title="Call Vendor"
                              >
                                <Phone size={13} />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Stage Mover Footer */}
                        <div className="mt-3 flex items-center justify-between gap-1 pt-2 border-t border-dashed border-zinc-100">
                          <span className="text-[10px] text-zinc-400 font-medium">Stage:</span>
                          <div className="flex items-center gap-1">
                            {stage.key !== 'Shortlisted' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = HIRING_STAGES.findIndex(s => s.key === stage.key);
                                  if (idx > 0) handleStageChange(vendor.id, HIRING_STAGES[idx - 1].key);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                title="Move Back"
                              >
                                ← Back
                              </button>
                            )}
                            {stage.key !== 'Hired' && stage.key !== 'Declined' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = HIRING_STAGES.findIndex(s => s.key === stage.key);
                                  if (idx < HIRING_STAGES.length - 1) handleStageChange(vendor.id, HIRING_STAGES[idx + 1].key);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b3c53] text-white hover:bg-[#234c6a]"
                                title="Advance Stage"
                              >
                                Next →
                              </button>
                            )}
                            {stage.key === 'Evaluating' && (
                              <button
                                type="button"
                                onClick={() => handleStageChange(vendor.id, 'Hired')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-0.5"
                              >
                                <Check size={10} /> Hire
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CONTRACTS & PAYMENTS TABLE (Existing Polished Financial View)
          ========================================================================= */}
      {viewMode === 'financials' && (
        <Card className="border border-zinc-200/80 shadow-xs bg-white rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b border-zinc-200/80 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Contracted Vendors & Payment Schedules</h2>
              <p className="text-xs text-zinc-500">Track total contract amounts, advance deposits, and linked expenses.</p>
            </div>
            <Button
              radius="sm"
              size="sm"
              className="bg-[#1b3c53] text-white font-bold text-xs"
              onClick={() => openAdd('Hired')}
            >
              <Plus size={14} /> Add Contract
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-100/70 text-zinc-800 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3.5">Vendor & Service</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Hiring Stage</th>
                  <th className="p-3.5">Event Date</th>
                  <th className="p-3.5 text-right">Contract Value</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Remaining</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-zinc-400">
                      No vendors match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBookings
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map(b => {
                      const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
                      const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                      const paid = expPaid > 0 ? expPaid : (Number(b.advance) || 0);
                      const total = Number(b.amount) || 0;
                      const rem = Math.max(0, total - paid);
                      const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-3.5">
                            <Link to={`/bookings/${b.id}`} className="font-bold text-zinc-900 hover:text-[#234c6a] block">
                              {b.vendor}
                            </Link>
                            <span className="text-[11px] text-zinc-400">{b.service}</span>
                          </td>
                          <td className="p-3.5">
                            <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                              {b.category}
                            </Chip>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              b.hiring_stage === 'Hired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              b.hiring_stage === 'Evaluating' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              b.hiring_stage === 'Inquired' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-zinc-100 text-zinc-700'
                            }`}>
                              {b.hiring_stage || 'Hired'}
                            </span>
                          </td>
                          <td className="p-3.5 text-zinc-700 font-medium">
                            {formatDate(b.event_date) || '—'}
                          </td>
                          <td className="p-3.5 text-right font-black text-zinc-900">
                            ₹{fmt(total)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-emerald-700">
                            ₹{fmt(paid)}
                            <div className="w-16 ml-auto mt-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-amber-700">
                            ₹{fmt(rem)}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                radius="sm"
                                size="sm"
                                variant="light"
                                className="text-zinc-600 hover:text-zinc-900 h-7 px-2 text-xs"
                                onClick={() => openEdit(b)}
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                radius="sm"
                                size="sm"
                                variant="light"
                                className="text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs"
                                onClick={() => { setDelId(b.id); setIsDelOpen(true); }}
                              >
                                <Trash2 size={13} />
                              </Button>
                              <BookingActionMenu
                                booking={b}
                                onAttach={() => { setAttachBooking(b); setIsAttachOpen(true); }}
                                onPay={() => { setPayBookingId(b.id); setIsPayOpen(true); }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/50">
            <TablePagination
              totalItems={filteredBookings.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </Card>
      )}

      {/* =========================================================================
          VIEW 3: VENDOR MARKETPLACE & DIRECTORY - Inspired by The Knot Marketplace
          ========================================================================= */}
      {viewMode === 'marketplace' && (
        <div>
          {/* Marketplace Filter Strip */}
          <Card className="p-4 border border-zinc-200/80 shadow-xs bg-white rounded-xl mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
                <button
                  type="button"
                  onClick={() => setMktCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    mktCategory === 'All' ? 'bg-[#1b3c53] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMktCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      mktCategory === cat ? 'bg-[#1b3c53] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* City Filter & Search */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <select
                  value={mktCity}
                  onChange={e => setMktCity(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700"
                >
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="relative flex-1 md:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search pro name..."
                    value={mktSearch}
                    onChange={e => setMktSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Marketplace Grid */}
          {mktLoading ? (
            <div className="p-12 text-center text-zinc-400 font-semibold animate-pulse">
              Loading marketplace vendors...
            </div>
          ) : marketplaceVendors.length === 0 ? (
            <div className="p-12 text-center bg-white border border-zinc-200 rounded-2xl">
              <Store size={36} className="mx-auto text-zinc-300 mb-2" />
              <h3 className="text-base font-bold text-zinc-800">No vendors found</h3>
              <p className="text-xs text-zinc-500 mt-1">Try relaxing your search or city filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {marketplaceVendors.map(vendor => (
                <Card
                  key={vendor.id}
                  className="p-5 bg-white border border-zinc-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    {/* Badge & Rating Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-bold text-[#234c6a] bg-[#234c6a]/10 px-2 py-0.5 rounded-md border border-[#234c6a]/20">
                        {vendor.badge || 'Verified Pro'}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                        <Star size={13} fill="currentColor" />
                        {vendor.rating}
                        <span className="text-[10px] text-zinc-400 font-normal">({vendor.reviews_count})</span>
                      </div>
                    </div>

                    {/* Vendor Name & Service */}
                    <h3 className="text-base font-black text-zinc-900 line-clamp-1">{vendor.vendor}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{vendor.service}</p>

                    {/* City & Category */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-zinc-400" />
                        {vendor.city}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-zinc-700">{vendor.price_tier}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-600 mt-3 line-clamp-2 leading-relaxed">
                      {vendor.description}
                    </p>

                    {/* Deliverables Preview */}
                    <div className="mt-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Included:</span>
                      {vendor.deliverables.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-700">
                          <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Shortlist CTA */}
                  <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Typical Quote</span>
                      <div className="text-sm font-black text-zinc-900">
                        ₹{fmt(vendor.typical_quote)}
                      </div>
                    </div>

                    <Button
                      radius="sm"
                      size="sm"
                      className="bg-[#1b3c53] hover:bg-[#234c6a] text-white font-bold text-xs h-8 shadow-xs"
                      onClick={() => handleShortlistMarketplace(vendor)}
                    >
                      <Heart size={13} className="text-rose-400" /> Shortlist Pro
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 4: COMPARISON MATRIX - Inspired by The Knot Side-by-Side Comparison
          ========================================================================= */}
      {viewMode === 'compare' && (
        <Card className="p-6 border border-zinc-200/80 shadow-xs bg-white rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-blue-600" />
                <h2 className="text-lg font-black text-zinc-900">Vendor Comparison Matrix</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Evaluate pricing, deliverables, pros & cons side-by-side before committing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">
                {compareVendors.length} of 4 selected
              </span>
              {compareVendors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {compareVendors.length < 2 ? (
            <div className="py-16 text-center">
              <Scale size={42} className="mx-auto text-zinc-300 mb-2" />
              <h3 className="text-base font-bold text-zinc-800">Select at least 2 vendors to compare</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Go to the Pipeline view and click the scale icon on any vendor cards to add them to this comparison matrix.
              </p>
              <Button
                radius="sm"
                size="sm"
                className="mt-4 bg-[#1b3c53] text-white font-bold text-xs"
                onClick={() => setViewMode('pipeline')}
              >
                Go to Pipeline
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="p-3 bg-zinc-50/80 w-44 font-bold text-zinc-500 uppercase tracking-wider text-[11px]">
                      Vendor
                    </th>
                    {compareVendors.map(v => (
                      <th key={v.id} className="p-3 font-black text-sm text-zinc-900 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span>{v.vendor}</span>
                          <button
                            type="button"
                            onClick={() => toggleCompare(v.id)}
                            className="text-zinc-400 hover:text-rose-600 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <span className="text-[11px] font-normal text-zinc-500 block mt-0.5">{v.service}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Category</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 font-semibold text-zinc-800">
                        <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-800 text-[10px]">
                          {v.category}
                        </Chip>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Quoted Price</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 text-base font-black text-zinc-900">
                        ₹{fmt(v.amount)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Advance Required</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 font-bold text-emerald-700">
                        ₹{fmt(v.advance)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Rating & Reviews</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 text-amber-600 font-bold flex items-center gap-1">
                        <Star size={13} fill="currentColor" /> {v.rating || 4.8} / 5.0
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">City / Location</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 text-zinc-700">
                        {v.city || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Key Deliverables</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 text-zinc-700 space-y-1">
                        {Array.isArray(v.deliverables) && v.deliverables.length > 0 ? (
                          v.deliverables.map((d, i) => (
                            <div key={i} className="flex items-start gap-1 text-[11px]">
                              <Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                              <span>{d}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-zinc-400 italic">No deliverables itemized</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Pros & Cons / Notes</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3 text-[11px] text-zinc-600 leading-relaxed">
                        {v.pros_cons || v.notes || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-zinc-50/80 font-bold text-zinc-700">Decision</td>
                    {compareVendors.map(v => (
                      <td key={v.id} className="p-3">
                        {v.hiring_stage === 'Hired' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                            <CheckCircle2 size={13} /> Currently Hired
                          </span>
                        ) : (
                          <Button
                            radius="sm"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                            onClick={() => handleStageChange(v.id, 'Hired')}
                          >
                            <Check size={13} /> Hire This Pro
                          </Button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =========================================================================
          VIEW 5: DAY-OF VENDOR CALL-SHEET - Inspired by WeddingWire India
          ========================================================================= */}
      {viewMode === 'callsheet' && (
        <Card className="p-6 border border-zinc-200/80 shadow-xs bg-white rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-amber-600" />
                <h2 className="text-lg font-black text-zinc-900">Day-of Vendor Call-Sheet & Arrival Schedule</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Handover sheet for wedding day coordinators, family elders, and venue managers.
              </p>
            </div>
            <Button
              radius="sm"
              size="sm"
              className="bg-zinc-900 hover:bg-black text-white font-bold text-xs h-9 shadow-xs"
              onClick={() => window.print()}
            >
              <Printer size={14} /> Print / Export PDF
            </Button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-100/70 text-zinc-800 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">Arrival Time</th>
                  <th className="p-3">Vendor / Service</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Hall / Setup Location</th>
                  <th className="p-3 text-right">Balance Due (Cash)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70">
                {bookings.filter(b => (b.hiring_stage || 'Hired') === 'Hired').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-zinc-400">
                      No hired vendors found. Move vendors to "Hired" in the pipeline to generate this call-sheet.
                    </td>
                  </tr>
                ) : (
                  bookings
                    .filter(b => (b.hiring_stage || 'Hired') === 'Hired')
                    .map(b => {
                      const linked = expenses.filter(e => String(e.booking_id) === String(b.id));
                      const expPaid = linked.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                      const paid = expPaid > 0 ? expPaid : (Number(b.advance) || 0);
                      const rem = Math.max(0, (Number(b.amount) || 0) - paid);

                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-3 font-black text-zinc-900">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">
                              {b.arrival_time || 'Schedule Pending'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-zinc-900 block">{b.vendor}</span>
                            <span className="text-[11px] text-zinc-400">{b.service}</span>
                          </td>
                          <td className="p-3">
                            <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                              {b.category}
                            </Chip>
                          </td>
                          <td className="p-3 font-semibold text-zinc-800">
                            {b.contact_person || 'Lead Coordinator'}
                          </td>
                          <td className="p-3">
                            {b.phone ? (
                              <a href={`tel:${b.phone}`} className="text-[#234c6a] font-bold hover:underline">
                                {b.phone}
                              </a>
                            ) : (
                              <span className="text-zinc-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 text-zinc-700">
                            {b.location_note || 'Main Venue Banquet'}
                          </td>
                          <td className="p-3 text-right font-black text-amber-700">
                            ₹{fmt(rem)}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =========================================================================
          MODALS: Add/Edit Vendor, Delete, Payment Modals
          ========================================================================= */}
      <TailwindModal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        title={isEditOpen ? 'Edit Vendor & Contract' : 'Add New Vendor'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Vendor / Business Name *</label>
              <input
                type="text"
                placeholder="e.g. Virasat Cinematography"
                value={form.vendor}
                onChange={e => setF('vendor', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Service Provided *</label>
              <input
                type="text"
                placeholder="e.g. 3-Day Candid Photo & Cinematic Drone"
                value={form.service}
                onChange={e => setF('service', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setF('category', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Hiring Stage</label>
              <select
                value={form.hiring_stage}
                onChange={e => setF('hiring_stage', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800"
              >
                {HIRING_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">City / Region</label>
              <input
                type="text"
                placeholder="e.g. Delhi NCR / Jaipur"
                value={form.city}
                onChange={e => setF('city', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Contract / Quote (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => setF('amount', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-black text-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Advance Paid (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={form.advance}
                onChange={e => setF('advance', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-black text-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Event Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setF('event_date', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Vikram Singh (Manager)"
                value={form.contact_person}
                onChange={e => setF('contact_person', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Phone Number (with WhatsApp)</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={e => setF('phone', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Operational Day-of Details */}
          <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
            <h4 className="text-xs font-bold text-zinc-800 mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" /> Day-of Wedding Logistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Arrival Time</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM (Before Baraat)"
                  value={form.arrival_time}
                  onChange={e => setF('arrival_time', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Setup Hall / Room</label>
                <input
                  type="text"
                  placeholder="e.g. Lawn 2 & Bridal Suite"
                  value={form.location_note}
                  onChange={e => setF('location_note', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">Deliverables Checklist (One per line)</label>
            <textarea
              rows={3}
              placeholder="e.g.&#10;2 Traditional + 2 Candid Photographers&#10;1 Cinematic Teaser Reel&#10;300 Retouched Album Photos"
              value={form.deliverables}
              onChange={e => setF('deliverables', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              radius="sm"
              size="sm"
              variant="outline"
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              radius="sm"
              size="sm"
              className="bg-[#1b3c53] hover:bg-[#234c6a] text-white font-bold text-xs"
              isLoading={saving}
              onClick={handleSaveForm}
            >
              {isEditOpen ? 'Save Changes' : 'Create Vendor'}
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Delete Confirmation Modal */}
      <TailwindModal
        isOpen={isDelOpen}
        onClose={() => setIsDelOpen(false)}
        title="Delete Vendor Record"
        maxWidth="max-w-md"
      >
        <div className="p-2 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Are you sure you want to delete this vendor? This will not delete recorded payments in the Payments tab, but will detach this booking link.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button radius="sm" size="sm" variant="outline" onClick={() => setIsDelOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button radius="sm" size="sm" className="bg-rose-600 text-white font-bold text-xs" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Attach Payment Modal */}
      <AttachPaymentModal
        isOpen={isAttachOpen}
        onClose={() => { setIsAttachOpen(false); setAttachBooking(null); }}
        booking={attachBooking}
        onSuccess={loadData}
      />

      {/* Record Expense Modal */}
      <AddExpenseModal
        isOpen={isPayOpen}
        onClose={() => { setIsPayOpen(false); setPayBookingId(null); }}
        prefillBookingId={payBookingId}
        onSuccess={loadData}
      />
    </div>
  );
}
