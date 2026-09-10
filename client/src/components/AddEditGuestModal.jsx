import React, { useState, useEffect } from 'react';
import { TailwindModal } from './TailwindModal';
import { 
  User, Phone, Mail, Users, CalendarCheck, 
  Tag, Heart, Check, Plus, X, Building2, Home, Bed
} from 'lucide-react';
import { 
  WEDDING_EVENTS, RSVP_STATUSES, ATTENDANCE_STATUSES, 
  RELATIONSHIP_CATEGORIES, GUEST_TYPES, 
  COMMON_GUEST_TAGS, STAY_PREFERENCES
} from '../utils/api';

const DEFAULT_GUEST_FORM = {
  name: '',
  phone: '',
  email: '',
  gender: '',
  age_group: 'Adult',
  relationship_category: 'Family',
  guest_type: 'Individual',
  dependents: [],
  plus_one_allowed: false,
  plus_one_name: '',
  rsvp_status: 'Pending Invitation',
  stay_preference: 'No need of stay',
  expected_adults: 1,
  expected_children: 0,
  expected_attendees: 1,
  actual_attendance: 'Pending',
  actual_attendees: 0,
  check_in_status: false,
  events: ['Mehendi', 'Haldi', 'Wedding'],
  tags: []
};

export function AddEditGuestModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialGuest = null, 
  existingHouseholds = [] 
}) {
  const [form, setForm] = useState(DEFAULT_GUEST_FORM);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialGuest) {
      setForm({
        ...DEFAULT_GUEST_FORM,
        ...initialGuest,
        stay_preference: initialGuest.stay_preference || 'No need of stay',
        rsvp_status: (initialGuest.rsvp_status === 'Not Responded' || !initialGuest.rsvp_status) ? 'Pending Invitation' : initialGuest.rsvp_status,
        dependents: Array.isArray(initialGuest.dependents) ? initialGuest.dependents : [],
        events: Array.isArray(initialGuest.events) ? initialGuest.events : ['Mehendi', 'Haldi', 'Wedding'],
        tags: Array.isArray(initialGuest.tags) ? initialGuest.tags : []
      });
    } else {
      setForm(DEFAULT_GUEST_FORM);
    }
    setError('');
    setTagInput('');
  }, [isOpen, initialGuest]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto compute expected_attendees if adults/children change
      if (field === 'expected_adults' || field === 'expected_children') {
        const a = field === 'expected_adults' ? Number(value) : Number(prev.expected_adults || 0);
        const c = field === 'expected_children' ? Number(value) : Number(prev.expected_children || 0);
        next.expected_attendees = a + c;
      }
      return next;
    });
  };

  const handleAddDependent = () => {
    setForm(prev => {
      const current = Array.isArray(prev.dependents) ? prev.dependents : [];
      const updated = [...current, { name: '', relation: 'Spouse', age_group: 'Adult' }];
      const childCount = updated.filter(d => d.age_group === 'Child').length;
      const adultCount = 1 + updated.filter(d => d.age_group !== 'Child').length;
      return {
        ...prev,
        guest_type: prev.guest_type === 'Individual' ? 'Family' : prev.guest_type,
        dependents: updated,
        expected_adults: adultCount,
        expected_children: childCount,
        expected_attendees: adultCount + childCount
      };
    });
  };

  const handleDependentChange = (index, key, value) => {
    setForm(prev => {
      const updated = (prev.dependents || []).map((dep, idx) => {
        if (idx === index) return { ...dep, [key]: value };
        return dep;
      });
      const childCount = updated.filter(d => d.age_group === 'Child').length;
      const adultCount = 1 + updated.filter(d => d.age_group !== 'Child').length;
      return {
        ...prev,
        dependents: updated,
        expected_adults: adultCount,
        expected_children: childCount,
        expected_attendees: adultCount + childCount
      };
    });
  };

  const handleRemoveDependent = (index) => {
    setForm(prev => {
      const updated = (prev.dependents || []).filter((_, idx) => idx !== index);
      const childCount = updated.filter(d => d.age_group === 'Child').length;
      const adultCount = 1 + updated.filter(d => d.age_group !== 'Child').length;
      return {
        ...prev,
        dependents: updated,
        expected_adults: adultCount,
        expected_children: childCount,
        expected_attendees: adultCount + childCount
      };
    });
  };

  const handleEventToggle = (ev) => {
    setForm(prev => {
      const current = Array.isArray(prev.events) ? prev.events : [];
      const updated = current.includes(ev) ? current.filter(e => e !== ev) : [...current, ev];
      return { ...prev, events: updated };
    });
  };

  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim();
    if (!clean) return;
    setForm(prev => {
      const current = Array.isArray(prev.tags) ? prev.tags : [];
      if (current.includes(clean)) return prev;
      return { ...prev, tags: [...current, clean] };
    });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: (Array.isArray(prev.tags) ? prev.tags : []).filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name || !form.name.trim()) {
      setError('Please enter the guest full name.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save guest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TailwindModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialGuest ? 'Edit Guest Details' : 'Add New Wedding Guest'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg">
            {error}
          </div>
        )}

        {/* 1. Basic Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <User size={14} className="text-[#234c6a]" />
            <span>Personal & Contact Info</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Relationship Category</label>
              <select
                value={form.relationship_category}
                onChange={(e) => handleChange('relationship_category', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              >
                {RELATIONSHIP_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              >
                <option value="">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Guest Type & Dependents / Family Members */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <Users size={14} className="text-[#234c6a]" />
            <span>Guest Type & Family Members</span>
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Guest Type</label>
                <select
                  value={form.guest_type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      guest_type: val,
                      expected_adults: val === 'Couple' ? Math.max(prev.expected_adults, 2) : prev.expected_adults,
                      expected_attendees: val === 'Couple' ? Math.max(prev.expected_attendees, 2) : prev.expected_attendees
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
                >
                  <option value="Individual">Individual</option>
                  <option value="Family">Family</option>
                  <option value="Couple">Couple</option>
                  <option value="Group">Group</option>
                </select>
              </div>

              {/* Plus-one option */}
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.plus_one_allowed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleChange('plus_one_allowed', checked);
                      if (checked && form.expected_adults < 2) {
                        handleChange('expected_adults', 2);
                      }
                    }}
                    className="rounded border-zinc-300 text-[#234c6a] focus:ring-[#234c6a] w-4 h-4"
                  />
                  <span>Allow Plus-One (+1)</span>
                </label>
                {form.plus_one_allowed && (
                  <input
                    type="text"
                    value={form.plus_one_name}
                    onChange={(e) => handleChange('plus_one_name', e.target.value)}
                    placeholder="Plus-one name (optional)"
                    className="ml-3 flex-1 h-9 px-3 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
                  />
                )}
              </div>
            </div>

            {/* Multiple Dependent Guests / Family Members */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-zinc-800">Dependent Guests / Family Members</label>
                  <p className="text-[11px] text-zinc-500">Add dependents or family members attending with this person</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDependent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#234c6a] hover:bg-[#1b3c53] text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add Dependent</span>
                </button>
              </div>

              {Array.isArray(form.dependents) && form.dependents.length > 0 ? (
                <div className="space-y-2">
                  {form.dependents.map((dep, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center gap-2 shadow-2xs">
                      <input
                        type="text"
                        placeholder="Family member / Dependent name"
                        value={dep.name}
                        onChange={(e) => handleDependentChange(idx, 'name', e.target.value)}
                        className="flex-1 h-8 px-2.5 text-xs bg-zinc-50/50 rounded-md border border-zinc-200 focus:outline-none focus:border-[#234c6a]"
                      />
                      <select
                        value={dep.relation}
                        onChange={(e) => handleDependentChange(idx, 'relation', e.target.value)}
                        className="w-28 h-8 px-2 text-xs bg-zinc-50/50 rounded-md border border-zinc-200 focus:outline-none focus:border-[#234c6a]"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other">Other</option>
                      </select>
                      <select
                        value={dep.age_group}
                        onChange={(e) => handleDependentChange(idx, 'age_group', e.target.value)}
                        className="w-24 h-8 px-2 text-xs bg-zinc-50/50 rounded-md border border-zinc-200 focus:outline-none focus:border-[#234c6a]"
                      >
                        <option value="Adult">Adult</option>
                        <option value="Child">Child</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependent(idx)}
                        className="w-7 h-7 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove dependent"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white border border-dashed border-zinc-200 rounded-lg text-center text-xs text-zinc-500">
                  No dependent guests added. Click <span className="font-semibold text-[#234c6a]">"+ Add Dependent"</span> to add spouse, children, or family members.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. RSVP & Attendance */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <CalendarCheck size={14} className="text-[#234c6a]" />
            <span>Status & Attendance Tracking</span>
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Status</label>
              <select
                value={form.rsvp_status}
                onChange={(e) => handleChange('rsvp_status', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              >
                {RSVP_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Expected Adults</label>
              <input
                type="number"
                min="0"
                value={form.expected_adults}
                onChange={(e) => handleChange('expected_adults', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Expected Children</label>
              <input
                type="number"
                min="0"
                value={form.expected_children}
                onChange={(e) => handleChange('expected_children', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Total Headcount</label>
              <div className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center font-bold text-sm text-[#1b3c53]">
                {form.expected_attendees || (Number(form.expected_adults||1) + Number(form.expected_children||0))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Actual Attendance</label>
              <select
                value={form.actual_attendance}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('actual_attendance', val);
                  if (val === 'Attended') {
                    handleChange('check_in_status', true);
                    if (!form.actual_attendees || form.actual_attendees === 0) {
                      handleChange('actual_attendees', form.expected_attendees || 1);
                    }
                  } else {
                    handleChange('check_in_status', false);
                  }
                }}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              >
                {ATTENDANCE_STATUSES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Actually Attended Count</label>
              <input
                type="number"
                min="0"
                value={form.actual_attendees}
                onChange={(e) => handleChange('actual_attendees', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
            </div>

            <div className="md:col-span-2 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.check_in_status || form.actual_attendance === 'Attended')}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleChange('check_in_status', checked);
                    if (checked) {
                      handleChange('actual_attendance', 'Attended');
                      if (!form.actual_attendees) handleChange('actual_attendees', form.expected_attendees || 1);
                    }
                  }}
                  className="rounded border-zinc-300 text-[#234c6a] focus:ring-[#234c6a] w-4 h-4"
                />
                <span>Guest Attended</span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. Stay / Accommodation Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Building2 size={14} className="text-[#234c6a]" />
              <span>Stay / Accommodation Preference</span>
            </h4>
            <span className="text-[11px] font-medium text-zinc-500">Do they need stay arrangements?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'Hotel',
                label: 'Hotel',
                desc: 'Hotel room arrangement required',
                icon: Building2
              },
              {
                id: 'Home Stay',
                label: 'Home Stay',
                desc: 'Stay at family / home accommodation',
                icon: Home
              },
              {
                id: 'No need of stay',
                label: 'No need of stay',
                desc: 'Local guest / self-arranged stay',
                icon: Bed
              }
            ].map(opt => {
              const isSelected = (form.stay_preference || 'No need of stay') === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('stay_preference', opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-[#234c6a] bg-blue-50/40 shadow-xs ring-1 ring-[#234c6a]'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#234c6a] text-white' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#234c6a] text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500 pl-9">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Wedding Events Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <CalendarCheck size={14} className="text-[#234c6a]" />
            <span>Assigned Ceremonies & Events</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEDDING_EVENTS.map(ev => {
              const checked = Array.isArray(form.events) && form.events.includes(ev);
              return (
                <button
                  key={ev}
                  type="button"
                  onClick={() => handleEventToggle(ev)}
                  className={`p-2.5 rounded-xl border text-center font-semibold text-xs transition-all cursor-pointer ${
                    checked 
                      ? 'bg-[#234c6a] text-white border-[#234c6a] shadow-xs' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {ev}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Guest Tags */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
            <Tag size={14} className="text-[#234c6a]" />
            <span>Tags</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Add Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag (e.g. VIP, Close Family, College) and press Add or Enter..."
                className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a]"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 h-10 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
              >
                Add Tag
              </button>
            </div>

            {/* Tag Suggestions & Selected */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center min-h-6">
              {Array.isArray(form.tags) && form.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#234c6a]/10 text-[#1b3c53] border border-[#234c6a]/20">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick suggestions */}
            <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1 flex-wrap">
              <span className="font-medium">Quick add:</span>
              {COMMON_GUEST_TAGS.filter(t => !form.tags?.includes(t)).slice(0, 6).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200 transition-colors cursor-pointer"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-[#234c6a] hover:bg-[#1b3c53] text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : (initialGuest ? 'Save Changes' : 'Add Guest')}
          </button>
        </div>
      </form>
    </TailwindModal>
  );
}
