const fs = require('fs');

let apiCode = fs.readFileSync('client/src/utils/api.js', 'utf8');

const oldApi = `  getBookings: async () => { const r = await fetch(API_URL + '/bookings', { headers: getHeaders() }); if (!r.ok) throw new Error('Error'); return r.json(); },
  addBooking: async (data) => { const r = await fetch(API_URL + '/bookings', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }); if (!r.ok) throw new Error('Error'); return r.json(); },
  updateBooking: async (id, data) => { const r = await fetch(API_URL + '/bookings/' + id, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }); if (!r.ok) throw new Error('Error'); return r.json(); },
  deleteBooking: async (id) => { const r = await fetch(API_URL + '/bookings/' + id, { method: 'DELETE', headers: getHeaders() }); if (!r.ok) throw new Error('Error'); return r.json(); },`;

const newApi = `  getBookings:   ()       => fetchWithAuth('/api/bookings'),
  addBooking:    (data)   => fetchWithAuth('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => fetchWithAuth(\`/api/bookings/\${id}\`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id)     => fetchWithAuth(\`/api/bookings/\${id}\`, { method: 'DELETE' }),`;

apiCode = apiCode.replace(oldApi, newApi);

fs.writeFileSync('client/src/utils/api.js', apiCode);
console.log("Patched api.js with correct fetchWithAuth wrappers");
