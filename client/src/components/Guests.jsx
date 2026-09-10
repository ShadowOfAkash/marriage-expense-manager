import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import { 
  Users, Plus, Upload, Download, Search, CheckCircle2, 
  XCircle, ChevronDown, Trash2, CalendarCheck, 
  RefreshCw, X, Mail, UserCheck, Minus, ArrowRight,
  User, Heart, Send, ExternalLink, FileText, Sparkles,
  AlertTriangle, Settings2, Building2, Home, Bed
} from 'lucide-react';
import { api, formatDate, WEDDING_EVENTS, RSVP_STATUSES, RELATIONSHIP_CATEGORIES, STAY_PREFERENCES } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import TablePagination from './TablePagination';
import { GuestActionMenu } from './GuestActionMenu';
import { GuestProfileDrawer } from './GuestProfileDrawer';
import { AddEditGuestModal } from './AddEditGuestModal';
import { GuestImportModal } from './GuestImportModal';
import { TailwindModal } from './TailwindModal';
import { EmailSettingsModal } from './EmailSettingsModal';

export default function Guests() {
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'invitations' (All Guests / Invitations) or 'confirmed' (Confirmed & Attending)
  const [activeTab, setActiveTab] = useState('invitations');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRsvp, setFilterRsvp] = useState('All');
  const [filterAttendance, setFilterAttendance] = useState('All');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterStay, setFilterStay] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawer state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [viewGuest, setViewGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Email Delivery Configuration state
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [emailSettings, setEmailSettings] = useState(null);

  // Invitation Modals state
  const [inviteModalGuest, setInviteModalGuest] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Bulk Invitation state
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [bulkInviteSubject, setBulkInviteSubject] = useState('Royal Wedding Invitation: Join Us in Celebrating!');
  const [bulkInviteMessage, setBulkInviteMessage] = useState('');
  const [bulkSendingInvite, setBulkSendingInvite] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [guestList, summaryData, emailConf] = await Promise.all([
        api.getGuests(),
        api.getGuestSummary(),
        api.getEmailSettings().catch(() => null)
      ]);
      setGuests(guestList || []);
      setSummary(summaryData || null);
      if (emailConf) {
        setEmailSettings(emailConf);
      }
    } catch (err) {
      toast({ title: 'Failed to load guests', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEmailSettingsUpdated = (configured, senderEmail) => {
    setEmailSettings(prev => ({
      ...prev,
      configured,
      smtp_user: senderEmail
    }));
    api.getEmailSettings().then(setEmailSettings).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  // Unique households list for autocompletion
  const existingHouseholds = useMemo(() => {
    const set = new Set();
    guests.forEach(g => {
      if (g.household_name && g.household_name.trim()) set.add(g.household_name.trim());
    });
    return Array.from(set).sort();
  }, [guests]);

  // Household member count map
  const householdCountMap = useMemo(() => {
    const map = {};
    guests.forEach(g => {
      if (g.household_name && g.household_name.trim()) {
        const key = g.household_name.trim().toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [guests]);

  // Confirmed guests subset
  const confirmedGuests = useMemo(() => {
    return guests.filter(g => (g.rsvp_status || '').toLowerCase() === 'confirmed');
  }, [guests]);

  // Tab 2 Attending Metrics
  const attendingMetrics = useMemo(() => {
    const totalConfirmed = confirmedGuests.length;
    const attended = confirmedGuests.filter(g => g.actual_attendance === 'Attended' || g.check_in_status).length;
    const pending = totalConfirmed - attended;
    const expectedHeadcount = confirmedGuests.reduce((sum, g) => 
      sum + (Number(g.expected_attendees) || (Number(g.expected_adults || 1) + Number(g.expected_children || 0))), 0);
    const actualHeadcount = confirmedGuests.reduce((sum, g) => {
      const isAttended = g.actual_attendance === 'Attended' || g.check_in_status;
      return sum + (isAttended ? (Number(g.actual_attendees) || Number(g.expected_attendees) || 1) : 0);
    }, 0);
    const hotelCount = confirmedGuests.filter(g => g.stay_preference === 'Hotel').length;
    const homeStayCount = confirmedGuests.filter(g => g.stay_preference === 'Home Stay').length;
    const noStayCount = confirmedGuests.filter(g => !g.stay_preference || g.stay_preference === 'No need of stay').length;

    return { totalConfirmed, attended, pending, expectedHeadcount, actualHeadcount, hotelCount, homeStayCount, noStayCount };
  }, [confirmedGuests]);

  // Base list depending on active tab
  const baseGuests = useMemo(() => {
    if (activeTab === 'confirmed') {
      return confirmedGuests;
    }
    return guests;
  }, [activeTab, guests, confirmedGuests]);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return baseGuests.filter(g => {
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = g.name && g.name.toLowerCase().includes(q);
        const matchId = g.guest_id && g.guest_id.toLowerCase().includes(q);
        const matchPhone = g.phone && g.phone.toLowerCase().includes(q);
        const matchEmail = g.email && g.email.toLowerCase().includes(q);
        const matchHousehold = g.household_name && g.household_name.toLowerCase().includes(q);
        const matchDetail = g.relationship_detail && g.relationship_detail.toLowerCase().includes(q);
        const matchTags = Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchPhone && !matchEmail && !matchHousehold && !matchDetail && !matchTags) {
          return false;
        }
      }

      if (filterCategory !== 'All' && g.relationship_category !== filterCategory) {
        return false;
      }

      const status = (g.rsvp_status === 'Not Responded' || !g.rsvp_status) ? 'Pending Invitation' : g.rsvp_status;
      if (activeTab === 'invitations' && filterRsvp !== 'All' && status !== filterRsvp) {
        return false;
      }

      if (filterAttendance !== 'All') {
        const att = g.actual_attendance || (g.check_in_status ? 'Attended' : 'Pending');
        if (att !== filterAttendance) return false;
      }

      if (filterEvent !== 'All') {
        if (!Array.isArray(g.events) || !g.events.includes(filterEvent)) return false;
      }

      if (filterStay !== 'All') {
        const pref = g.stay_preference || 'No need of stay';
        if (pref !== filterStay) return false;
      }

      return true;
    });
  }, [baseGuests, search, filterCategory, filterRsvp, filterAttendance, filterEvent, filterStay, activeTab]);

  // Paginated guests
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, currentPage, pageSize]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredGuests.map(g => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredGuests.length > 0 && selectedIds.length === filteredGuests.length;

  // Save guest (Add or Edit)
  const handleSaveGuest = async (formData) => {
    if (editGuest && editGuest.id) {
      await api.updateGuest(editGuest.id, formData);
      toast({ title: 'Guest Updated', description: `${formData.name} was successfully updated.`, status: 'success' });
    } else {
      await api.addGuest(formData);
      toast({ title: 'Guest Added', description: `${formData.name} was added to the guest list.`, status: 'success' });
    }
    setEditGuest(null);
    await loadData();
  };

  // Toggle Check-in / Attended
  const handleToggleCheckIn = async (g) => {
    try {
      const isAttended = g.actual_attendance === 'Attended' || g.check_in_status;
      const updatedAttendance = isAttended ? 'Pending' : 'Attended';
      const updatedCheckIn = !isAttended;
      const actAttendees = !isAttended ? (g.expected_attendees || (Number(g.expected_adults||1) + Number(g.expected_children||0))) : 0;

      await api.updateGuest(g.id, {
        ...g,
        actual_attendance: updatedAttendance,
        check_in_status: updatedCheckIn,
        actual_attendees: actAttendees,
        check_in_time: updatedCheckIn ? new Date().toISOString() : null
      });

      toast({
        title: updatedCheckIn ? 'Guest Attended' : 'Attendance Reset',
        description: `${g.name} marked as ${updatedCheckIn ? 'Attended' : 'Pending'}.`,
        status: updatedCheckIn ? 'success' : 'info'
      });

      await loadData();
      if (viewGuest && viewGuest.id === g.id) {
        setViewGuest(prev => ({
          ...prev,
          actual_attendance: updatedAttendance,
          check_in_status: updatedCheckIn,
          actual_attendees: actAttendees,
          check_in_time: updatedCheckIn ? new Date().toISOString() : null
        }));
      }
    } catch (err) {
      toast({ title: 'Action failed', description: err.message, status: 'error' });
    }
  };

  // Increment/Decrement actual attendees count for a guest
  const handleUpdateAttendeesCount = async (g, delta) => {
    try {
      const current = Number(g.actual_attendees || 0);
      const next = Math.max(0, current + delta);
      const isAttended = next > 0;

      await api.updateGuest(g.id, {
        ...g,
        actual_attendees: next,
        actual_attendance: isAttended ? 'Attended' : 'Pending',
        check_in_status: isAttended,
        check_in_time: isAttended ? (g.check_in_time || new Date().toISOString()) : null
      });

      await loadData();
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, status: 'error' });
    }
  };

  // Open Single Invite Modal
  const handleOpenInviteModal = (g) => {
    setInviteModalGuest(g);
    setInviteEmail(g.email || '');
    setInviteSubject('Royal Wedding Invitation: Join Us in Celebrating!');
    setInviteMessage(
      `Dear ${g.name},\n\nWe would be honored and delighted to have your presence to celebrate our wedding. Please find our royal wedding invitation card attached. You can confirm your attendance online using the link in this email.\n\nWarmest regards,\nAkash & Family`
    );
  };

  // Submit Send Single Invitation
  const handleSendInviteSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inviteModalGuest) return;
    if (!inviteEmail || !inviteEmail.trim()) {
      toast({ title: 'Email required', description: 'Please provide a valid recipient email address.', status: 'warning' });
      return;
    }
    setSendingInvite(true);
    try {
      const res = await api.sendGuestInvitation(inviteModalGuest.id, {
        email: inviteEmail.trim(),
        customSubject: inviteSubject,
        customMessage: inviteMessage
      });

      if (res.isTest) {
        toast({
          title: 'Invitation Sent (Sandbox Test Mode)',
          description: `Simulated delivery to ${inviteEmail}. Configure Email Delivery to send real emails to your guests.`,
          status: 'warning'
        });
      } else {
        toast({
          title: 'Invitation Delivered!',
          description: `Invitation email with Royal PDF card sent successfully to ${inviteEmail}.`,
          status: 'success'
        });
      }

      if (res.previewUrl) {
        console.log('Sandbox Email Preview URL:', res.previewUrl);
      }

      setInviteModalGuest(null);
      await loadData();
      if (viewGuest?.id === inviteModalGuest.id) {
        setViewGuest(prev => ({
          ...prev,
          email: inviteEmail.trim(),
          rsvp_status: 'Invited',
          invitation_sent_at: new Date().toISOString()
        }));
      }
    } catch (err) {
      toast({ title: 'Failed to send invitation', description: err.message, status: 'error' });
    } finally {
      setSendingInvite(false);
    }
  };

  // Submit Bulk Invitations
  const handleBulkSendInvitations = async () => {
    if (selectedIds.length === 0) return;
    setBulkSendingInvite(true);
    try {
      const res = await api.sendBulkInvitations({
        guestIds: selectedIds,
        customSubject: bulkInviteSubject,
        customMessage: bulkInviteMessage
      });

      if (res.isTest) {
        toast({
          title: 'Bulk Invitations (Sandbox Mode)',
          description: `Sandbox simulated sending ${res.sentCount} invitations. Connect your Gmail/SMTP in Email Delivery to send real emails.`,
          status: 'warning'
        });
      } else {
        toast({
          title: 'Bulk Invitations Delivered',
          description: `Successfully delivered ${res.sentCount} invitations to guests (${res.skippedCount || 0} skipped without email).`,
          status: 'success'
        });
      }

      setBulkInviteOpen(false);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      toast({ title: 'Bulk send failed', description: err.message, status: 'error' });
    } finally {
      setBulkSendingInvite(false);
    }
  };

  // Manual Status Update
  const handleChangeRsvp = async (guestId, newStatus) => {
    try {
      await api.updateGuestRsvp(guestId, newStatus);
      toast({
        title: 'Status Updated',
        description: `Guest status marked as ${newStatus}.`,
        status: 'success'
      });
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, rsvp_status: newStatus } : g));
      if (viewGuest && viewGuest.id === guestId) {
        setViewGuest(prev => ({ ...prev, rsvp_status: newStatus }));
      }
      await loadData();
    } catch (err) {
      toast({ title: 'Failed to update status', description: err.message, status: 'error' });
    }
  };

  // Manual Stay Preference Update
  const handleChangeStayPreference = async (guestId, newPreference) => {
    const targetGuest = guests.find(g => Number(g.id) === Number(guestId)) || (viewGuest && Number(viewGuest.id) === Number(guestId) ? viewGuest : null);
    
    // Optimistic state update
    setGuests(prev => prev.map(g => Number(g.id) === Number(guestId) ? { ...g, stay_preference: newPreference } : g));
    if (viewGuest && Number(viewGuest.id) === Number(guestId)) {
      setViewGuest(prev => ({ ...prev, stay_preference: newPreference }));
    }

    try {
      await api.updateGuestStayPreference(guestId, newPreference, targetGuest);
      toast({
        title: 'Stay Preference Updated',
        description: `Stay preference set to "${newPreference}".`,
        status: 'success'
      });
      await loadData();
    } catch (err) {
      // Rollback optimistic state if failed
      if (targetGuest) {
        setGuests(prev => prev.map(g => Number(g.id) === Number(guestId) ? targetGuest : g));
        if (viewGuest && Number(viewGuest.id) === Number(guestId)) {
          setViewGuest(targetGuest);
        }
      }
      toast({ title: 'Failed to update stay preference', description: err.message, status: 'error' });
    }
  };

  // Download PDF Card
  const handleDownloadPdf = (g) => {
    window.open(api.getGuestInvitationPdfUrl(g.id), '_blank');
  };

  // Delete single guest
  const handleDeleteGuest = async () => {
    if (!deleteGuest) return;
    try {
      await api.deleteGuest(deleteGuest.id);
      toast({ title: 'Guest Deleted', description: `${deleteGuest.name} was removed.`, status: 'info' });
      setDeleteGuest(null);
      if (viewGuest?.id === deleteGuest.id) setViewGuest(null);
      setSelectedIds(prev => prev.filter(i => i !== deleteGuest.id));
      await loadData();
    } catch (err) {
      toast({ title: 'Delete Failed', description: err.message, status: 'error' });
    }
  };

  // Bulk Operations
  const handleBulkRsvp = async (rsvp_status) => {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkUpdateGuests({
        action: 'change_rsvp',
        guestIds: selectedIds,
        data: { rsvp_status }
      });
      toast({ title: 'Status Updated', description: `Updated status for ${selectedIds.length} guests.`, status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Bulk status update failed', description: err.message, status: 'error' });
    }
  };

  const handleBulkAttendance = async (actual_attendance) => {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkUpdateGuests({
        action: 'mark_attendance',
        guestIds: selectedIds,
        data: { actual_attendance }
      });
      toast({ title: 'Attendance Updated', description: `Updated attendance for ${selectedIds.length} guests.`, status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Bulk attendance failed', description: err.message, status: 'error' });
    }
  };

  const handleBulkAssignEvent = async (event) => {
    if (selectedIds.length === 0 || !event) return;
    try {
      await api.bulkUpdateGuests({
        action: 'assign_event',
        guestIds: selectedIds,
        data: { event }
      });
      toast({ title: 'Ceremony Assigned', description: `Assigned ${event} to ${selectedIds.length} guests.`, status: 'success' });
      await loadData();
    } catch (err) {
      toast({ title: 'Assign ceremony failed', description: err.message, status: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await api.bulkUpdateGuests({
        action: 'delete',
        guestIds: selectedIds
      });
      toast({ title: 'Guests Deleted', description: `Deleted ${selectedIds.length} guests.`, status: 'info' });
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      await loadData();
    } catch (err) {
      toast({ title: 'Bulk delete failed', description: err.message, status: 'error' });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Update Events from Drawer
  const handleUpdateEvents = async (guestId, newEvents) => {
    try {
      const g = guests.find(item => item.id === guestId);
      if (!g) return;
      await api.updateGuest(guestId, { ...g, events: newEvents });
      setGuests(prev => prev.map(item => item.id === guestId ? { ...item, events: newEvents } : item));
      if (viewGuest && viewGuest.id === guestId) {
        setViewGuest(prev => ({ ...prev, events: newEvents }));
      }
    } catch (err) {
      toast({ title: 'Failed to update ceremonies', description: err.message, status: 'error' });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 
      ? guests.filter(g => selectedIds.includes(g.id))
      : filteredGuests;

    if (listToExport.length === 0) {
      toast({ title: 'No guests to export', description: 'Filter or select guests first.', status: 'warning' });
      return;
    }

    const headers = [
      'Full Name', 'Phone', 'Email', 'Relationship Category',
      'Guest Type', 'Dependents',
      'Plus One Allowed', 'Plus One Name', 'Status', 'Expected Adults',
      'Expected Children', 'Expected Headcount', 'Actual Attendance', 'Actual Attendees',
      'Events', 'Tags'
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = listToExport.map(g => [
      escapeCSV(g.name),
      escapeCSV(g.phone),
      escapeCSV(g.email),
      escapeCSV(g.relationship_category),
      escapeCSV(g.guest_type),
      escapeCSV(Array.isArray(g.dependents) ? g.dependents.map(d => `${d.name} (${d.relation || 'Member'})`).join('; ') : ''),
      escapeCSV(g.plus_one_allowed ? 'Yes' : 'No'),
      escapeCSV(g.plus_one_name),
      escapeCSV((g.rsvp_status === 'Not Responded' || !g.rsvp_status) ? 'Pending Invitation' : g.rsvp_status),
      escapeCSV(g.expected_adults || 1),
      escapeCSV(g.expected_children || 0),
      escapeCSV(g.expected_attendees || 1),
      escapeCSV(g.actual_attendance),
      escapeCSV(g.actual_attendees || 0),
      escapeCSV(Array.isArray(g.events) ? g.events.join(', ') : ''),
      escapeCSV(Array.isArray(g.tags) ? g.tags.join(', ') : '')
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wedding_guest_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      description: `Exported ${listToExport.length} guests to CSV.`,
      status: 'success'
    });
  };

  // Import batch
  const handleImportBatch = async (batch) => {
    await api.importGuests(batch);
    await loadData();
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setFilterCategory('All');
    setFilterRsvp('All');
    setFilterAttendance('All');
    setFilterEvent('All');
    setCurrentPage(1);
  };

  const isFiltersActive = search || filterCategory !== 'All' || (activeTab === 'invitations' && filterRsvp !== 'All') || filterAttendance !== 'All' || filterEvent !== 'All';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      
      {/* 1. Page Header (Clean, uncluttered, matching Bookings and Payments) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-zinc-900" /> Guests
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage wedding invitations, families, and confirmed guest attendance</p>
        </div>

        {/* Action Controls Toolbar - Clean single-row layout without awkward wrapping */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap md:flex-nowrap w-full md:w-auto justify-start md:justify-end">
          {/* Email Delivery Status Pill */}
          <button
            type="button"
            onClick={() => setIsEmailSettingsOpen(true)}
            title={
              emailSettings?.configured
                ? `Email delivery active: ${emailSettings.smtp_user || 'Connected'}. Click to configure settings.`
                : 'Email delivery not configured yet (Sandbox Mode). Click to connect Gmail or custom SMTP.'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
              emailSettings?.configured
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
            }`}
          >
            {emailSettings?.configured ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Email Live</span>
                <Settings2 size={12} className="text-emerald-700 opacity-80 ml-0.5 shrink-0" />
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                <span>Setup Email</span>
              </>
            )}
          </button>

          {/* Grouped CSV Import & Export Segmented Control */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200/90 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/90 rounded-md transition-colors cursor-pointer"
              title="Import guests from a CSV spreadsheet"
            >
              <Upload size={13} className="text-[#234c6a]" />
              <span>Import</span>
            </button>
            <div className="h-4 w-[1px] bg-zinc-200 mx-0.5" />
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/90 rounded-md transition-colors cursor-pointer"
              title="Export guest list to CSV spreadsheet"
            >
              <Download size={13} className="text-[#234c6a]" />
              <span>Export</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <Button
            radius="sm"
            onClick={() => setIsAddOpen(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-sm font-bold text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Add Guest</span>
          </Button>
        </div>
      </div>

      {/* 2. Core Statistics Cards (Aligned with Bookings, Savings, and Dashboard design language) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        
        {/* Card 1: Total Directory */}
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#1b3c53] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total Guests</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {summary?.totalGuests || guests.length}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {summary?.invited || 0} invites sent ({summary?.noResponse || 0} pending)
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Confirmed Guests */}
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#234c6a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Confirmed Guests</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {summary?.confirmed || 0}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {summary?.maybe || 0} maybe · {summary?.declined || 0} declined
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Expected Headcount */}
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#325a77] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Expected Headcount</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {summary?.expectedAttendance || 0}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                Expected attendees
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Actually Attended */}
        <Card className="p-4 md:p-5 border border-zinc-200/80 shadow-xs bg-white rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#456882] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Actually Attended</div>
              <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                {summary?.actuallyAttended || 0}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                Attended wedding
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Sleek Two-Tab Switcher */}
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-200/80 shrink-0">
        <button
          type="button"
          onClick={() => handleTabChange('invitations')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'invitations'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
          }`}
        >
          <Mail size={16} />
          <span>All Guests & Invitations</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'invitations' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {guests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('confirmed')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'confirmed'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
          }`}
        >
          <CheckCircle2 size={16} className={activeTab === 'confirmed' ? 'text-emerald-600' : ''} />
          <span>Confirmed & Attending</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'confirmed' ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {confirmedGuests.length}
          </span>
        </button>
      </div>

      {/* Tab 2: Attendance Tracking Quick Bar */}
      {activeTab === 'confirmed' && (
        <div className="mb-4 p-3 rounded-xl bg-[#1b3c53]/5 border border-[#1b3c53]/15 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#1b3c53] font-medium">
            <CheckCircle2 size={16} className="text-[#1b3c53] shrink-0" />
            <span>
              <strong>Attendance Tracking:</strong> Mark whether confirmed guests attended the wedding and record actual attendees.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 bg-white border border-zinc-200/80 rounded-lg text-zinc-800 font-bold shadow-2xs">
              Attended: <strong className="text-emerald-700 font-black">{attendingMetrics.attended}</strong> / {attendingMetrics.totalConfirmed}
            </span>
            <span className="px-2.5 py-1 bg-white border border-zinc-200/80 rounded-lg text-zinc-800 font-bold shadow-2xs">
              Pending: <strong className="text-amber-700 font-black">{attendingMetrics.pending}</strong>
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/80 rounded-lg text-indigo-900 font-bold shadow-2xs inline-flex items-center gap-1">
              <Building2 size={12} className="text-indigo-600" />
              <span>Hotel: <strong>{attendingMetrics.hotelCount}</strong></span>
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-900 font-bold shadow-2xs inline-flex items-center gap-1">
              <Home size={12} className="text-emerald-600" />
              <span>Home Stay: <strong>{attendingMetrics.homeStayCount}</strong></span>
            </span>
            <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg font-bold shadow-2xs">
              Actual Headcount: {attendingMetrics.actualHeadcount}
            </span>
          </div>
        </div>
      )}

      {/* 4. Search and Filters Toolbar (Matching Bookings & Payments) */}
      <div className="mb-4 bg-white border border-zinc-200/80 rounded-xl p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0">
        
        {/* Search Input Box */}
        <div className="flex-1 flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/60 rounded-lg px-3 py-1.5 focus-within:border-zinc-400 focus-within:bg-white transition-all">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder={activeTab === 'invitations' ? "Search by name, phone, family, tag..." : "Search confirmed guests..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 py-1"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-600 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Selects & Count */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Relation Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="h-9.5 pl-3 pr-8 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-800 border border-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Relations</option>
              {RELATIONSHIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* RSVP Filter (Tab 1) */}
          {activeTab === 'invitations' && (
            <div className="relative">
              <select
                value={filterRsvp}
                onChange={(e) => { setFilterRsvp(e.target.value); setCurrentPage(1); }}
                className="h-9.5 pl-3 pr-8 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-800 border border-zinc-200 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {RSVP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          )}

          {/* Attendance Filter (Tab 2) */}
          {activeTab === 'confirmed' && (
            <div className="relative">
              <select
                value={filterAttendance}
                onChange={(e) => { setFilterAttendance(e.target.value); setCurrentPage(1); }}
                className="h-9.5 pl-3 pr-8 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-800 border border-zinc-200 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Attendance</option>
                <option value="Attended">Attended</option>
                <option value="Pending">Pending</option>
                <option value="Did Not Attend">Absent</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          )}

          {/* Stay Preference Filter (Tab 2) */}
          {activeTab === 'confirmed' && (
            <div className="relative">
              <select
                value={filterStay}
                onChange={(e) => { setFilterStay(e.target.value); setCurrentPage(1); }}
                className="h-9.5 pl-3 pr-8 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-800 border border-zinc-200 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Stays</option>
                {STAY_PREFERENCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          )}

          {/* Ceremony Filter (Tab 1) */}
          {activeTab === 'invitations' && (
            <div className="relative">
              <select
                value={filterEvent}
                onChange={(e) => { setFilterEvent(e.target.value); setCurrentPage(1); }}
                className="h-9.5 pl-3 pr-8 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg text-sm font-medium text-zinc-800 border border-zinc-200 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Ceremonies</option>
                {WEDDING_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          )}

          {/* Total Filtered Count Badge */}
          <div className="hidden sm:flex items-center px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-zinc-600 whitespace-nowrap">
            {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'}
          </div>

          {isFiltersActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#234c6a] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. Floating / Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 mb-4 p-3 bg-zinc-900 text-white rounded-xl shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg">
              {selectedIds.length} {selectedIds.length === 1 ? 'guest' : 'guests'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Deselect
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab 1 Bulk RSVP */}
            {activeTab === 'invitations' && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkRsvp(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="h-8 px-2.5 text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Set Status...</option>
                <option value="Pending Invitation">Mark Pending Invitation</option>
                <option value="Invited">Mark Invited</option>
                <option value="Confirmed">Mark Confirmed (Move to Attending)</option>
                <option value="Maybe">Mark Maybe</option>
                <option value="Declined">Mark Declined</option>
              </select>
            )}

            {/* Tab 2 Bulk Attendance Actions */}
            {activeTab === 'confirmed' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('Attended')}
                  className="h-8 px-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark All Attended</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('Did Not Attend')}
                  className="h-8 px-2.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <XCircle size={13} />
                  <span>Mark Absent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('Pending')}
                  className="h-8 px-2.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Pending
                </button>
              </div>
            )}

            {/* Tab 1 Bulk Ceremony Assign */}
            {activeTab === 'invitations' && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAssignEvent(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="h-8 px-2.5 text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Assign Ceremony...</option>
                {WEDDING_EVENTS.map(ev => (
                  <option key={ev} value={ev}>Add to {ev}</option>
                ))}
              </select>
            )}

            {/* Tab 1 Bulk Send Invitations */}
            {activeTab === 'invitations' && (
              <button
                type="button"
                onClick={() => setBulkInviteOpen(true)}
                className="h-8 px-3 text-xs font-bold bg-[#234c6a] hover:bg-[#1b3c53] text-white rounded-lg border border-[#325a77] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <Mail size={13} className="text-[#f3e5ab]" />
                <span>Send Invitations ({selectedIds.length})</span>
              </button>
            )}

            {/* Export Selected */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
            >
              Export ({selectedIds.length})
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="h-8 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* 6. Primary Table Container */}
      <div className="shadow-sm border border-zinc-200/80 flex-1 flex flex-col overflow-hidden rounded-xl bg-white">
        <div className="overflow-x-auto flex-1 w-full relative">
          
          {/* ======================= TAB 1: ALL GUESTS / INVITATIONS ======================= */}
          {activeTab === 'invitations' && (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                <tr className="text-zinc-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">GUEST</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">RELATION</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">GUEST TYPE / FAMILY</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">HEADCOUNT</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-zinc-400">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#234c6a]" />
                      <span>Loading invitations directory...</span>
                    </td>
                  </tr>
                ) : paginatedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-zinc-400">
                      <Users size={32} className="mx-auto mb-2 text-zinc-300" />
                      <p className="font-semibold text-zinc-700 text-sm">No guests found</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {isFiltersActive ? 'Try adjusting your search or filters.' : 'Add your first guest or import a CSV list.'}
                      </p>
                      {!isFiltersActive && (
                        <Button
                          radius="sm"
                          size="sm"
                          onClick={() => setIsAddOpen(true)}
                          className="mt-3 bg-zinc-900 text-white hover:bg-zinc-950 font-bold"
                        >
                          <Plus size={14} /> Add First Guest
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedGuests.map(g => {
                    const isSelected = selectedIds.includes(g.id);
                    const isConfirmed = (g.rsvp_status || '').toLowerCase() === 'confirmed';

                    const initials = g.name
                      ? g.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'G';

                    return (
                      <tr 
                        key={g.id} 
                        onClick={() => setViewGuest(g)}
                        className={`hover:bg-[#1b3c53]/[0.04] transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <td 
                          className="py-3.5 px-4 text-center" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(g.id)}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                        </td>

                        {/* Guest Info */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1b3c53] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 truncate">{g.name}</div>
                              <div className="text-xs text-zinc-500 truncate">
                                {g.phone || g.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Relation */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900 truncate">
                            {g.relationship_category || 'Family'}
                          </div>
                        </td>

                        {/* Guest Type / Family Dependents */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {Array.isArray(g.dependents) && g.dependents.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#234c6a]/10 text-[#234c6a] border border-[#234c6a]/20 w-fit">
                                <Users size={12} />
                                <span>Family (+{g.dependents.length})</span>
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                                {g.dependents.map(d => d.name).filter(Boolean).join(', ')}
                              </span>
                            </div>
                          ) : g.guest_type === 'Family' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 w-fit">
                              <Users size={12} />
                              <span>Family</span>
                            </span>
                          ) : g.guest_type === 'Couple' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 w-fit">
                              <Heart size={12} />
                              <span>Couple</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 w-fit">
                              <User size={12} />
                              <span>{g.guest_type || 'Individual'}</span>
                            </span>
                          )}
                        </td>

                        {/* Headcount */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-zinc-900 text-sm">
                              {g.expected_attendees || (Number(g.expected_adults||1) + Number(g.expected_children||0))}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {g.expected_children > 0 ? `${g.expected_adults||1}A + ${g.expected_children}C` : 'guests'}
                            </span>
                          </div>
                        </td>

                        {/* RSVP */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex flex-col items-start gap-1">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(g.rsvp_status === 'Not Responded' || !g.rsvp_status) ? 'Pending Invitation' : g.rsvp_status}
                                onChange={(e) => handleChangeRsvp(g.id, e.target.value)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-md border appearance-none pr-6 cursor-pointer outline-none transition-all shadow-2xs ${
                                  g.rsvp_status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' :
                                  g.rsvp_status === 'Maybe' ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' :
                                  g.rsvp_status === 'Declined' ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100' :
                                  g.rsvp_status === 'Invited' ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100' :
                                  'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                                }`}
                              >
                                {RSVP_STATUSES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>

                            {isConfirmed && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTabChange('confirmed');
                                }}
                                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>In Attending tab</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions Menu */}
                        <td 
                          className="py-3.5 px-4 text-right whitespace-nowrap" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GuestActionMenu
                            guest={g}
                            onView={() => setViewGuest(g)}
                            onEdit={() => setEditGuest(g)}
                            onToggleCheckIn={() => handleToggleCheckIn(g)}
                            onDelete={() => setDeleteGuest(g)}
                            onSendInvitation={() => handleOpenInviteModal(g)}
                            onDownloadPdf={() => handleDownloadPdf(g)}
                            onChangeRsvp={(status) => handleChangeRsvp(g.id, status)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* ======================= TAB 2: CONFIRMED & ATTENDING ======================= */}
          {activeTab === 'confirmed' && (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs z-10 border-b border-zinc-200/80">
                <tr className="text-zinc-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">CONFIRMED GUEST</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">GUEST TYPE / FAMILY</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">STAY PREFERENCE</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">EXPECTED</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">ACTUAL ATTENDEES</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">ATTENDANCE STATUS</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-zinc-400">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#234c6a]" />
                      <span>Loading confirmed attendees...</span>
                    </td>
                  </tr>
                ) : paginatedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-zinc-400">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                      <p className="font-semibold text-zinc-700 text-sm">No confirmed guests found</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {isFiltersActive 
                          ? 'No confirmed guests match the selected filter.' 
                          : 'When invited guests confirm attendance, they will automatically appear here.'}
                      </p>
                      <Button
                        radius="sm"
                        size="sm"
                        onClick={() => handleTabChange('invitations')}
                        className="mt-3 bg-zinc-900 text-white hover:bg-zinc-950 font-bold"
                      >
                        <Mail size={14} /> Go to Invitations Tab
                      </Button>
                    </td>
                  </tr>
                ) : (
                  paginatedGuests.map(g => {
                    const isAttended = g.actual_attendance === 'Attended' || g.check_in_status;
                    const isSelected = selectedIds.includes(g.id);
                    const expectedTotal = g.expected_attendees || (Number(g.expected_adults||1) + Number(g.expected_children||0));
                    const actualCount = isAttended ? (Number(g.actual_attendees) || expectedTotal) : 0;

                    const initials = g.name
                      ? g.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'G';

                    return (
                      <tr 
                        key={g.id} 
                        onClick={() => setViewGuest(g)}
                        className={`hover:bg-[#1b3c53]/[0.04] transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-50/40' : isAttended ? 'bg-emerald-50/15' : ''
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <td 
                          className="py-3.5 px-4 text-center" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(g.id)}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                        </td>

                        {/* Confirmed Guest Info */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 truncate">{g.name}</div>
                              <div className="text-xs text-zinc-500 truncate">
                                {g.phone || g.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Guest Type / Family Dependents */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {Array.isArray(g.dependents) && g.dependents.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#234c6a]/10 text-[#234c6a] border border-[#234c6a]/20 w-fit">
                                <Users size={12} />
                                <span>Family (+{g.dependents.length})</span>
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                                {g.dependents.map(d => d.name).filter(Boolean).join(', ')}
                              </span>
                            </div>
                          ) : g.guest_type === 'Family' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 w-fit">
                              <Users size={12} />
                              <span>Family</span>
                            </span>
                          ) : g.guest_type === 'Couple' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 w-fit">
                              <Heart size={12} />
                              <span>Couple</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 w-fit">
                              <User size={12} />
                              <span>{g.guest_type || 'Individual'}</span>
                            </span>
                          )}
                        </td>

                        {/* Stay Preference */}
                        <td 
                          className="py-3.5 px-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block">
                            <select
                              value={g.stay_preference || 'No need of stay'}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleChangeStayPreference(g.id, e.target.value);
                              }}
                              aria-label="Stay Preference"
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 transition-all ${
                                g.stay_preference === 'Hotel'
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100 font-bold'
                                  : g.stay_preference === 'Home Stay'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 font-bold'
                                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200/80 font-medium'
                              }`}
                            >
                              <option value="Hotel">🏨 Hotel</option>
                              <option value="Home Stay">🏡 Home Stay</option>
                              <option value="No need of stay">🚫 No need of stay</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
                          </div>
                        </td>

                        {/* Expected Headcount */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-zinc-800">
                          {expectedTotal}
                        </td>

                        {/* Actual Attendees (Interactive Stepper) */}
                        <td 
                          className="py-3.5 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200/80 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateAttendeesCount(g, -1)}
                              disabled={actualCount <= 0}
                              className="w-6 h-6 rounded flex items-center justify-center bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
                              title="Decrease attendees"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 font-bold text-xs text-center text-zinc-900">
                              {actualCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateAttendeesCount(g, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
                              title="Increase attendees"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Attendance Status & Check-In Action */}
                        <td 
                          className="py-3.5 px-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isAttended ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                              title="Click to reset attendance"
                            >
                              <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                              <span>Attended</span>
                            </button>
                          ) : g.actual_attendance === 'Did Not Attend' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                              title="Click to mark attended"
                            >
                              <XCircle size={13} className="text-rose-600 shrink-0" />
                              <span>Absent</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer shadow-2xs"
                              title="Mark guest attended"
                            >
                              <CheckCircle2 size={13} className="text-zinc-400" />
                              <span>Mark Attended</span>
                            </button>
                          )}
                        </td>

                        {/* Actions Menu */}
                        <td 
                          className="py-3.5 px-4 text-right whitespace-nowrap" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GuestActionMenu
                            guest={g}
                            onView={() => setViewGuest(g)}
                            onEdit={() => setEditGuest(g)}
                            onToggleCheckIn={() => handleToggleCheckIn(g)}
                            onDelete={() => setDeleteGuest(g)}
                            onSendInvitation={() => handleOpenInviteModal(g)}
                            onDownloadPdf={() => handleDownloadPdf(g)}
                            onChangeRsvp={(status) => handleChangeRsvp(g.id, status)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

        </div>

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredGuests.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Profile Slide-over Drawer */}
      <GuestProfileDrawer
        isOpen={Boolean(viewGuest)}
        onClose={() => setViewGuest(null)}
        guest={viewGuest}
        allGuests={guests}
        onEdit={(g) => { setViewGuest(null); setEditGuest(g); }}
        onToggleCheckIn={handleToggleCheckIn}
        onDelete={(g) => { setViewGuest(null); setDeleteGuest(g); }}
        onSelectGuest={(m) => setViewGuest(m)}
        onUpdateEvents={handleUpdateEvents}
        onSendInvitation={(g) => handleOpenInviteModal(g)}
        onChangeRsvp={handleChangeRsvp}
        onChangeStayPreference={handleChangeStayPreference}
      />

      {/* Add / Edit Modal */}
      <AddEditGuestModal
        isOpen={isAddOpen || Boolean(editGuest)}
        onClose={() => { setIsAddOpen(false); setEditGuest(null); }}
        onSave={handleSaveGuest}
        initialGuest={editGuest}
        existingHouseholds={existingHouseholds}
      />

      {/* Import Modal */}
      <GuestImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportBatch}
      />

      {/* Single Delete Confirmation Modal */}
      <TailwindModal
        isOpen={Boolean(deleteGuest)}
        onClose={() => setDeleteGuest(null)}
        title="Delete Guest"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Are you sure you want to remove <strong className="text-zinc-900">{deleteGuest?.name}</strong> from the guest list?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button
              radius="sm"
              variant="bordered"
              onClick={() => setDeleteGuest(null)}
              className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              radius="sm"
              onClick={handleDeleteGuest}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Guest
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Bulk Delete Confirmation Modal */}
      <TailwindModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Confirm Bulk Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Are you sure you want to permanently delete <strong className="text-zinc-900">{selectedIds.length}</strong> selected guests?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button
              radius="sm"
              variant="bordered"
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              radius="sm"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Guests`}
            </Button>
          </div>
        </div>
      </TailwindModal>

      {/* Single Send Invitation Modal */}
      <TailwindModal
        isOpen={Boolean(inviteModalGuest)}
        onClose={() => setInviteModalGuest(null)}
        title="Send Wedding Invitation"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b3c53] text-[#f3e5ab] flex items-center justify-center shrink-0 shadow-xs">
              <Mail size={20} />
            </div>
            <div className="text-xs text-zinc-700 min-w-0">
              <p className="font-bold text-zinc-900 text-sm truncate">
                Inviting {inviteModalGuest?.name}
              </p>
              <p className="text-zinc-500 mt-0.5 leading-relaxed">
                An elegant, personalized A5 Royal Wedding Invitation card (PDF) will be automatically rendered and attached to this email along with their dedicated attendance confirmation link.
              </p>
            </div>
          </div>

          {/* Email Delivery Status Banner */}
          {emailSettings?.configured ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Delivering via <strong>{emailSettings.smtp_user}</strong> ({emailSettings.provider === 'gmail' ? 'Gmail' : 'Custom SMTP'})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailSettingsOpen(true)}
                className="text-emerald-700 underline font-semibold text-[11px] hover:text-emerald-900 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Real Email Delivery Not Configured</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Emails are currently running in Sandbox Test Mode and will not be received by real guest inboxes. Connect Gmail (App Password) or custom SMTP to send real emails.
                  </p>
                </div>
              </div>
              <Button
                radius="sm"
                size="sm"
                variant="bordered"
                type="button"
                onClick={() => setIsEmailSettingsOpen(true)}
                className="bg-white border-amber-300 text-amber-900 text-xs font-bold shrink-0 hover:bg-amber-100 shadow-2xs"
              >
                Configure
              </Button>
            </div>
          )}

          <form onSubmit={handleSendInviteSubmit} className="space-y-3.5 text-xs">
            {/* Recipient Email */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. guest@example.com"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none transition-colors"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={inviteSubject}
                onChange={(e) => setInviteSubject(e.target.value)}
                placeholder="Royal Wedding Invitation..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none transition-colors"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Personal Invitation Note
              </label>
              <textarea
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Write a warm personal message..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none resize-none transition-colors"
              />
            </div>

            {/* Preview PDF card link */}
            {inviteModalGuest && (
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                  <FileText size={15} className="text-[#c59b27]" />
                  <span>Invitation Card (PDF Attachment)</span>
                </div>
                <a
                  href={`/api/guests/${inviteModalGuest.id}/invitation-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-xs text-[#1b3c53] hover:underline"
                >
                  <ExternalLink size={12} />
                  <span>Preview PDF</span>
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <Button
                radius="sm"
                variant="bordered"
                type="button"
                onClick={() => setInviteModalGuest(null)}
                className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                radius="sm"
                type="submit"
                disabled={sendingInvite}
                className="text-xs font-semibold bg-[#1b3c53] hover:bg-[#132e40] text-white disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
              >
                {sendingInvite ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Sending Invitation...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} className="text-[#f3e5ab]" />
                    <span>Send Invitation Email</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </TailwindModal>

      {/* Bulk Send Invitations Modal */}
      <TailwindModal
        isOpen={bulkInviteOpen}
        onClose={() => setBulkInviteOpen(false)}
        title="Send Bulk Wedding Invitations"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b3c53] text-[#f3e5ab] flex items-center justify-center shrink-0 shadow-xs">
              <Mail size={20} />
            </div>
            <div className="text-xs text-zinc-700 min-w-0">
              <p className="font-bold text-zinc-900 text-sm">
                Bulk Dispatch to {selectedIds.length} Selected Guests
              </p>
              <p className="text-zinc-500 mt-0.5 leading-relaxed">
                Each guest with a registered email address will receive an invitation email with their personalized Royal Wedding Invitation Card PDF attached and a custom attendance confirmation link.
              </p>
            </div>
          </div>

          {/* Email Delivery Status Banner */}
          {emailSettings?.configured ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Delivering via <strong>{emailSettings.smtp_user}</strong> ({emailSettings.provider === 'gmail' ? 'Gmail' : 'Custom SMTP'})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailSettingsOpen(true)}
                className="text-emerald-700 underline font-semibold text-[11px] hover:text-emerald-900 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Real Email Delivery Not Configured</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Bulk emails are currently running in Sandbox Test Mode and will not be received by real guest inboxes. Connect Gmail (App Password) or custom SMTP to send real emails.
                  </p>
                </div>
              </div>
              <Button
                radius="sm"
                size="sm"
                variant="bordered"
                type="button"
                onClick={() => setIsEmailSettingsOpen(true)}
                className="bg-white border-amber-300 text-amber-900 text-xs font-bold shrink-0 hover:bg-amber-100 shadow-2xs"
              >
                Configure
              </Button>
            </div>
          )}

          {/* Email Availability Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">With Email</span>
              <span className="text-base font-bold text-emerald-700">
                {guests.filter(g => selectedIds.includes(g.id) && g.email && g.email.trim()).length}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Missing Email</span>
              <span className="text-base font-bold text-amber-700">
                {guests.filter(g => selectedIds.includes(g.id) && (!g.email || !g.email.trim())).length}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Subject */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={bulkInviteSubject}
                onChange={(e) => setBulkInviteSubject(e.target.value)}
                placeholder="Royal Wedding Invitation..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none transition-colors"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Personal Note (Optional)
              </label>
              <textarea
                rows={4}
                value={bulkInviteMessage}
                onChange={(e) => setBulkInviteMessage(e.target.value)}
                placeholder="Leave blank to use the standard invitation note, or write a custom greeting..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none resize-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <Button
                radius="sm"
                variant="bordered"
                type="button"
                onClick={() => setBulkInviteOpen(false)}
                className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                radius="sm"
                type="button"
                disabled={bulkSendingInvite || guests.filter(g => selectedIds.includes(g.id) && g.email && g.email.trim()).length === 0}
                onClick={handleBulkSendInvitations}
                className="text-xs font-semibold bg-[#1b3c53] hover:bg-[#132e40] text-white disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
              >
                {bulkSendingInvite ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Sending Invitations...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} className="text-[#f3e5ab]" />
                    <span>Send {guests.filter(g => selectedIds.includes(g.id) && g.email && g.email.trim()).length} Invitations</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </TailwindModal>

      {/* Email Delivery Settings Modal */}
      <EmailSettingsModal
        isOpen={isEmailSettingsOpen}
        onClose={() => setIsEmailSettingsOpen(false)}
        onSettingsUpdated={handleEmailSettingsUpdated}
      />

    </div>
  );
}
