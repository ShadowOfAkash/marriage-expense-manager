const fs = require('fs');
let code = fs.readFileSync('client/src/components/Sidebar.jsx', 'utf8');

code = code.replace(/const navItems = \[\s*\{ id: 'bookings',  label: 'Bookings',  icon: CalendarCheck \},\s*\{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard \},\s*\{ id: 'expenses',  label: 'Payments',  icon: Receipt \},\s*\{ id: 'savings',   label: 'Savings',   icon: PiggyBank \},/g, 
`const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings',  label: 'Bookings',  icon: CalendarCheck },
    { id: 'expenses',  label: 'Payments',  icon: Receipt },
    { id: 'savings',   label: 'Savings',   icon: PiggyBank },`);

fs.writeFileSync('client/src/components/Sidebar.jsx', code);
console.log("Fixed sidebar order");
