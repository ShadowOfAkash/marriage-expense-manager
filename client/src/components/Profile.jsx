import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from '@heroui/react';
import { 
  Heart, Camera, Upload, Sparkles, Calendar, MapPin, 
  IndianRupee, Users, CheckCircle2, AlertCircle, 
  Save, Eye, Image as ImageIcon, ArrowRight, Check
} from 'lucide-react';
import { api, fmt } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

// Indian Wedding Curated Preset Avatars & Backdrops
const GROOM_PRESETS = [
  { id: 'groom_royal', label: 'Royal Sherwani', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80' },
  { id: 'groom_pagdi', label: 'Golden Pagdi', url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=400&q=80' },
  { id: 'groom_classic', label: 'Classic Kurta', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
];

const BRIDE_PRESETS = [
  { id: 'bride_lehanga', label: 'Sindoor Lehanga', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80' },
  { id: 'bride_pastel', label: 'Pastel Zari', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { id: 'bride_mehendi', label: 'Henna & Gold', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
];

const COVER_PRESETS = [
  { id: 'palace', label: 'Udaipur Palace', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
  { id: 'mandap', label: 'Marigold Mandap', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' },
  { id: 'royal_lights', label: 'Fairytale Lights', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80' },
];

const POPULAR_DESTINATIONS = [
  'Udaipur, Rajasthan',
  'Jaipur, Rajasthan',
  'Goa Beach Destination',
  'New Delhi / NCR',
  'Mumbai, Maharashtra',
  'Lucknow, Uttar Pradesh',
  'Jim Corbett, Uttarakhand',
  'Bengaluru, Karnataka'
];

export default function Profile({ weddingProfile: externalProfile, onProfileUpdated }) {
  const toast = useToast();
  const groomFileRef = useRef(null);
  const brideFileRef = useRef(null);
  const coverFileRef = useRef(null);

  const [loading, setLoading] = useState(!externalProfile);
  const [saving, setSaving] = useState(false);
  const [uploadingGroom, setUploadingGroom] = useState(false);
  const [uploadingBride, setUploadingBride] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    groom_name: '',
    bride_name: '',
    user_role: 'Groom',
    planning_side: 'Both',
    wedding_date: '',
    wedding_location: '',
    estimated_budget: '',
    estimated_guests: '',
    story_title: '',
    groom_photo_url: '',
    bride_photo_url: '',
    cover_photo_url: '',
  });

  useEffect(() => {
    if (externalProfile) {
      setFormData({
        groom_name: externalProfile.groom_name || '',
        bride_name: externalProfile.bride_name || '',
        user_role: externalProfile.user_role || 'Groom',
        planning_side: externalProfile.planning_side || 'Both',
        wedding_date: externalProfile.wedding_date || '',
        wedding_location: externalProfile.wedding_location || '',
        estimated_budget: externalProfile.estimated_budget ? String(externalProfile.estimated_budget) : '',
        estimated_guests: externalProfile.estimated_guests ? String(externalProfile.estimated_guests) : '',
        story_title: externalProfile.story_title || '',
        groom_photo_url: externalProfile.groom_photo_url || '',
        bride_photo_url: externalProfile.bride_photo_url || '',
        cover_photo_url: externalProfile.cover_photo_url || '',
      });
      setLoading(false);
    } else {
      setLoading(true);
      api.getWeddingProfile()
        .then(prof => {
          if (prof) {
            setFormData({
              groom_name: prof.groom_name || '',
              bride_name: prof.bride_name || '',
              user_role: prof.user_role || 'Groom',
              planning_side: prof.planning_side || 'Both',
              wedding_date: prof.wedding_date || '',
              wedding_location: prof.wedding_location || '',
              estimated_budget: prof.estimated_budget ? String(prof.estimated_budget) : '',
              estimated_guests: prof.estimated_guests ? String(prof.estimated_guests) : '',
              story_title: prof.story_title || '',
              groom_photo_url: prof.groom_photo_url || '',
              bride_photo_url: prof.bride_photo_url || '',
              cover_photo_url: prof.cover_photo_url || '',
            });
          }
        })
        .catch(err => console.error('Failed to load profile:', err))
        .finally(() => setLoading(false));
    }
  }, [externalProfile]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Upload Photo handler (supporting base64 local server upload)
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'groom' ? setUploadingGroom : type === 'bride' ? setUploadingBride : setUploadingCover;
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await api.uploadWeddingPhoto({
            file: reader.result,
            filename: file.name,
            type: type
          });
          if (res.url) {
            const fieldName = type === 'groom' ? 'groom_photo_url' : type === 'bride' ? 'bride_photo_url' : 'cover_photo_url';
            handleChange(fieldName, res.url);
            toast({
              title: `${type === 'groom' ? 'Groom' : type === 'bride' ? 'Bride' : 'Cover'} Photo Uploaded!`,
              status: 'success'
            });
          }
        } catch (err) {
          toast({ title: 'Upload Failed', description: err.message, status: 'error' });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      toast({ title: 'Error reading file', description: err.message, status: 'error' });
    }
  };

  // Profile Completeness Calculation
  const completionItems = [
    { label: 'Groom Name', done: Boolean(formData.groom_name.trim()), weight: 15 },
    { label: 'Bride Name', done: Boolean(formData.bride_name.trim()), weight: 15 },
    { label: 'Groom Photo', done: Boolean(formData.groom_photo_url), weight: 15 },
    { label: 'Bride Photo', done: Boolean(formData.bride_photo_url), weight: 15 },
    { label: 'Muhurat Date', done: Boolean(formData.wedding_date), weight: 15 },
    { label: 'Destination City', done: Boolean(formData.wedding_location.trim()), weight: 15 },
    { label: 'Cover / Story', done: Boolean(formData.cover_photo_url || formData.story_title.trim()), weight: 10 }
  ];

  const completionPercent = completionItems.reduce((acc, item) => acc + (item.done ? item.weight : 0), 0);

  // Save handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        estimated_budget: Number(formData.estimated_budget) || 0,
        estimated_guests: Number(formData.estimated_guests) || 0,
        onboarding_completed: 1
      };

      const saved = await api.saveWeddingProfile(payload);
      toast({
        title: 'Wedding Profile Saved!',
        description: 'Your couple portraits and details are now live across your portal.',
        status: 'success'
      });

      if (onProfileUpdated) {
        onProfileUpdated(saved);
      }
    } catch (err) {
      toast({ title: 'Failed to save profile', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Days Countdown Calculation
  const countdownDays = (() => {
    if (!formData.wedding_date) return null;
    const diff = new Date(formData.wedding_date) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const sideBadgeText = formData.planning_side === 'Groom'
    ? 'Ladkewale 🎩'
    : formData.planning_side === 'Bride'
    ? 'Ladkiwale 👰'
    : 'Joint Vivah 💍';

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#9b1c1c] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-medium">Opening Couple Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 md:py-10 max-w-6xl mx-auto min-h-screen space-y-10 animate-in fade-in duration-200">
      
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-amber-200/70 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <Sparkles size={13} className="text-amber-600" />
              <span>शुभ विवाह प्रोफ़ाइल</span>
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-3 py-1 rounded-full">
              {sideBadgeText}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-zinc-900 font-serif tracking-tight">
            Couple Profile & Wedding Vibe
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Upload bride & groom portraits, configure Muhurat date, and personalize your grand celebration theme.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9b1c1c] via-[#b91c1c] to-[#d97706] hover:from-[#801717] hover:to-[#9b1c1c] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 self-stretch sm:self-auto justify-center"
        >
          <Save size={16} className="text-amber-200" />
          <span>{saving ? 'Saving Profile...' : 'Save & Apply Live'}</span>
        </button>
      </div>

      {/* ── 2. Live Vibe Card Preview ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
          <span className="flex items-center gap-2">
            <Eye size={14} className="text-[#9b1c1c]" /> Live Portal Preview
          </span>
          <span className="text-xs font-semibold text-amber-800 lowercase">
            as seen on your dashboard & hero
          </span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 shadow-md bg-zinc-900 text-white min-h-[260px] flex flex-col justify-end p-8 md:p-10 lg:p-12">
          {/* Background Cover Image with Romantic Gradient */}
          {formData.cover_photo_url ? (
            <img 
              src={formData.cover_photo_url} 
              alt="Wedding Cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-45 transform hover:scale-105 transition-transform duration-700 pointer-events-none" 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#9b1c1c] via-[#7a1414] to-[#2c0b0b] opacity-90" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

          {/* Foreground Couple Showcase */}
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Dual Portraits with Ornate Gold Border & Rings Connector */}
              <div className="flex items-center justify-center -space-x-4 sm:-space-x-5">
                {/* Groom Avatar */}
                <div className="relative group">
                  <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-amber-200 font-serif font-black text-2xl sm:text-3xl">
                      {formData.groom_photo_url ? (
                        <img src={formData.groom_photo_url} alt="Groom" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formData.groom_name ? formData.groom_name[0].toUpperCase() : '🤵'}</span>
                      )}
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-amber-300 text-[10px] font-bold text-amber-200 whitespace-nowrap shadow-xs">
                    वर • Groom
                  </span>
                </div>

                {/* Auspicious Connector Heart */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-[#9b1c1c] border-2 border-amber-300 text-white flex items-center justify-center shadow-lg transform -translate-y-1">
                  <Heart size={16} className="fill-white animate-pulse" />
                </div>

                {/* Bride Avatar */}
                <div className="relative group">
                  <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full p-1 bg-gradient-to-tr from-rose-400 via-amber-200 to-rose-500 shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-rose-200 font-serif font-black text-2xl sm:text-3xl">
                      {formData.bride_photo_url ? (
                        <img src={formData.bride_photo_url} alt="Bride" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formData.bride_name ? formData.bride_name[0].toUpperCase() : '👰'}</span>
                      )}
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-rose-300 text-[10px] font-bold text-rose-200 whitespace-nowrap shadow-xs">
                    वधू • Bride
                  </span>
                </div>
              </div>

              {/* Names & Wedding Subtitle */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                    {sideBadgeText}
                  </span>
                  {formData.wedding_location && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                      <MapPin size={12} className="text-emerald-400" />
                      <span>{formData.wedding_location}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white drop-shadow-md">
                  {formData.groom_name && formData.bride_name
                    ? `${formData.groom_name} & ${formData.bride_name}`
                    : (formData.story_title || 'Akash & Priya Vivah')}
                </h2>

                <p className="text-xs sm:text-sm text-amber-100/90 mt-1 flex items-center justify-center md:justify-start gap-2">
                  <Calendar size={14} className="text-amber-400" />
                  <span>
                    {formData.wedding_date
                      ? new Date(formData.wedding_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Set your Muhurat date below'}
                  </span>
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            {countdownDays !== null && (
              <div className="bg-white/15 backdrop-blur-md border border-amber-200/40 rounded-2xl px-6 py-4 text-center shadow-lg min-w-[160px]">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-0.5">
                  Auspicious Muhurat
                </div>
                <div className="text-2xl sm:text-3xl font-black font-serif text-white">
                  {countdownDays > 0 ? (
                    <>
                      {countdownDays} <span className="text-xs font-semibold text-amber-200">Days to Go 🎉</span>
                    </>
                  ) : (
                    <span>Today! 🎊</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Profile Completion Status Bar ── */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black font-serif text-zinc-900 flex items-center gap-2.5">
              <Sparkles size={18} className="text-amber-500" />
              <span>Wedding Profile Completeness</span>
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
              Personalize each milestone to unlock the complete Indian wedding suite experience
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl font-black font-serif text-[#9b1c1c]">
              {completionPercent}%
            </span>
            <span className="text-xs text-zinc-400 ml-1.5 font-semibold">Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 via-[#b91c1c] to-[#9b1c1c] h-full rounded-full transition-all duration-700 shadow-xs" 
            style={{ width: `${completionPercent}%` }} 
          />
        </div>

        {/* Milestone Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {completionItems.map((item, idx) => (
            <div 
              key={idx}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                item.done 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-center mb-1.5">
                {item.done ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-zinc-300" />
                )}
              </div>
              <div className="text-[11px] font-bold truncate">{item.label}</div>
              <div className="text-[10px] mt-0.5 font-medium">
                {item.done ? 'Ready' : `+${item.weight}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Photo Management Studio (Bride, Groom & Cover) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Groom Photo Card */}
        <Card className="p-6 md:p-8 border border-amber-200/80 rounded-3xl bg-white shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">🤵</span>
                <span>वर (Groom) Photo</span>
              </span>
              {formData.groom_photo_url && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={11} /> Active
                </span>
              )}
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-md mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-zinc-400">
                  {formData.groom_photo_url ? (
                    <img src={formData.groom_photo_url} alt="Groom" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={40} className="text-zinc-300" />
                  )}
                </div>
              </div>

              <input 
                ref={groomFileRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'groom')} 
              />

              <Button
                radius="sm"
                className="bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs shadow-2xs cursor-pointer w-full py-2.5"
                onClick={() => groomFileRef.current?.click()}
                isLoading={uploadingGroom}
              >
                <Upload size={14} className="text-amber-700" />
                <span>{formData.groom_photo_url ? 'Change Groom Photo' : 'Upload Groom Photo'}</span>
              </Button>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Or Image URL</label>
              <input 
                type="url"
                value={formData.groom_photo_url}
                onChange={(e) => handleChange('groom_photo_url', e.target.value)}
                placeholder="https://.../groom.jpg"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Curated Presets */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Preset Avatars</label>
              <div className="grid grid-cols-3 gap-2.5">
                {GROOM_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleChange('groom_photo_url', preset.url)}
                    className="p-1.5 rounded-xl border border-amber-200/60 hover:border-amber-400 hover:scale-105 transition-all text-center cursor-pointer group bg-zinc-50/50"
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-14 rounded-lg object-cover mb-1.5" />
                    <span className="text-[10px] font-semibold text-zinc-600 block truncate group-hover:text-amber-900">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Bride Photo Card */}
        <Card className="p-6 md:p-8 border border-amber-200/80 rounded-3xl bg-white shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">👰</span>
                <span>वधू (Bride) Photo</span>
              </span>
              {formData.bride_photo_url && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={11} /> Active
                </span>
              )}
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-rose-400 to-amber-200 shadow-md mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-zinc-400">
                  {formData.bride_photo_url ? (
                    <img src={formData.bride_photo_url} alt="Bride" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={40} className="text-zinc-300" />
                  )}
                </div>
              </div>

              <input 
                ref={brideFileRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'bride')} 
              />

              <Button
                radius="sm"
                className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-900 font-bold text-xs shadow-2xs cursor-pointer w-full py-2.5"
                onClick={() => brideFileRef.current?.click()}
                isLoading={uploadingBride}
              >
                <Upload size={14} className="text-rose-700" />
                <span>{formData.bride_photo_url ? 'Change Bride Photo' : 'Upload Bride Photo'}</span>
              </Button>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Or Image URL</label>
              <input 
                type="url"
                value={formData.bride_photo_url}
                onChange={(e) => handleChange('bride_photo_url', e.target.value)}
                placeholder="https://.../bride.jpg"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            {/* Curated Presets */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Preset Avatars</label>
              <div className="grid grid-cols-3 gap-2.5">
                {BRIDE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleChange('bride_photo_url', preset.url)}
                    className="p-1.5 rounded-xl border border-rose-200/60 hover:border-rose-400 hover:scale-105 transition-all text-center cursor-pointer group bg-zinc-50/50"
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-14 rounded-lg object-cover mb-1.5" />
                    <span className="text-[10px] font-semibold text-zinc-600 block truncate group-hover:text-rose-900">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Wedding Cover Banner Card */}
        <Card className="p-6 md:p-8 border border-amber-200/80 rounded-3xl bg-white shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={15} className="text-[#9b1c1c]" />
                <span>Wedding Cover Theme</span>
              </span>
              {formData.cover_photo_url && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={11} /> Custom
                </span>
              )}
            </div>

            {/* Banner Thumbnail */}
            <div className="mb-6">
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 relative mb-4 shadow-inner">
                {formData.cover_photo_url ? (
                  <img src={formData.cover_photo_url} alt="Cover Theme" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                    Default Royal Palace
                  </div>
                )}
              </div>

              <input 
                ref={coverFileRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'cover')} 
              />

              <Button
                radius="sm"
                className="bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs shadow-2xs cursor-pointer w-full py-2.5"
                onClick={() => coverFileRef.current?.click()}
                isLoading={uploadingCover}
              >
                <Upload size={14} className="text-zinc-600" />
                <span>Upload Custom Backdrop</span>
              </Button>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Or Image URL</label>
              <input 
                type="url"
                value={formData.cover_photo_url}
                onChange={(e) => handleChange('cover_photo_url', e.target.value)}
                placeholder="https://.../mandap.jpg"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Curated Palace & Mandap Backdrops */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Preset Themes</label>
              <div className="grid grid-cols-3 gap-2.5">
                {COVER_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleChange('cover_photo_url', preset.url)}
                    className="p-1.5 rounded-xl border border-zinc-200 hover:border-amber-400 hover:scale-105 transition-all text-center cursor-pointer group bg-zinc-50/50"
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-14 rounded-lg object-cover mb-1.5" />
                    <span className="text-[10px] font-semibold text-zinc-600 block truncate group-hover:text-amber-900">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 5. Wedding Details Form ── */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-8 md:p-10 lg:p-12 shadow-xs space-y-8">
        <div>
          <h3 className="text-lg md:text-xl font-black font-serif text-zinc-900 mb-1.5 flex items-center gap-2.5">
            <span className="text-xl">💍</span>
            <span>Auspicious Ceremony & Couple Information</span>
          </h3>
          <p className="text-xs md:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Set up planning sides, expected guests, budget allocation, and Muhurat timeline.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Couple Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                🤵 Groom's Full Name (वर)
              </label>
              <input 
                type="text"
                required
                value={formData.groom_name}
                onChange={(e) => handleChange('groom_name', e.target.value)}
                placeholder="e.g. Akash Tiwari"
                className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif font-bold text-zinc-900 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                👰 Bride's Full Name (वधू)
              </label>
              <input 
                type="text"
                required
                value={formData.bride_name}
                onChange={(e) => handleChange('bride_name', e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-serif font-bold text-zinc-900 transition-all"
              />
            </div>
          </div>

          {/* Planning Side Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Who is managing this portal? (Planning Side)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'Groom', label: "Groom's Side (Ladkewale)", icon: '🎩', desc: 'Manage Baraat, groom attire & family invites' },
                { id: 'Bride', label: "Bride's Side (Ladkiwale)", icon: '👰', desc: 'Manage Vidai, Mehendi, jewelry & hospitality' },
                { id: 'Both',  label: "Joint Vivah (Both Sides)", icon: '💍', desc: 'Combined budget, unified guests & shared checklist' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('planning_side', opt.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    formData.planning_side === opt.id
                      ? 'border-[#9b1c1c] bg-rose-50/50 shadow-xs ring-2 ring-[#9b1c1c]/20'
                      : 'border-zinc-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{opt.icon}</span>
                    {formData.planning_side === opt.id && (
                      <span className="w-6 h-6 rounded-full bg-[#9b1c1c] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{opt.label}</div>
                    <div className="text-xs text-zinc-500 mt-1 leading-snug">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wedding Date & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                📅 Auspicious Muhurat (Wedding Date)
              </label>
              <input 
                type="date"
                value={formData.wedding_date}
                onChange={(e) => handleChange('wedding_date', e.target.value)}
                className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-zinc-900 cursor-pointer transition-all"
              />
              {countdownDays !== null && (
                <p className="text-xs text-amber-800 mt-2 font-semibold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>{countdownDays} days until your sacred pheras</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                📍 Wedding Destination / City
              </label>
              <input 
                type="text"
                value={formData.wedding_location}
                onChange={(e) => handleChange('wedding_location', e.target.value)}
                placeholder="e.g. Udaipur, Rajasthan"
                className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-zinc-900 transition-all"
              />

              {/* Popular Indian Wedding Cities */}
              <div className="flex flex-wrap gap-2 pt-2">
                {POPULAR_DESTINATIONS.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleChange('wedding_location', city)}
                    className="text-xs px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer font-medium"
                  >
                    {city.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Budget & Expected Guests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                💰 Total Estimated Budget (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-base">₹</span>
                <input 
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.estimated_budget}
                  onChange={(e) => handleChange('estimated_budget', e.target.value)}
                  placeholder="2500000"
                  className="w-full pl-9 pr-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif font-bold text-zinc-900 transition-all"
                />
              </div>
              {formData.estimated_budget && (
                <p className="text-xs text-zinc-400 mt-1.5">
                  Formatted: <span className="font-bold text-zinc-700">{fmt(Number(formData.estimated_budget))}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                👥 Expected Mehmaan (Guest Count)
              </label>
              <input 
                type="number"
                min="0"
                value={formData.estimated_guests}
                onChange={(e) => handleChange('estimated_guests', e.target.value)}
                placeholder="350"
                className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-zinc-900 transition-all"
              />
              <p className="text-xs text-zinc-400 mt-1.5">
                Used for catering estimates & banquet capacity planning
              </p>
            </div>
          </div>

          {/* Story Title / Hashtag */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              ✨ Wedding Title / Hashtag
            </label>
            <input 
              type="text"
              value={formData.story_title}
              onChange={(e) => handleChange('story_title', e.target.value)}
              placeholder="e.g. #AkashWedsPriya • A Royal Udaipur Celebration"
              className="w-full px-4.5 py-3.5 text-sm md:text-base bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif font-bold text-zinc-900 transition-all"
            />
          </div>

          {/* Bottom Action */}
          <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#9b1c1c] via-[#b91c1c] to-[#d97706] hover:from-[#801717] hover:to-[#9b1c1c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={18} className="text-amber-200" />
              <span>{saving ? 'Saving Changes...' : 'Save Wedding Profile'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
