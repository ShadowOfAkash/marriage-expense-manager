import { auth } from '../contexts/AuthContext';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const fetchWithAuth = async (url, options = {}) => {
  let token = '';
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }
  
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers
  };
  
  const res = await fetch(url, { ...options, headers });
  return handleResponse(res);
};

export const api = {
  // Telegram
  generateTelegramCode: () => fetchWithAuth('/api/telegram/link-code', { method: 'POST' }),
  // Budget
  getBudget:  ()       => fetchWithAuth('/api/budget'),
  saveBudget: (amount) => fetchWithAuth('/api/budget', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Summary
  getSummary: () => fetchWithAuth('/api/summary'),

  // Expenses
  getExpenses:    ()       => fetchWithAuth('/api/expenses'),
  getCategories:  ()       => fetchWithAuth('/api/expenses/categories'),
  addExpense:     (data)   => fetchWithAuth('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense:  (id, data) => fetchWithAuth(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense:  (id) => fetchWithAuth(`/api/expenses/${id}`, { method: 'DELETE' }),
  scanReceipt: (image, mimeType) => fetchWithAuth('/api/expenses/scan', { method: 'POST', body: JSON.stringify({ image, mimeType }) }),
  uploadDocument: (fileBase64, filename) => fetchWithAuth('/api/upload', { method: 'POST', body: JSON.stringify({ file: fileBase64, filename }) }),

  // Savings
  getSavings:    ()     => fetchWithAuth('/api/savings'),
  addSavings:    (data) => fetchWithAuth('/api/savings', { method: 'POST', body: JSON.stringify(data) }),
  deleteSavings: (id)   => fetchWithAuth(`/api/savings/${id}`, { method: 'DELETE' }),
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
