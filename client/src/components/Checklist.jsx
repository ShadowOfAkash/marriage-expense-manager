import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Card, Chip } from '@heroui/react';
import { 
  CheckSquare, Square, Plus, Search, Calendar, 
  Clock, Tag, User, AlertTriangle, Sparkles, 
  ChevronDown, ChevronRight, Trash2, Edit3, 
  RefreshCw, CheckCircle2, ListFilter, Printer, 
  ExternalLink, ArrowRight, Receipt, CalendarCheck, Users, 
  Layers, CheckCheck, X
} from 'lucide-react';
import { 
  api, 
  CHECKLIST_CATEGORIES, 
  TIMELINE_STAGES, 
  TASK_PRIORITIES, 
  fmt 
} from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { TailwindModal } from './TailwindModal';
import { useNavigate } from 'react-router-dom';

export default function Checklist() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // View mode: 'timeline' (by months) | 'category' (by function)
  const [viewMode, setViewMode] = useState('timeline');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'overdue'
  const [ceremonyFilter, setCeremonyFilter] = useState('all'); // 'all' | 'roka' | 'haldi' | 'mehendi' | 'sangeet' | 'vivah' | 'reception'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Collapsed accordion groups state
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Modals & Drawer
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(CHECKLIST_CATEGORIES[0]);
  const [formStage, setFormStage] = useState(TIMELINE_STAGES[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Load checklist tasks from API
  const loadChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getChecklistTasks();
      setTasks(res.tasks || []);
      setSummary(res.summary || null);
    } catch (err) {
      toast({ title: 'Failed to load checklist', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // Toggle group accordion
  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = (groupKeys) => {
    const next = {};
    groupKeys.forEach(k => { next[k] = true; });
    setCollapsedGroups(next);
  };

  // Toggle single task completion
  const handleToggleTask = async (task, e) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic local state update
      const newCompleted = !task.completed;
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        completed: newCompleted, 
        completed_at: newCompleted ? new Date().toISOString() : null 
      } : t));

      const res = await api.toggleChecklistTask(task.id);
      
      // Update with server confirmation
      setTasks(prev => prev.map(t => t.id === task.id ? res.task : t));
      
      // Refresh summary
      const completedCount = tasks.filter(t => t.id === task.id ? newCompleted : t.completed).length;
      const totalCount = tasks.length;
      setSummary(prev => prev ? ({
        ...prev,
        completed: completedCount,
        pending: totalCount - completedCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }) : null);

      toast({
        title: newCompleted ? 'Task Completed! 🌸' : 'Task Marked Pending',
        description: `"${task.title}" updated.`,
        status: newCompleted ? 'success' : 'info'
      });
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, status: 'error' });
      loadChecklist();
    }
  };

  // Open Add/Edit Modal
  const openAddModal = (defaultStage = TIMELINE_STAGES[0], defaultCategory = CHECKLIST_CATEGORIES[0]) => {
    setEditingTask(null);
    setFormTitle('');
    setFormCategory(defaultCategory);
    setFormStage(defaultStage);
    setFormDueDate('');
    setFormPriority('Medium');
    setFormAssignedTo('');
    setFormEstimatedCost('');
    setFormNotes('');
    setIsAddEditOpen(true);
  };

  const openEditModal = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setFormTitle(task.title || '');
    setFormCategory(task.category || CHECKLIST_CATEGORIES[0]);
    setFormStage(task.timeline_stage || TIMELINE_STAGES[0]);
    setFormDueDate(task.due_date || '');
    setFormPriority(task.priority || 'Medium');
    setFormAssignedTo(task.assigned_to || '');
    setFormEstimatedCost(task.estimated_cost ? String(task.estimated_cost) : '');
    setFormNotes(task.notes || '');
    setIsAddEditOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Title required', description: 'Please enter a task title.', status: 'warning' });
      return;
    }

    setSavingTask(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        timeline_stage: formStage,
        due_date: formDueDate,
        priority: formPriority,
        assigned_to: formAssignedTo.trim(),
        estimated_cost: Number(formEstimatedCost) || 0,
        notes: formNotes.trim()
      };

      if (editingTask) {
        await api.updateChecklistTask(editingTask.id, payload);
        toast({ title: 'Task Updated', description: `Saved changes to "${formTitle}".`, status: 'success' });
      } else {
        await api.createChecklistTask(payload);
        toast({ title: 'Task Created', description: `Added "${formTitle}" to your checklist.`, status: 'success' });
      }

      setIsAddEditOpen(false);
      await loadChecklist();
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, status: 'error' });
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await api.deleteChecklistTask(deletingTask.id);
      toast({ title: 'Task Removed', description: `Deleted "${deletingTask.title}".`, status: 'info' });
      setDeletingTask(null);
      if (viewingTask?.id === deletingTask.id) setViewingTask(null);
      await loadChecklist();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, status: 'error' });
    }
  };

  // Re-seed default tasks
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await api.seedChecklistTasks({ overwrite: true });
      toast({ title: 'Roadmap Re-seeded', description: 'Curated Indian wedding checklist refreshed.', status: 'success' });
      setShowSeedConfirm(false);
      await loadChecklist();
    } catch (err) {
      toast({ title: 'Seeding failed', description: err.message, status: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter tasks
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        const matchAssignee = t.assigned_to?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchAssignee && !matchCat) return false;
      }

      // Status
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (statusFilter === 'overdue') {
        if (t.completed || !t.due_date || t.due_date >= todayStr) return false;
      }

      // Category
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Ceremony Ritual Filter
      if (ceremonyFilter !== 'all') {
        const title = (t.title || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const text = `${title} ${notes} ${cat}`;
        
        if (ceremonyFilter === 'roka' && !text.includes('roka') && !text.includes('engagement') && !text.includes('sagai') && !text.includes('ring')) return false;
        if (ceremonyFilter === 'haldi' && !text.includes('haldi') && !text.includes('chuda') && !text.includes('turmeric') && !text.includes('ubtan')) return false;
        if (ceremonyFilter === 'mehendi' && !text.includes('mehendi') && !text.includes('henna') && !text.includes('mehndi')) return false;
        if (ceremonyFilter === 'sangeet' && !text.includes('sangeet') && !text.includes('dj') && !text.includes('music') && !text.includes('dance') && !text.includes('choreograph')) return false;
        if (ceremonyFilter === 'vivah' && !text.includes('vivah') && !text.includes('phera') && !text.includes('mandap') && !text.includes('baraat') && !text.includes('pandit') && !text.includes('wedding')) return false;
        if (ceremonyFilter === 'reception' && !text.includes('reception') && !text.includes('vidai') && !text.includes('doli') && !text.includes('post-wedding')) return false;
      }

      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, search, statusFilter, categoryFilter, ceremonyFilter, priorityFilter, todayStr]);

  // Group filtered tasks by Timeline Stage
  const tasksByStage = useMemo(() => {
    const groups = {};
    TIMELINE_STAGES.forEach(s => { groups[s] = []; });
    filteredTasks.forEach(t => {
      const stage = groups[t.timeline_stage] ? t.timeline_stage : 'Other';
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(t);
    });
    return groups;
  }, [filteredTasks]);

  // Group filtered tasks by Category
  const tasksByCategory = useMemo(() => {
    const groups = {};
    CHECKLIST_CATEGORIES.forEach(c => { groups[c] = []; });
    filteredTasks.forEach(t => {
      const cat = groups[t.category] ? t.category : 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [filteredTasks]);

  // Priority badge styling
  const getPriorityChip = (p) => {
    if (p === 'High') {
      return <Chip size="sm" variant="flat" className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">High</Chip>;
    }
    if (p === 'Low') {
      return <Chip size="sm" variant="flat" className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px]">Low</Chip>;
    }
    return <Chip size="sm" variant="flat" className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">Medium</Chip>;
  };

  const allVisibleGroupKeys = viewMode === 'timeline' ? Object.keys(tasksByStage) : Object.keys(tasksByCategory);

  const CEREMONY_RIBBON = [
    { id: 'all', label: 'All Rituals', icon: '✨' },
    { id: 'roka', label: 'Roka & Sagai', icon: '🌿' },
    { id: 'haldi', label: 'Haldi Rasam', icon: '💛' },
    { id: 'mehendi', label: 'Mehendi Magic', icon: '✨' },
    { id: 'sangeet', label: 'Sangeet Night', icon: '🪕' },
    { id: 'vivah', label: 'Baraat & Pheras', icon: '🔥' },
    { id: 'reception', label: 'Reception & Vidai', icon: '🥂' }
  ];

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 md:py-10 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-amber-200/70 pb-6">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9b1c1c] via-[#b91c1c] to-[#d97706] flex items-center justify-center text-amber-100 shadow-md shadow-amber-900/15 shrink-0">
              <CheckSquare size={26} className="text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight font-serif flex items-center gap-2">
                  Shaadi Roadmap & Milestones
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Sparkles size={12} className="text-amber-600" /> शुभ विवाह
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl leading-relaxed">
                Curated Indian wedding journey • Track rituals, bookings & timelines from Sagai to Vidai
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            radius="sm"
            size="sm"
            variant="bordered"
            onClick={() => window.print()}
            className="text-xs sm:text-sm font-semibold bg-white border-amber-200/80 text-zinc-700 hover:bg-amber-50/50 shadow-2xs py-2 px-3.5 rounded-xl"
          >
            <Printer size={15} />
            <span>Print Roadmap</span>
          </Button>

          <Button
            radius="sm"
            size="sm"
            variant="bordered"
            onClick={() => setShowSeedConfirm(true)}
            className="text-xs sm:text-sm font-semibold bg-white border-amber-200/80 text-zinc-700 hover:bg-amber-50/50 shadow-2xs py-2 px-3.5 rounded-xl"
          >
            <RefreshCw size={15} />
            <span>Reset Defaults</span>
          </Button>

          <Button
            radius="sm"
            size="sm"
            onClick={() => openAddModal()}
            className="text-xs sm:text-sm font-bold bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] hover:from-[#801717] hover:to-[#9b1c1c] text-white shadow-sm inline-flex items-center gap-2 cursor-pointer border border-rose-900/40 py-2.5 px-4 rounded-xl"
          >
            <Plus size={16} className="text-amber-200" />
            <span>Add Custom Task</span>
          </Button>
        </div>
      </div>

      {/* 2. Progress & Motivation Hero Card */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Progress Gauge - Royal Sindoor & Gold Theme */}
          <div className="md:col-span-2 p-7 md:p-8 bg-gradient-to-br from-[#7c1717] via-[#9b1c1c] to-[#450a0a] text-white rounded-3xl shadow-lg shadow-rose-950/10 flex flex-col justify-between border border-amber-500/30 relative overflow-hidden space-y-4">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-200 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                Royal Wedding Roadmap Progress
              </span>
              <span className="text-xs font-mono font-bold text-amber-100/90 bg-white/15 px-3 py-1 rounded-full border border-white/10">
                {summary.completed} / {summary.total} Done
              </span>
            </div>
            
            <div className="my-2 relative z-10 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl md:text-5xl font-black tracking-tight text-white font-serif">
                  {summary.percentage}%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-amber-200 flex items-center gap-1.5 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-300/30">
                  <CheckCircle2 size={15} className="text-amber-300" />
                  <span>{summary.pending} Tasks Pending</span>
                </span>
              </div>
              <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${summary.percentage}%` }}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed relative z-10 font-medium">
              {summary.percentage >= 80 
                ? '🌟 Shubh Aarambh! Incredible devotion — you are in the majestic final stretch of wedding preparations!' 
                : summary.percentage >= 40 
                ? '👍 Auspicious progress! Core venues, vendors, and invitations are harmoniously coming together.' 
                : '🌸 Shubh Shuruwat! Embark upon your auspicious wedding milestones step-by-step.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="p-7 md:p-8 bg-white border border-amber-200/70 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-semibold">
              <span className="font-bold text-zinc-700">Milestone Status</span>
              <ListFilter size={16} className="text-amber-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 my-1">
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 min-w-0">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5 truncate tracking-wider">Done</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif">{summary.completed}</span>
              </div>
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/60 min-w-0">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5 truncate tracking-wider">Pending</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-950 font-serif">{summary.pending}</span>
              </div>
            </div>
            <div className="text-xs text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-100">
              <span>Attention Needed:</span>
              <span className={`font-bold ${summary.overdue > 0 ? 'text-rose-600' : 'text-zinc-700'}`}>
                {summary.overdue > 0 ? `${summary.overdue} Overdue` : 'All on Track ✨'}
              </span>
            </div>
          </div>

          {/* Cross-Module Quick Link Card */}
          <div className="p-7 md:p-8 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-200/80 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950 mb-1.5">
                <Sparkles size={16} className="text-amber-600" />
                <span>Royal Shaadi Suite</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Connect your checklist tasks directly with your real expenses, bookings, and guests.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="flex-1 py-2 px-2.5 bg-white/95 hover:bg-white text-xs font-bold text-zinc-800 rounded-xl border border-amber-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt size={13} className="text-emerald-600" />
                <span>Kharcha</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/bookings')}
                className="flex-1 py-2 px-2.5 bg-white/95 hover:bg-white text-xs font-bold text-zinc-800 rounded-xl border border-amber-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck size={13} className="text-[#9b1c1c]" />
                <span>Vendors</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/guests')}
                className="flex-1 py-2 px-2.5 bg-white/95 hover:bg-white text-xs font-bold text-zinc-800 rounded-xl border border-amber-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users size={13} className="text-rose-600" />
                <span>Mehmaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ceremony Ritual Ribbon */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-2 min-w-max p-2 bg-white/90 border border-amber-200/70 rounded-2xl shadow-2xs">
          {CEREMONY_RIBBON.map(ribbon => (
            <button
              key={ribbon.id}
              type="button"
              onClick={() => setCeremonyFilter(ribbon.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                ceremonyFilter === ribbon.id
                  ? 'bg-gradient-to-r from-[#9b1c1c] to-[#b91c1c] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-amber-50/70'
              }`}
            >
              <span>{ribbon.icon}</span>
              <span>{ribbon.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Control & Filter Toolbar */}
      <div className="p-6 md:p-7 bg-white border border-amber-200/70 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* View Mode Switcher */}
          <div className="inline-flex p-1.5 bg-amber-50/60 border border-amber-200/50 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#9b1c1c] shadow-xs border border-amber-200/40 font-serif'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar size={14} />
              <span>Timeline View (Months)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('category')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'category'
                  ? 'bg-white text-[#9b1c1c] shadow-xs border border-amber-200/40 font-serif'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers size={14} />
              <span>Category View (Function)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search rituals, tasks, notes, assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-amber-200/70 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-[#9b1c1c] outline-none transition-colors"
            />
          </div>

          {/* Expand / Collapse All */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={expandAll}
              className="text-xs font-semibold text-zinc-600 hover:text-[#9b1c1c] underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-zinc-300">•</span>
            <button
              type="button"
              onClick={() => collapseAll(allVisibleGroupKeys)}
              className="text-xs font-semibold text-zinc-600 hover:text-[#9b1c1c] underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 mr-1">Status:</span>
            {[
              { id: 'all', label: `All (${tasks.length})` },
              { id: 'pending', label: `Pending (${tasks.filter(t => !t.completed).length})` },
              { id: 'completed', label: `Completed (${tasks.filter(t => t.completed).length})` },
              { id: 'overdue', label: `Overdue (${tasks.filter(t => !t.completed && t.due_date && t.due_date < todayStr).length})` }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === pill.id
                    ? 'bg-[#9b1c1c] text-white shadow-2xs font-bold'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Secondary Dropdowns */}
          <div className="flex items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F2] border border-amber-200/70 rounded-xl text-xs text-zinc-700 outline-none focus:border-[#9b1c1c]"
            >
              <option value="all">All Categories</option>
              {CHECKLIST_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F2] border border-amber-200/70 rounded-xl text-xs text-zinc-700 outline-none focus:border-[#9b1c1c]"
            >
              <option value="all">All Priorities</option>
              {TASK_PRIORITIES.map(p => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Task Groups (Timeline or Category) */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-amber-200/70 rounded-3xl shadow-xs">
          <RefreshCw size={26} className="animate-spin text-[#9b1c1c] mx-auto mb-3" />
          <p className="text-xs sm:text-sm font-semibold text-zinc-600">Loading your royal wedding checklist...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-16 text-center bg-white border border-amber-200/70 rounded-3xl shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <CheckSquare size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-800">No matching tasks found</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Try clearing filters or search criteria, or add a custom task.</p>
          </div>
          <Button
            radius="sm"
            size="sm"
            onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setPriorityFilter('all'); }}
            className="text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 px-4 py-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {(viewMode === 'timeline' ? TIMELINE_STAGES : CHECKLIST_CATEGORIES).map(groupName => {
            const groupTasks = viewMode === 'timeline' 
              ? (tasksByStage[groupName] || []) 
              : (tasksByCategory[groupName] || []);

            if (groupTasks.length === 0 && (search || statusFilter !== 'all' || categoryFilter !== 'all')) {
              return null; // hide empty groups during active filter
            }

            const isCollapsed = Boolean(collapsedGroups[groupName]);
            const completedCount = groupTasks.filter(t => t.completed).length;
            const totalCount = groupTasks.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div 
                key={groupName}
                className="bg-white border border-amber-200/70 rounded-3xl shadow-xs overflow-hidden transition-all hover:border-amber-300/80"
              >
                {/* Accordion Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-6 py-5 bg-[#FAF7F2] hover:bg-[#F5ECE0]/80 transition-colors flex items-center justify-between gap-4 border-b border-amber-200/50 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-amber-700/70">
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-zinc-900 tracking-tight font-serif flex items-center gap-2.5">
                        {groupName}
                        {pct === 100 && totalCount > 0 && (
                          <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCheck size={15} /> Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {completedCount} of {totalCount} tasks completed ({pct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 hidden sm:block">
                      <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-[#9b1c1c]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      radius="sm"
                      size="sm"
                      variant="flat"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (viewMode === 'timeline') openAddModal(groupName, CHECKLIST_CATEGORIES[0]);
                        else openAddModal(TIMELINE_STAGES[0], groupName);
                      }}
                      className="text-xs font-bold text-[#9b1c1c] bg-amber-100/70 hover:bg-amber-200/60 h-8 px-3 border border-amber-200/80 rounded-xl"
                    >
                      <Plus size={13} />
                      <span className="hidden sm:inline">Add Task</span>
                    </Button>
                  </div>
                </button>

                {/* Group Tasks List */}
                {!isCollapsed && (
                  <div className="divide-y divide-amber-100/60">
                    {groupTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs sm:text-sm text-zinc-400 italic">
                        No tasks in this section. Click "+ Add Task" above to add one.
                      </div>
                    ) : (
                      groupTasks.map(task => {
                        const isOverdue = !task.completed && task.due_date && task.due_date < todayStr;
                        return (
                          <div
                            key={task.id}
                            onClick={() => setViewingTask(task)}
                            className={`p-5 sm:px-6 hover:bg-amber-50/40 transition-colors flex items-start gap-4 group cursor-pointer ${
                              task.completed ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleTask(task, e)}
                              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                task.completed
                                  ? 'bg-[#9b1c1c] text-white shadow-2xs'
                                  : 'border-2 border-amber-300 hover:border-[#9b1c1c] bg-white'
                              }`}
                            >
                              {task.completed && <CheckCircle2 size={15} className="stroke-[3]" />}
                            </button>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-semibold leading-snug transition-all ${
                                  task.completed 
                                    ? 'line-through text-zinc-400' 
                                    : 'text-zinc-900'
                                }`}>
                                  {task.title}
                                </span>

                                {task.is_custom && (
                                  <Chip size="sm" variant="flat" className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold h-5">
                                    Custom
                                  </Chip>
                                )}
                              </div>

                              {/* Task Metadata row */}
                              <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-500">
                                {viewMode === 'timeline' ? (
                                  <span className="inline-flex items-center gap-1.5 text-zinc-600 font-medium">
                                    <Tag size={12} className="text-zinc-400" />
                                    <span>{task.category}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-zinc-600 font-medium">
                                    <Clock size={12} className="text-zinc-400" />
                                    <span>{task.timeline_stage}</span>
                                  </span>
                                )}

                                {task.assigned_to && (
                                  <span className="inline-flex items-center gap-1.5 text-zinc-600">
                                    <User size={12} className="text-zinc-400" />
                                    <span>{task.assigned_to}</span>
                                  </span>
                                )}

                                {task.due_date && (
                                  <span className={`inline-flex items-center gap-1.5 font-medium ${
                                    isOverdue ? 'text-rose-600 font-bold' : 'text-zinc-600'
                                  }`}>
                                    <Calendar size={12} />
                                    <span>{task.due_date}</span>
                                    {isOverdue && <span>(Overdue)</span>}
                                  </span>
                                )}

                                {task.estimated_cost > 0 && (
                                  <span className="font-mono text-zinc-700 font-semibold">
                                    Est: {fmt(task.estimated_cost)}
                                  </span>
                                )}

                                {getPriorityChip(task.priority)}
                              </div>

                              {/* Notes preview if any */}
                              {task.notes && (
                                <p className="text-xs text-zinc-400 italic line-clamp-1 pt-0.5">
                                  "{task.notes}"
                                </p>
                              )}
                            </div>

                            {/* Row Action Buttons */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                title="Edit Task"
                                onClick={(e) => openEditModal(task, e)}
                                className="p-2 text-zinc-400 hover:text-[#9b1c1c] hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                title="Delete Task"
                                onClick={(e) => { e.stopPropagation(); setDeletingTask(task); }}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Task Modal */}
      <TailwindModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingTask ? "Edit Checklist Task" : "Add Wedding Checklist Task"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Book luxury florist for Mandap decor"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              >
                {CHECKLIST_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Timeline Milestone
              </label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              >
                {TIMELINE_STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              >
              </input>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Est. Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formEstimatedCost}
                onChange={(e) => setFormEstimatedCost(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              value={formAssignedTo}
              onChange={(e) => setFormAssignedTo(e.target.value)}
              placeholder="e.g. Groom & Bride, Parents, Sister, Coordinator"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
            />
            {/* Quick Assign Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {['Couple', 'Groom', 'Bride', 'Parents', 'Siblings', 'Planner'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormAssignedTo(role)}
                  className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-[10px] font-semibold text-zinc-600 rounded-md transition-colors cursor-pointer"
                >
                  +{role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              Notes & Vendor Specs
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Add contact numbers, address, mood board links, or specific family instructions..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button
              radius="sm"
              variant="bordered"
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              radius="sm"
              type="submit"
              disabled={savingTask}
              className="text-xs font-semibold bg-[#1b3c53] hover:bg-[#132e40] text-white disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
            >
              {savingTask ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving Task...</span>
                </>
              ) : (
                <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
              )}
            </Button>
          </div>
        </form>
      </TailwindModal>

      {/* 6. Task Detail Drawer */}
      {viewingTask && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end transition-opacity"
          onClick={() => setViewingTask(null)}
        >
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* Drawer Top */}
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    {viewingTask.task_id || `TASK #${viewingTask.id}`}
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 leading-tight">
                    {viewingTask.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Toggle Card */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">
                    {viewingTask.completed ? 'Task Completed ✅' : 'Task Pending ⏳'}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {viewingTask.completed_at ? `Completed on ${new Date(viewingTask.completed_at).toLocaleDateString()}` : 'Mark as done when finished'}
                  </span>
                </div>
                <Button
                  radius="sm"
                  size="sm"
                  variant={viewingTask.completed ? "bordered" : "solid"}
                  onClick={(e) => {
                    handleToggleTask(viewingTask, e);
                    setViewingTask(prev => prev ? ({ ...prev, completed: !prev.completed }) : null);
                  }}
                  className={`text-xs font-bold ${
                    viewingTask.completed 
                      ? 'border-zinc-300 text-zinc-700 bg-white' 
                      : 'bg-emerald-600 text-white shadow-2xs'
                  }`}
                >
                  {viewingTask.completed ? 'Mark Pending' : 'Mark Done'}
                </Button>
              </div>

              {/* Details Grid */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Timeline Milestone</span>
                    <span className="font-semibold text-zinc-800 mt-0.5 block">{viewingTask.timeline_stage}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Category</span>
                    <span className="font-semibold text-zinc-800 mt-0.5 block">{viewingTask.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Target Due Date</span>
                    <span className="font-semibold text-zinc-800 mt-0.5 block">{viewingTask.due_date || 'None set'}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Assigned Person</span>
                    <span className="font-semibold text-zinc-800 mt-0.5 block">{viewingTask.assigned_to || 'Entire Family'}</span>
                  </div>
                </div>

                {viewingTask.estimated_cost > 0 && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">Estimated Budget Allocation:</span>
                    <span className="text-sm font-mono font-black text-amber-900">{fmt(viewingTask.estimated_cost)}</span>
                  </div>
                )}

                {/* Notes */}
                {viewingTask.notes ? (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Notes & Specifications</span>
                    <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {viewingTask.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400 italic text-center text-xs py-2">No additional notes written for this task.</p>
                )}
              </div>

              {/* Cross-Module Quick Actions */}
              <div className="pt-3 border-t border-zinc-100 space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Connected Modules</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingTask(null);
                      navigate('/expenses');
                    }}
                    className="p-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-zinc-800">Log Payment</span>
                    </div>
                    <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-700 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewingTask(null);
                      navigate('/bookings');
                    }}
                    className="p-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarCheck size={14} className="text-[#1b3c53]" />
                      <span className="text-xs font-bold text-zinc-800">Link Vendor</span>
                    </div>
                    <ArrowRight size={13} className="text-zinc-300 group-hover:text-zinc-700 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
              <Button
                radius="sm"
                variant="bordered"
                size="sm"
                onClick={(e) => {
                  const t = viewingTask;
                  setViewingTask(null);
                  openEditModal(t, e);
                }}
                className="text-xs font-semibold bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex-1"
              >
                <Edit3 size={13} />
                <span>Edit Task</span>
              </Button>

              <Button
                radius="sm"
                variant="bordered"
                size="sm"
                onClick={() => {
                  const t = viewingTask;
                  setViewingTask(null);
                  setDeletingTask(t);
                }}
                className="text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 px-3"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deletingTask && (
        <TailwindModal
          isOpen={true}
          onClose={() => setDeletingTask(null)}
          title="Delete Checklist Task"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-zinc-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-900">"{deletingTask.title}"</strong> from your wedding checklist?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <Button
                radius="sm"
                variant="bordered"
                size="sm"
                onClick={() => setDeletingTask(null)}
                className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                radius="sm"
                size="sm"
                onClick={handleDeleteTask}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Delete Task
              </Button>
            </div>
          </div>
        </TailwindModal>
      )}

      {/* 8. Re-seed Roadmap Confirmation Modal */}
      {showSeedConfirm && (
        <TailwindModal
          isOpen={true}
          onClose={() => setShowSeedConfirm(false)}
          title="Reset Wedding Roadmap?"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">Resetting will restore the default roadmap</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This will re-populate all 10 stages (95 standard Indian wedding tasks) according to WeddingWire best practices.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <Button
                radius="sm"
                variant="bordered"
                size="sm"
                onClick={() => setShowSeedConfirm(false)}
                className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                radius="sm"
                size="sm"
                disabled={isSeeding}
                onClick={handleSeedDefaults}
                className="text-xs font-bold bg-[#1b3c53] hover:bg-[#132e40] text-white shadow-sm"
              >
                {isSeeding ? 'Seeding...' : 'Confirm & Reset Roadmap'}
              </Button>
            </div>
          </div>
        </TailwindModal>
      )}

    </div>
  );
}
