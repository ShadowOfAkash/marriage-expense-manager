const fs = require('fs');

// 1. Update api.js
let apiCode = fs.readFileSync('client/src/utils/api.js', 'utf8');
if (!apiCode.includes('getBookings')) {
  const bookingApis = `
  // BOOKINGS
  getBookings: async () => { const r = await fetch(API_URL + '/bookings', { headers: getHeaders() }); if (!r.ok) throw new Error('Error'); return r.json(); },
  addBooking: async (data) => { const r = await fetch(API_URL + '/bookings', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }); if (!r.ok) throw new Error('Error'); return r.json(); },
  updateBooking: async (id, data) => { const r = await fetch(API_URL + '/bookings/' + id, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }); if (!r.ok) throw new Error('Error'); return r.json(); },
  deleteBooking: async (id) => { const r = await fetch(API_URL + '/bookings/' + id, { method: 'DELETE', headers: getHeaders() }); if (!r.ok) throw new Error('Error'); return r.json(); },
`;
  apiCode = apiCode.replace(/export const api = {/, "export const api = {" + bookingApis);
  fs.writeFileSync('client/src/utils/api.js', apiCode);
  console.log("Updated api.js");
}

// 2. Update Sidebar.jsx
let sidebarCode = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');
if (!sidebarCode.includes("label: 'Bookings'")) {
  sidebarCode = sidebarCode.replace(/import { (.*) } from 'lucide-react';/, "import { $1, CalendarCheck } from 'lucide-react';");
  sidebarCode = sidebarCode.replace(/const navItems = \[/, "const navItems = [\n    { id: 'bookings',  label: 'Bookings',  icon: CalendarCheck },");
  fs.writeFileSync('client/src/components/Sidebar.jsx', sidebarCode);
  console.log("Updated Sidebar.jsx");
}

// 3. Update Navbar.jsx
let navbarCode = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');
if (!navbarCode.includes("label: 'Bookings'")) {
  navbarCode = navbarCode.replace(/import { (.*) } from 'lucide-react';/, "import { $1, CalendarCheck } from 'lucide-react';");
  navbarCode = navbarCode.replace(/const NAV_ITEMS = \[/, "const NAV_ITEMS = [\n  { id: 'bookings',  label: 'Bookings',  Icon: CalendarCheck },");
  fs.writeFileSync('client/src/components/Navbar.jsx', navbarCode);
  console.log("Updated Navbar.jsx");
}

// 4. Update App.jsx
let appCode = fs.readFileSync('client/src/App.jsx', 'utf8');
if (!appCode.includes('<Route path="/bookings"')) {
  appCode = appCode.replace(/import Expenses from '\.\/components\/Expenses'/, "import Expenses from './components/Expenses'\nimport Bookings from './components/Bookings'");
  appCode = appCode.replace(/<Route path="\/expenses" element={<Expenses \/>} \/>/, "<Route path=\"/expenses\" element={<Expenses />} />\n                <Route path=\"/bookings\" element={<Bookings />} />");
  fs.writeFileSync('client/src/App.jsx', appCode);
  console.log("Updated App.jsx");
}

console.log("Done updating existing files");
