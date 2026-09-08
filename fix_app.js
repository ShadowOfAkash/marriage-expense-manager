const fs = require('fs');

let appCode = fs.readFileSync('client/src/App.jsx', 'utf8');
if (!appCode.includes("import Bookings")) {
  appCode = appCode.replace(/import Savings   from '.\/components\/Savings'/, "import Savings   from './components/Savings'\nimport Bookings from './components/Bookings'");
  fs.writeFileSync('client/src/App.jsx', appCode);
}

let navbarCode = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');
if (!navbarCode.includes("label: 'Bookings'")) {
  navbarCode = navbarCode.replace(/const TABS = \[/, "const TABS = [\n  { id: 'bookings',  label: 'Bookings',  Icon: CalendarCheck },");
  fs.writeFileSync('client/src/components/Navbar.jsx', navbarCode);
}
