import { auth, createMockUser } from '../contexts/AuthContext';

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
  
  const res = await fetch(url, { ...options, headers });
  return handleResponse(res);
};

export const api = {
  // BOOKINGS
  getBookings:   ()       => fetchWithAuth('/api/bookings'),
  addBooking:    (data)   => fetchWithAuth('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => fetchWithAuth(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id)     => fetchWithAuth(`/api/bookings/${id}`, { method: 'DELETE' }),

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
  sendBulkInvitations: (payload)       => fetchWithAuth('/api/guests/send-bulk-invitations', { method: 'POST', body: JSON.stringify(payload) }),
  updateGuestRsvp:     (id, rsvp_status) => fetchWithAuth(`/api/guests/${id}/rsvp`, { method: 'PATCH', body: JSON.stringify({ rsvp_status }) }),
  getGuestInvitationPdfUrl: (id)       => `/api/guests/${id}/invitation-pdf`,
  getPublicRsvp: async (token) => {
    const res = await fetch(`/api/public/rsvp/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load invitation details');
    }
    return res.json();
  },
  submitPublicRsvp: async (token, data) => {
    const res = await fetch(`/api/public/rsvp/${token}`, {
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
  })
};

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
