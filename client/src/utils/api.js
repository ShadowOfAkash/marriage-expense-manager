import { auth, createMockUser } from '../contexts/AuthContext';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('api_server_url');
    if (custom) return custom.replace(/\/+$/, '');
    
    // When running inside native Capacitor/iOS webview
    if (window.location.protocol.startsWith('capacitor') || window.location.protocol.startsWith('ionic') || window.location.protocol === 'file:') {
      return 'http://192.168.1.4:3000';
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '';
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const fetchWithAuth = async (url, options = {}) => {
  let token = '';
  if (auth && auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn('getIdToken error:', e);
    }
  }
  if (!token && typeof window !== 'undefined') {
    const savedUserEmail = localStorage.getItem('mock_user_email');
    if (savedUserEmail) {
      try {
        token = await createMockUser(savedUserEmail).getIdToken();
      } catch (e) {
        console.warn('Mock getIdToken error:', e);
      }
    }
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  const baseUrl = getApiBaseUrl();
  const targetUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const res = await fetch(targetUrl, { ...options, headers });
  return handleResponse(res);
};

export const api = {
  // VENDORS & BOOKINGS
  getBookings:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/bookings${q ? `?${q}` : ''}`);
  },
  addBooking:    (data)   => fetchWithAuth('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => fetchWithAuth(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateBookingStage: (id, stage) => fetchWithAuth(`/api/bookings/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  toggleBookingFavorite: (id) => fetchWithAuth(`/api/bookings/${id}/favorite`, { method: 'PATCH' }),
  deleteBooking: (id)     => fetchWithAuth(`/api/bookings/${id}`, { method: 'DELETE' }),
  getVendorSummary: ()    => fetchWithAuth('/api/bookings/summary'),
  getVendorCallSheet: ()  => fetchWithAuth('/api/bookings/call-sheet'),
  getMarketplaceVendors: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/bookings/marketplace${q ? `?${q}` : ''}`);
  },
  shortlistMarketplaceVendor: (vendorId, customQuote) => fetchWithAuth('/api/bookings/marketplace/shortlist', { method: 'POST', body: JSON.stringify({ vendorId, customQuote }) }),

  // Telegram
  generateTelegramCode: () => fetchWithAuth('/api/telegram/link-code', { method: 'POST' }),
  getTelegramStatus:    () => fetchWithAuth('/api/telegram/status'),
  setTelegramId:        (telegramId) => fetchWithAuth('/api/telegram/set-id', { method: 'POST', body: JSON.stringify({ telegramId }) }),
  disconnectTelegram:   () => fetchWithAuth('/api/telegram/disconnect', { method: 'POST' }),
  // Budget
  getBudget:  ()       => fetchWithAuth('/api/budget'),
  saveBudget: (amount) => fetchWithAuth('/api/budget', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Summary
  getSummary: () => fetchWithAuth('/api/summary'),

  // Expenses / Payments
  getExpenses:    ()       => fetchWithAuth('/api/payments'),
  getCategories:  ()       => fetchWithAuth('/api/payments/categories'),
  addExpense:     (data)   => fetchWithAuth('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense:  (id, data) => fetchWithAuth(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  detachExpense:  (id) => fetchWithAuth(`/api/payments/${id}/detach`, { method: 'POST' }),
  deleteExpense:  (id) => fetchWithAuth(`/api/payments/${id}`, { method: 'DELETE' }),
  scanReceipt: (image, mimeType) => fetchWithAuth('/api/payments/scan', { method: 'POST', body: JSON.stringify({ image, mimeType }) }),
  uploadDocument: (fileBase64, filename) => fetchWithAuth('/api/upload', { method: 'POST', body: JSON.stringify({ file: fileBase64, filename }) }),
  // Direct Payment aliases
  getPayments:    ()       => fetchWithAuth('/api/payments'),
  addPayment:     (data)   => fetchWithAuth('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment:  (id, data) => fetchWithAuth(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  detachPayment:  (id) => fetchWithAuth(`/api/payments/${id}/detach`, { method: 'POST' }),
  deletePayment:  (id) => fetchWithAuth(`/api/payments/${id}`, { method: 'DELETE' }),

  // Savings
  getSavings:    ()     => fetchWithAuth('/api/savings'),
  addSavings:    (data) => fetchWithAuth('/api/savings', { method: 'POST', body: JSON.stringify(data) }),
  deleteSavings: (id)   => fetchWithAuth(`/api/savings/${id}`, { method: 'DELETE' }),

  // GUESTS
  getGuests:        (params = '') => fetchWithAuth(`/api/guests${params}`),
  getGuestSummary:  ()            => fetchWithAuth('/api/guests/summary'),
  addGuest:         (data)        => fetchWithAuth('/api/guests', { method: 'POST', body: JSON.stringify(data) }),
  updateGuest:      (id, data)    => fetchWithAuth(`/api/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGuest:      (id)          => fetchWithAuth(`/api/guests/${id}`, { method: 'DELETE' }),
  bulkUpdateGuests: (payload)     => fetchWithAuth('/api/guests/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  importGuests:     (guests)      => fetchWithAuth('/api/guests/import', { method: 'POST', body: JSON.stringify({ guests }) }),
  sendGuestInvitation: (id, data = {}) => fetchWithAuth(`/api/guests/${id}/send-invitation`, { method: 'POST', body: JSON.stringify(data) }),
  sendTelegramInvitation: (id, data = {}) => fetchWithAuth(`/api/guests/${id}/send-telegram-invitation`, { method: 'POST', body: JSON.stringify(data) }),
  sendBulkInvitations: (payload)       => fetchWithAuth('/api/guests/send-bulk-invitations', { method: 'POST', body: JSON.stringify(payload) }),
  updateGuestRsvp:     (id, rsvp_status) => fetchWithAuth(`/api/guests/${id}/rsvp`, { method: 'PATCH', body: JSON.stringify({ rsvp_status }) }),
  updateGuestStayPreference: async (id, stay_preference, fallbackGuest = null) => {
    try {
      return await fetchWithAuth(`/api/guests/${id}/stay`, { 
        method: 'PATCH', 
        body: JSON.stringify({ stay_preference }) 
      });
    } catch (err) {
      if (fallbackGuest) {
        return await fetchWithAuth(`/api/guests/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...fallbackGuest, stay_preference })
        });
      }
      throw err;
    }
  },
  getGuestInvitationPdfUrl: (id)       => `${getApiBaseUrl()}/api/guests/${id}/invitation-pdf`,
  getPublicRsvp: async (token) => {
    const res = await fetch(`${getApiBaseUrl()}/api/public/rsvp/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load invitation details');
    }
    return res.json();
  },
  submitPublicRsvp: async (token, data) => {
    const res = await fetch(`${getApiBaseUrl()}/api/public/rsvp/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit response');
    }
    return res.json();
  },

  // Email Delivery Configuration
  getEmailSettings: () => fetchWithAuth('/api/email/settings'),
  saveEmailSettings: (data) => fetchWithAuth('/api/email/settings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  testEmailSettings: (toEmail) => fetchWithAuth('/api/email/test', {
    method: 'POST',
    body: JSON.stringify({ toEmail })
  }),
  disconnectEmailSettings: () => fetchWithAuth('/api/email/settings/disconnect', {
    method: 'POST'
  }),

  // CHECKLIST
  getChecklistTasks:        ()         => fetchWithAuth('/api/checklist'),
  createChecklistTask:      (data)     => fetchWithAuth('/api/checklist', { method: 'POST', body: JSON.stringify(data) }),
  updateChecklistTask:      (id, data) => fetchWithAuth(`/api/checklist/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleChecklistTask:      (id)       => fetchWithAuth(`/api/checklist/${id}/toggle`, { method: 'PATCH' }),
  deleteChecklistTask:      (id)       => fetchWithAuth(`/api/checklist/${id}`, { method: 'DELETE' }),
  seedChecklistTasks:       (data)     => fetchWithAuth('/api/checklist/seed', { method: 'POST', body: JSON.stringify(data || {}) }),
  bulkUpdateChecklistTasks: (data)     => fetchWithAuth('/api/checklist/bulk', { method: 'POST', body: JSON.stringify(data) })
};

export const CHECKLIST_CATEGORIES = [
  'Budget & Planning',
  'Venues',
  'Photography & Video',
  'Decor & Design',
  'Attire & Beauty',
  'Ceremonies & Music',
  'Catering & Food',
  'Invitations & Guests',
  'Logistics & Gifts'
];

export const TIMELINE_STAGES = [
  '9 to 12 Months Before',
  '6 to 8 Months Before',
  '4 to 5 Months Before',
  '3 Months Before',
  '2 Months Before',
  '1 Month Before',
  '2 to 3 Weeks Before',
  '1 Week Before',
  'Day of Wedding',
  'Post-Wedding'
];

export const TASK_PRIORITIES = ['High', 'Medium', 'Low'];

// Currency formatter
export const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Compact formatter for chart axes
export const fmtK = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(0)}K`
  : `₹${n}`;

// Date formatter
export const formatDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
};

export const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decoration', 'Clothing',
  'Jewellery', 'Invitation Cards', 'Music / DJ', 'Mehendi', 'Makeup',
  'Travel', 'Accommodation', 'Gifts', 'Miscellaneous',
];

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const WEDDING_EVENTS = [
  'Mehendi', 'Haldi', 'Sangeet', 'Wedding'
];

export const RSVP_STATUSES = [
  'Pending Invitation', 'Invited', 'Confirmed', 'Maybe', 'Declined'
];
export const GUEST_STATUSES = RSVP_STATUSES;

export const ATTENDANCE_STATUSES = [
  'Pending', 'Attended', 'Did Not Attend'
];

export const GUEST_SIDES = [
  'Bride', 'Groom', 'Both'
];

export const RELATIONSHIP_CATEGORIES = [
  'Family', 'Friend', 'Colleague', 'Other'
];

export const GUEST_TYPES = [
  'Individual', 'Couple', 'Family', 'Group', 'Plus-One'
];

export const COMMON_GUEST_TAGS = [
  'VIP', 'Close Family', 'College Friends', 'Office', 'Outstation', 'Needs Accommodation', 'Elderly', 'Child', 'Special Attention'
];

export const STAY_PREFERENCES = [
  'Hotel', 'Home Stay', 'No need of stay'
];

export const HIRING_STAGES = [
  { key: 'Shortlisted', label: 'Shortlisted', color: 'rose' },
  { key: 'Inquired', label: 'Inquired', color: 'amber' },
  { key: 'Evaluating', label: 'Evaluating', color: 'blue' },
  { key: 'Hired', label: 'Hired & Booked', color: 'emerald' },
  { key: 'Declined', label: 'Declined', color: 'zinc' }
];

export const INDIAN_CITIES = [
  'All Cities',
  'Delhi NCR',
  'Mumbai',
  'Jaipur',
  'Bengaluru',
  'Udaipur',
  'Lucknow',
  'Hyderabad',
  'Kolkata',
  'Chandigarh',
  'Goa'
];

