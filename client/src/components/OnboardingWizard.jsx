import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Calendar, MapPin, Sparkles, CheckCircle2, ChevronRight,
  ArrowLeft, Users, IndianRupee, Store, PartyPopper, Loader2,
  AlertCircle, X
} from 'lucide-react';
import { api, fmt } from '../utils/api';

// Quick popular cities
const POPULAR_CITIES = [
  'Lucknow', 'Jaipur', 'Udaipur', 'Delhi NCR', 'Mumbai',
  'Goa', 'Bangalore', 'Chandigarh', 'Kolkata', 'Hyderabad'
];

// Budget presets in INR
const BUDGET_PRESETS = [
  { label: '₹10 Lakhs', value: 1000000 },
  { label: '₹20 Lakhs', value: 2000000 },
  { label: '₹35 Lakhs', value: 3500000 },
  { label: '₹50 Lakhs', value: 5000000 },
  { label: '₹1 Crore', value: 10000000 },
];

export default function OnboardingWizard({ initialProfile, onComplete, onDismiss }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [role, setRole] = useState(initialProfile?.user_role || 'Groom');
  const [groomName, setGroomName] = useState(initialProfile?.groom_name || '');
  const [brideName, setBrideName] = useState(initialProfile?.bride_name || '');
  const [weddingDate, setWeddingDate] = useState(initialProfile?.wedding_date || '');
  const [weddingLocation, setWeddingLocation] = useState(initialProfile?.wedding_location || '');
  const [weddingLat, setWeddingLat] = useState(initialProfile?.wedding_lat || 0);
  const [weddingLng, setWeddingLng] = useState(initialProfile?.wedding_lng || 0);
  const [planningSide, setPlanningSide] = useState(initialProfile?.planning_side || 'Both');
  const [estimatedBudget, setEstimatedBudget] = useState(initialProfile?.estimated_budget || 2500000);
  const [estimatedGuests, setEstimatedGuests] = useState(initialProfile?.estimated_guests || 350);

  // Autocomplete state for location
  const [locationQuery, setLocationQuery] = useState(initialProfile?.wedding_location || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Live countdown calculation
  const countdownDays = React.useMemo(() => {
    if (!weddingDate) return null;
    const target = new Date(weddingDate);
    const now = new Date();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [weddingDate]);

  // Autocomplete debounce
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await api.autocompleteLocations(locationQuery.trim());
        setSuggestions(results || []);
        setShowDropdown(results && results.length > 0);
      } catch (e) {
        console.warn('Autocomplete error:', e);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationQuery]);

  // Click outside listener for location dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (s) => {
    setLocationQuery(s.description);
    setWeddingLocation(s.description);
    setShowDropdown(false);

    // Also fetch coordinates via placeId in background
    if (s.placeId) {
      api.saveWeddingLocation({ location: s.description, placeId: s.placeId })
        .then(loc => {
          if (loc && loc.lat) {
            setWeddingLat(loc.lat);
            setWeddingLng(loc.lng);
          }
        })
        .catch(err => console.warn('Location save warn:', err));
    }
  };

  const handleSaveFinal = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        user_role: role,
        groom_name: groomName.trim(),
        bride_name: brideName.trim(),
        wedding_date: weddingDate,
        wedding_location: weddingLocation || locationQuery,
        wedding_lat: weddingLat,
        wedding_lng: weddingLng,
        planning_side: planningSide,
        estimated_budget: Number(estimatedBudget) || 0,
        estimated_guests: Number(estimatedGuests) || 0
      };

      const res = await api.completeWeddingOnboarding(payload);
      if (onComplete) {
        onComplete(res.profile);
      }
    } catch (err) {
      setError(err.message || 'Failed to save wedding onboarding');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Celebration Progress Bar */}
        <div className="bg-gradient-to-r from-[#D97757] via-[#E9C46A] to-[#2E6F5E] h-1.5 w-full transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />

        {/* Dismiss Button (if editing existing) */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {/* ── STEP 1: The Couple ── */}
          {step === 1 && (
            <div className="animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 border border-rose-200/60 flex items-center justify-center mx-auto mb-4 text-[#D97757] shadow-sm">
                <Heart size={28} className="fill-[#D97757]/20" />
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Welcome to Marriage Manager
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Let's personalize your dream wedding experience in just 2 minutes.
                </p>
              </div>

              {/* Who are you selector */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                  Who is planning this wedding?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Groom', label: "I'm the Groom", icon: '🤵' },
                    { id: 'Bride', label: "I'm the Bride", icon: '👰' },
                    { id: 'Couple', label: "We're the Couple", icon: '💍' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setRole(item.id);
                        if (item.id === 'Groom') setPlanningSide('Groom');
                        else if (item.id === 'Bride') setPlanningSide('Bride');
                        else setPlanningSide('Both');
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        role === item.id
                          ? 'border-[#D97757] bg-rose-50/50 shadow-sm ring-2 ring-[#D97757]/20'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/60'
                      }`}
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs font-bold text-zinc-800">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Names Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Groom's Name {role === 'Groom' ? '(You)' : ''} *
                  </label>
                  <input
                    type="text"
                    value={groomName}
                    onChange={e => setGroomName(e.target.value)}
                    placeholder="e.g. Akash"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Bride's Name {role === 'Bride' ? '(You)' : ''} *
                  </label>
                  <input
                    type="text"
                    value={brideName}
                    onChange={e => setBrideName(e.target.value)}
                    placeholder="e.g. Priya"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: The Date & Countdown ── */}
          {step === 2 && (
            <div className="animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 text-[#D97757] shadow-sm">
                <Calendar size={28} />
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  When is The Big Day?
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  We'll tailor your 51-task checklist timeline and countdown to this date.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-600 mb-2">
                  Wedding Date *
                </label>
                <input
                  type="date"
                  value={weddingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setWeddingDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 text-base focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                />
              </div>

              {/* Dynamic Countdown Banner */}
              {weddingDate && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50/50 border border-rose-200/60 text-center animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D97757] mb-1">
                    <Sparkles size={14} /> Countdown to Forever
                  </div>
                  {countdownDays > 0 ? (
                    <div>
                      <div className="text-3xl font-black text-zinc-900">
                        {countdownDays} <span className="text-lg font-semibold text-zinc-600">Days to Go! 🎉</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        That's about {Math.round(countdownDays / 30)} months to get everything booked and ready!
                      </p>
                    </div>
                  ) : countdownDays === 0 ? (
                    <div className="text-2xl font-black text-[#D97757]">
                      Today is the Big Day! 🎊
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-zinc-700">
                      Celebrated on {weddingDate} ✨
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Location / Destination ── */}
          {step === 3 && (
            <div className="animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/60 flex items-center justify-center mx-auto mb-4 text-[#2E6F5E] shadow-sm">
                <MapPin size={28} />
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Where is the Wedding Happening?
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  We'll use Google Maps to discover the best venues, caterers, and photographers nearby.
                </p>
              </div>

              {/* Location Input with Autocomplete */}
              <div className="relative mb-5" ref={dropdownRef}>
                <label className="block text-xs font-bold text-zinc-600 mb-1.5">
                  Wedding City / Area / Venue *
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => {
                      setLocationQuery(e.target.value);
                      setWeddingLocation(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Search city or venue (e.g. Lucknow, Jaipur, Goa)"
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E6F5E]/30 focus:border-[#2E6F5E]"
                    autoComplete="off"
                  />
                  {loadingSuggestions && (
                    <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                  )}
                </div>

                {/* Autocomplete suggestions */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <button
                        key={s.placeId || idx}
                        type="button"
                        onClick={() => handleSelectLocation(s)}
                        className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        <MapPin size={14} className="text-[#2E6F5E] mt-1 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900 truncate">{s.mainText}</div>
                          {s.secondaryText && <div className="text-xs text-zinc-500 truncate">{s.secondaryText}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular destinations */}
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Popular Destinations</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CITIES.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setLocationQuery(city);
                        setWeddingLocation(city);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        weddingLocation.includes(city)
                          ? 'bg-[#2E6F5E] text-white border-[#2E6F5E]'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Planning Side & Budget ── */}
          {step === 4 && (
            <div className="animate-in fade-in-50 slide-in-from-right-4 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 text-[#D4AF37] shadow-sm">
                <IndianRupee size={28} />
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Budget & Planning Scope
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Which side's expenses are being tracked in this account?
                </p>
              </div>

              {/* Planning Side Selector */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-600 mb-2">
                  Planning Mode
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Groom', label: "Groom's Side", desc: 'Baraat, Groom party & guests' },
                    { id: 'Bride', label: "Bride's Side", desc: 'Mehendi, Haldi & Bride party' },
                    { id: 'Both', label: 'Joint Wedding', desc: 'Full collaborative celebration' }
                  ].map(side => (
                    <button
                      key={side.id}
                      type="button"
                      onClick={() => setPlanningSide(side.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        planningSide === side.id
                          ? 'border-[#D97757] bg-rose-50/40 ring-2 ring-[#D97757]/20'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-zinc-900">{side.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{side.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget input with quick presets */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-zinc-600">Estimated Total Budget</label>
                  <span className="text-sm font-extrabold text-[#D97757]">{fmt(estimatedBudget)}</span>
                </div>
                <input
                  type="number"
                  step="50000"
                  value={estimatedBudget}
                  onChange={e => setEstimatedBudget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {BUDGET_PRESETS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setEstimatedBudget(p.value)}
                      className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-[11px] font-semibold text-zinc-700 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1.5">Estimated Guest Count</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="number"
                    value={estimatedGuests}
                    onChange={e => setEstimatedGuests(e.target.value)}
                    placeholder="350"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Celebration & Launch ── */}
          {step === 5 && (
            <div className="text-center animate-in zoom-in-95 duration-200 py-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 text-white shadow-lg animate-bounce">
                <PartyPopper size={32} />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 mb-1">
                Your Wedding Suite is Ready! 🎉
              </h2>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
                We've configured your personalized wedding dashboard, checklist timeline, and vendor discovery.
              </p>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-emerald-50/40 p-5 rounded-2xl border border-rose-200/70 text-left shadow-xs mb-6">
                <div className="flex items-center justify-between border-b border-rose-200/50 pb-3 mb-3">
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">The Happy Couple</span>
                  <span className="text-xs font-bold text-[#D97757] bg-rose-100/60 px-2 py-0.5 rounded-full">
                    {planningSide === 'Groom' ? "🤵 Groom's Side" : planningSide === 'Bride' ? "👰 Bride's Side" : "💍 Joint Wedding"}
                  </span>
                </div>
                <div className="text-xl font-black text-zinc-900 mb-1">
                  {groomName || 'Groom'} & {brideName || 'Bride'}
                </div>
                <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs text-zinc-600 mt-2">
                  {weddingDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-[#D97757]" /> {weddingDate}
                    </span>
                  )}
                  {weddingLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#2E6F5E]" /> {weddingLocation}
                    </span>
                  )}
                  {estimatedBudget > 0 && (
                    <span className="flex items-center gap-1">
                      <IndianRupee size={13} className="text-[#D4AF37]" /> {fmt(estimatedBudget)}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 text-rose-600 text-xs bg-rose-50 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                onClick={handleSaveFinal}
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D97757] to-[#C86D51] text-white font-extrabold text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {saving ? 'Setting Up Your Wedding Suite...' : 'Enter Your Wedding Suite'}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        {step < 5 && (
          <div className="p-4 md:px-8 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                if (step === 1 && (!groomName.trim() || !brideName.trim())) {
                  setError('Please provide names for both the Groom and Bride');
                  return;
                }
                setError('');
                setStep(s => s + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#C86D51] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              Continue <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
