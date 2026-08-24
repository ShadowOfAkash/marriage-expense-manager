const handleResponse = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
})

export const api = {
  // Auth
  login: (email, password) =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  logout: () =>
    fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() }).then(handleResponse),

  // Budget
  getBudget:  ()       => fetch('/api/budget', { headers: getHeaders() }).then(handleResponse),
  saveBudget: (amount) =>
    fetch('/api/budget', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ amount }),
    }).then(handleResponse),

  // Summary
  getSummary: () => fetch('/api/summary', { headers: getHeaders() }).then(handleResponse),

  // Expenses
  getExpenses:    ()       => fetch('/api/expenses', { headers: getHeaders() }).then(handleResponse),
  getCategories:  ()       => fetch('/api/expenses/categories', { headers: getHeaders() }).then(handleResponse),
  addExpense:     (data)   =>
    fetch('/api/expenses', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  updateExpense:  (id, data) =>
    fetch(`/api/expenses/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  deleteExpense:  (id) =>
    fetch(`/api/expenses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  scanReceipt: (image, mimeType) =>
    fetch('/api/expenses/scan', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ image, mimeType })
    }).then(handleResponse),

  uploadDocument: (fileBase64, filename) =>
    fetch('/api/upload', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ file: fileBase64, filename })
    }).then(handleResponse),

  // Savings
  getSavings:    ()     => fetch('/api/savings', { headers: getHeaders() }).then(handleResponse),
  addSavings:    (data) =>
    fetch('/api/savings', {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    }).then(handleResponse),
  deleteSavings: (id)   =>
    fetch(`/api/savings/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
}

// Currency formatter
export const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// Compact formatter for chart axes
export const fmtK = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(0)}K`
  : `₹${n}`

// Date formatter
export const formatDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

export const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decoration', 'Clothing',
  'Jewellery', 'Invitation Cards', 'Music / DJ', 'Mehendi', 'Makeup',
  'Travel', 'Accommodation', 'Gifts', 'Miscellaneous',
]

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
