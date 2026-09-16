import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Search, ArrowLeft, Star, Phone, Globe, ExternalLink, Clock, X,
  Send, ChevronRight, Navigation, Mail, Users, Calendar, MessageSquare,
  Loader2, AlertCircle, Store, Edit3, Filter, MapPinned, CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { api, fmt } from '../utils/api';

// ── Popular Indian Cities ────────────────────────────
const POPULAR_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Jaipur', 'Lucknow',
  'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Udaipur',
  'Ahmedabad', 'Chandigarh', 'Goa', 'Jodhpur', 'Varanasi'
];

// ── Star Rating Component ────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={13}
            className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-zinc-700">{rating?.toFixed(1) || '0.0'}</span>
      {count > 0 && <span className="text-xs text-zinc-400">({count})</span>}
    </div>
  );
}

// ── Location Setup View with Exact Dropdown Suggestions ──────────────────────────────
function LocationSetup({ onLocationSaved }) {
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Live autocomplete search with debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await api.autocompleteLocations(query.trim());
        setSuggestions(results || []);
        setShowDropdown(results && results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside closes the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = async (item) => {
    setQuery(item.description);
    setShowDropdown(false);
    setSaving(true);
    setError('');
    try {
      const result = await api.saveWeddingLocation({
        location: item.description,
        placeId: item.placeId
      });
      onLocationSaved(result);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const handleManualSave = async (locationName) => {
    const loc = locationName || query.trim();
    if (!loc) return;
    setSaving(true);
    setError('');
    setShowDropdown(false);
    try {
      const result = await api.saveWeddingLocation({ location: loc });
      onLocationSaved(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleManualSave();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleManualSave();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#234c6a] to-[#1b3c53] flex items-center justify-center mx-auto mb-5 shadow-lg">
          <MapPin size={36} className="text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-2">
          Where's Your Wedding?
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Type your wedding city or exact area below to discover vendors with live Google Maps proximity.
        </p>
      </div>

      {/* Search Input with Live Autocomplete Dropdown */}
      <div className="relative mb-6" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search location (e.g. Gomti Nagar, Lucknow or Bandra, Mumbai)"
              className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/40 focus:border-[#234c6a] shadow-sm"
              disabled={saving}
              autoComplete="off"
            />
            {loadingSuggestions && (
              <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
            )}
          </div>
          <button
            onClick={() => handleManualSave()}
            disabled={saving || !query.trim()}
            className="px-5 py-3.5 rounded-xl bg-[#234c6a] text-white font-semibold text-sm hover:bg-[#1b3c53] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {saving ? 'Finding...' : 'Set Location'}
          </button>
        </div>

        {/* Dropdown Suggestions List */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200/90 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 duration-150 divide-y divide-zinc-100">
            <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Suggested Locations</span>
              <span className="text-[10px] text-zinc-400 normal-case">Powered by Google Maps</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={item.placeId || idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                    selectedIndex === idx ? 'bg-blue-50/70 text-[#234c6a]' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#234c6a] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-900 truncate">
                      {item.mainText}
                    </div>
                    {item.secondaryText && (
                      <div className="text-xs text-zinc-500 truncate mt-0.5">
                        {item.secondaryText}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs bg-rose-50 px-3 py-2 rounded-lg">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Popular Cities */}
      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Popular Wedding Destinations</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map(city => (
            <button
              key={city}
              onClick={() => { setQuery(city); handleManualSave(city); }}
              disabled={saving}
              className="px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-[#234c6a] hover:text-white hover:border-[#234c6a] transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Category Grid View ───────────────────────────────
function CategoryGrid({ categories, location, onSelectCategory, onChangeLocation }) {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Location Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-zinc-900 mb-1">
            Vendor Categories
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
            <MapPin size={14} className="text-[#234c6a]" />
            <span>Showing vendors near <span className="font-semibold text-zinc-700">{location.location}</span></span>
            <button
              onClick={onChangeLocation}
              className="ml-1 text-[#234c6a] hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
            >
              <Edit3 size={12} /> Change
            </button>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className={`group relative flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br ${cat.color} border ${cat.border} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <h3 className="font-bold text-sm text-zinc-800 mb-1">{cat.name}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{cat.description}</p>
            <ChevronRight size={16} className="absolute top-3 right-3 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Vendor Card with Distance Indicator ──────────────────────────────────────
function VendorCard({ vendor, onSelect, onQuote }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all duration-200 group cursor-pointer flex flex-col"
      onClick={() => onSelect(vendor)}
    >
      {/* Photo */}
      <div className="relative h-44 bg-zinc-100 overflow-hidden">
        {vendor.photoUrl && !imgError ? (
          <img
            src={vendor.photoUrl}
            alt={vendor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Store size={40} className="text-zinc-300" />
          </div>
        )}
        {/* Open/Closed badge */}
        {vendor.openNow !== null && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            vendor.openNow ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
          }`}>
            {vendor.openNow ? 'Open Now' : 'Closed'}
          </div>
        )}

        {/* Distance Badge over Image */}
        {vendor.distanceText && (
          <div className="absolute bottom-2 left-2 bg-zinc-950/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
            <Navigation size={11} className="text-sky-400" />
            <span>{vendor.distanceText}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-sm text-zinc-900 mb-1 line-clamp-1 group-hover:text-[#234c6a] transition-colors">
          {vendor.name}
        </h3>
        <StarRating rating={vendor.rating} count={vendor.ratingCount} />

        {/* Distance & Address */}
        <p className="text-xs text-zinc-500 mt-2.5 line-clamp-2 flex-1">
          <MapPin size={11} className="inline mr-1 text-zinc-400 shrink-0" />
          {vendor.address}
        </p>

        {/* Contact Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-[#234c6a] transition-colors"
              title="Call"
            >
              <Phone size={12} />
              <span className="truncate max-w-[110px]">{vendor.phone}</span>
            </a>
          )}
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#234c6a] transition-colors ml-auto"
              title="Visit Website"
            >
              <Globe size={12} />
            </a>
          )}
          {vendor.mapsUrl && (
            <a
              href={vendor.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#234c6a] transition-colors"
              title="Open in Google Maps"
            >
              <Navigation size={12} />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); onQuote(vendor); }}
            className="flex-1 py-2 px-3 rounded-lg bg-[#234c6a] text-white text-xs font-semibold hover:bg-[#1b3c53] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Send size={12} /> Request Quote
          </button>
          <a
            href={vendor.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="py-2 px-3 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
          >
            <MapPinned size={12} /> Map
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Marketplace View (per category) with Radius Filters ───────────
function VendorMarketplace({ category, location, onBack, onQuote }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(20000); // Default to 20 km
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [selectedVendor, setSelectedVendor] = useState(null);

  const RADIUS_OPTIONS = [
    { meters: 5000, label: '5 km' },
    { meters: 10000, label: '10 km' },
    { meters: 20000, label: '20 km' },
    { meters: 30000, label: '30 km' },
    { meters: 50000, label: '50 km' }
  ];

  useEffect(() => {
    fetchVendors();
  }, [category, radius, sortBy]);

  const fetchVendors = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await api.searchVendors({
        category: category.id,
        lat: location.lat,
        lng: location.lng,
        radius,
        sortBy
      });
      setVendors(results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const radiusKm = radius / 1000;

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-0.5">
            <button onClick={onBack} className="hover:text-[#234c6a] cursor-pointer">Vendors</button>
            <ChevronRight size={12} />
            <span className="text-zinc-600 font-medium truncate">{category.name}</span>
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-zinc-900 truncate">
            {category.icon} {category.name}
          </h1>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-xs">
        {/* Radius Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold mr-1">
            <Filter size={14} className="text-[#234c6a]" />
            <span>Radius:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={opt.meters}
                onClick={() => setRadius(opt.meters)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  radius === opt.meters
                    ? 'bg-[#234c6a] text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Controls & Proximity Location */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setSortBy('distance')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'distance' ? 'bg-white text-[#234c6a] shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              📍 Nearest
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'rating' ? 'bg-white text-[#234c6a] shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              ⭐ Top Rated
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-zinc-400">
            <MapPin size={12} className="text-[#234c6a]" />
            <span className="truncate max-w-[180px]" title={location.location}>{location.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-[#234c6a] animate-spin mb-3" />
          <p className="text-sm text-zinc-500">Searching for {category.name.toLowerCase()} within {radiusKm} km...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle size={32} className="text-rose-400 mb-3" />
          <p className="text-sm text-rose-600 mb-3">{error}</p>
          <button
            onClick={fetchVendors}
            className="px-4 py-2 rounded-lg bg-[#234c6a] text-white text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 p-8 text-center">
          <Store size={40} className="text-zinc-300 mb-3" />
          <h3 className="text-base font-bold text-zinc-800 mb-1">
            No {category.name.toLowerCase()} found within {radiusKm} km
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            Try expanding your search radius to 20 km or 50 km to find more vendors in surrounding areas.
          </p>
          <div className="flex gap-2">
            {radius < 20000 && (
              <button
                onClick={() => setRadius(20000)}
                className="px-4 py-2 rounded-lg bg-[#234c6a] text-white text-xs font-semibold cursor-pointer"
              >
                Expand to 20 km
              </button>
            )}
            {radius < 50000 && (
              <button
                onClick={() => setRadius(50000)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
              >
                Expand to 50 km
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-600">
              Showing <span className="font-bold text-zinc-900">{vendors.length}</span> {category.name.toLowerCase()} within <span className="font-bold text-[#234c6a]">{radiusKm} km</span> of {location.location}
            </p>
            <span className="text-[11px] text-zinc-400 font-medium">
              {sortBy === 'distance' ? 'Sorted by proximity' : 'Sorted by rating'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(vendor => (
              <VendorCard
                key={vendor.placeId}
                vendor={vendor}
                onSelect={setSelectedVendor}
                onQuote={onQuote}
              />
            ))}
          </div>
        </>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onQuote={onQuote}
        />
      )}
    </div>
  );
}

// ── Vendor Detail Modal ──────────────────────────────
function VendorDetailModal({ vendor, onClose, onQuote }) {
  const [details, setDetails] = useState(vendor);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [vendor.placeId]);

  const loadDetails = async () => {
    if (!vendor.placeId) return;
    setLoading(true);
    try {
      const full = await api.getVendorDetails(vendor.placeId);
      // Preserve computed distance
      setDetails({
        ...full,
        distanceKm: vendor.distanceKm,
        distanceText: vendor.distanceText
      });
    } catch (_) {
      // Keep basic vendor data if detail fetch fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Photo Gallery */}
        {details.allPhotos && details.allPhotos.length > 0 ? (
          <div className="h-52 overflow-hidden rounded-t-2xl">
            <img
              src={details.allPhotos[0]}
              alt={details.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-t-2xl flex items-center justify-center">
            <Store size={48} className="text-zinc-300" />
          </div>
        )}

        <div className="p-5">
          {/* Name, Rating & Distance */}
          <h2 className="text-lg font-extrabold text-zinc-900 mb-1">{details.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StarRating rating={details.rating} count={details.ratingCount} />
            {details.distanceText && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#234c6a] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                <Navigation size={10} /> {details.distanceText} away
              </span>
            )}
          </div>

          {details.summary && (
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{details.summary}</p>
          )}

          {/* Contact Info Cards */}
          <div className="mt-4 space-y-2">
            {/* Address with Map */}
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
              <MapPin size={16} className="text-[#234c6a] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-700">{details.address}</p>
                <a
                  href={details.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#234c6a] hover:underline font-semibold mt-0.5 inline-flex items-center gap-0.5"
                >
                  Open in Google Maps <ExternalLink size={9} />
                </a>
              </div>
            </div>

            {details.phone && (
              <a href={`tel:${details.phone}`} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                <Phone size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-zinc-700">{details.phone}</span>
              </a>
            )}

            {details.website && (
              <a href={details.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                <Globe size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-zinc-700 truncate">{details.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                <ExternalLink size={12} className="text-zinc-400 ml-auto shrink-0" />
              </a>
            )}

            {/* Opening Hours */}
            {details.weekdayHours && details.weekdayHours.length > 0 && (
              <div className="p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-700">Opening Hours</span>
                  {details.openNow !== null && (
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      details.openNow ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {details.openNow ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {details.weekdayHours.map((h, i) => (
                    <p key={i} className="text-[11px] text-zinc-500">{h}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Embedded Google Map */}
          {details.lat && details.lng && (
            <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <iframe
                title="Vendor Location"
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${details.lat},${details.lng}&z=15&output=embed`}
              />
            </div>
          )}

          {/* Reviews */}
          {details.reviews && details.reviews.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-zinc-700 mb-2">Top Reviews</h4>
              <div className="space-y-2">
                {details.reviews.map((r, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-zinc-700">{r.author}</span>
                      <div className="flex items-center">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'} />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400 ml-auto">{r.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 line-clamp-3">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => onQuote(details)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#234c6a] text-white font-semibold text-sm hover:bg-[#1b3c53] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={14} /> Request Quotation
            </button>
            <a
              href={details.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl border border-zinc-200 text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <Navigation size={14} /> Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quote Request Modal ──────────────────────────────
function QuoteRequestModal({ vendor, onClose }) {
  const [form, setForm] = useState({
    vendorName: vendor?.name || '',
    vendorEmail: '',
    vendorPhone: vendor?.phone || '',
    userName: '',
    userEmail: '',
    userPhone: '',
    eventDate: '',
    eventType: 'Wedding',
    guestCount: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName || !form.userEmail) {
      setError('Please provide your name and email');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.requestVendorQuote(form);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900 mb-2">Quote Request Sent!</h3>
          <p className="text-sm text-zinc-500 mb-6">
            Your quotation request has been sent to <strong>{vendor.name}</strong>. They'll get back to you soon.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#234c6a] text-white font-semibold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900">Request Quotation</h3>
              <p className="text-xs text-zinc-500 mt-0.5">from {vendor.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Vendor Info (read-only) */}
            <div className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3">
              <Store size={18} className="text-zinc-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-700 truncate">{vendor.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">{vendor.address}</p>
              </div>
            </div>

            {/* Your Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Name *</label>
                <input
                  type="text"
                  value={form.userName}
                  onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Email *</label>
                <input
                  type="email"
                  value={form.userEmail}
                  onChange={e => setForm(f => ({ ...f, userEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Phone</label>
              <input
                type="tel"
                value={form.userPhone}
                onChange={e => setForm(f => ({ ...f, userPhone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30"
              />
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Event Type</label>
                <select
                  value={form.eventType}
                  onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30 bg-white"
                >
                  {['Wedding', 'Engagement', 'Mehendi', 'Haldi', 'Sangeet', 'Reception', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Event Date</label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Guests</label>
                <input
                  type="text"
                  value={form.guestCount}
                  onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))}
                  placeholder="~500"
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Message / Requirements</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Describe your requirements, budget range, preferred style..."
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#234c6a]/30 resize-none"
              />
            </div>

            {/* Vendor Contact (optional) */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
              <p className="text-[10px] font-bold text-amber-700 mb-2">Vendor's Contact (if known)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={form.vendorEmail}
                  onChange={e => setForm(f => ({ ...f, vendorEmail: e.target.value }))}
                  placeholder="vendor@email.com"
                  className="px-3 py-2 rounded-lg border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/30 bg-white"
                />
                <input
                  type="tel"
                  value={form.vendorPhone}
                  onChange={e => setForm(f => ({ ...f, vendorPhone: e.target.value }))}
                  placeholder="Phone number"
                  className="px-3 py-2 rounded-lg border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/30 bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#234c6a] text-white font-semibold text-sm hover:bg-[#1b3c53] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Quotation Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main VendorDiscovery Component ───────────────────
export default function VendorDiscovery() {
  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quoteVendor, setQuoteVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingLocation, setChangingLocation] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cats, loc] = await Promise.all([
        api.getVendorCategories(),
        api.getWeddingLocation()
      ]);
      setCategories(cats);
      setLocation(loc);
    } catch (e) {
      console.error('Failed to load vendor data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSaved = (loc) => {
    setLocation(loc);
    setChangingLocation(false);
  };

  const handleChangeLocation = () => {
    setChangingLocation(true);
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="text-[#234c6a] animate-spin mb-3" />
        <p className="text-sm text-zinc-500">Loading vendor marketplace...</p>
      </div>
    );
  }

  // Show location setup if no location or user is changing
  if (!location || changingLocation) {
    return <LocationSetup onLocationSaved={handleLocationSaved} />;
  }

  // Show vendor marketplace for a selected category
  if (selectedCategory) {
    return (
      <>
        <VendorMarketplace
          category={selectedCategory}
          location={location}
          onBack={() => setSelectedCategory(null)}
          onQuote={setQuoteVendor}
        />
        {quoteVendor && (
          <QuoteRequestModal
            vendor={quoteVendor}
            onClose={() => setQuoteVendor(null)}
          />
        )}
      </>
    );
  }

  // Default: category grid
  return (
    <>
      <CategoryGrid
        categories={categories}
        location={location}
        onSelectCategory={setSelectedCategory}
        onChangeLocation={handleChangeLocation}
      />
      {quoteVendor && (
        <QuoteRequestModal
          vendor={quoteVendor}
          onClose={() => setQuoteVendor(null)}
        />
      )}
    </>
  );
}
