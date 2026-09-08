const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

code = code.replace(/onClick={isAddOpen \? handleAdd : handleUpdate}/, "onPress={isAddOpen ? handleAdd : handleUpdate} onClick={isAddOpen ? handleAdd : handleUpdate}");

fs.writeFileSync('client/src/components/Bookings.jsx', code);
