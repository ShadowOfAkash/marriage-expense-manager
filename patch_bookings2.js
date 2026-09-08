const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

// Replace all Button onClick to onPress
code = code.replace(/<Button(.*?)onClick=\{(.*?)\}(.*?)>/g, "<Button$1onPress={$2} onClick={$2}$3>");

fs.writeFileSync('client/src/components/Bookings.jsx', code);
