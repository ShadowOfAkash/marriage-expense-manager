const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

// I will just revert to the standard onClick correctly
code = code.replace(/<Button variant="light" onPress=\{\(\) => \{ setIsAddOpen\(false\); setIsEditOpen\(false\); \} onClick=\{\(\) => \{ setIsAddOpen\(false\); setIsEditOpen\(false\); \}\}>Cancel<\/Button>/, 
  `<Button variant="light" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>`);

code = code.replace(/<Button className="bg-zinc-900 text-white hover:bg-zinc-800" onPress=\{isAddOpen \? handleAdd : handleUpdate\} onPress=\{isAddOpen \? handleAdd : handleUpdate\} onClick=\{isAddOpen \? handleAdd : handleUpdate\} isLoading=\{saving\}>/,
  `<Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={isAddOpen ? handleAdd : handleUpdate} isLoading={saving}>`);

code = code.replace(/<Button className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onPress=\{openAdd\} onClick=\{openAdd\}>/,
  `<Button className="bg-zinc-900 text-white hover:bg-zinc-950 shadow-md font-bold" onClick={openAdd}>`);

code = code.replace(/<Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onPress=\{\(\) => openEdit\(b\)\} onClick=\{\(\) => openEdit\(b\)\}>/g,
  `<Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick={() => openEdit(b)}>`);

code = code.replace(/<Button isIconOnly size="sm" variant="light" className="text-red-600 hover:bg-red-50" onPress=\{\(\) => confirmDelete\(b.id\)\} onClick=\{\(\) => confirmDelete\(b.id\)\}>/g,
  `<Button isIconOnly size="sm" variant="light" className="text-red-600 hover:bg-red-50" onClick={() => confirmDelete(b.id)}>`);

code = code.replace(/<Button variant="light" onPress=\{\(\) => setIsDelOpen\(false\)\} onClick=\{\(\) => setIsDelOpen\(false\)\}>Cancel<\/Button>/,
  `<Button variant="light" onClick={() => setIsDelOpen(false)}>Cancel</Button>`);

code = code.replace(/<Button className="bg-red-600 text-white hover:bg-red-700 font-bold" onPress=\{handleDelete\} onClick=\{handleDelete\}>Delete Booking<\/Button>/,
  `<Button className="bg-red-600 text-white hover:bg-red-700 font-bold" onClick={handleDelete}>Delete Booking</Button>`);

fs.writeFileSync('client/src/components/Bookings.jsx', code);
console.log("Fixed syntax");
