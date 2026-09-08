const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

if (!code.includes('ActionMenu')) {
  code = code.replace(/import \{ TailwindModal \} from '\.\/TailwindModal';/, "import { TailwindModal } from './TailwindModal';\nimport { ActionMenu } from './ActionMenu';");
  
  const oldActions = `<Button size="sm" variant="flat" className="bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 mr-2 font-medium" onClick={() => openPay(b.id)}><CreditCard size={14} className="mr-1"/> Make Payment</Button>
                        <Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick={() => openEdit(b)}><Pencil size={14} /></Button>
                        <Button isIconOnly size="sm" variant="light" className="text-red-600 hover:bg-red-50" onClick={() => confirmDelete(b.id)}><Trash2 size={14} /></Button>`;

  const newActions = `<Button size="sm" variant="flat" className="bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 font-medium" onClick={() => openPay(b.id)}><CreditCard size={14} className="mr-1"/> Make Payment</Button>
                        <ActionMenu onEdit={() => openEdit(b)} onDelete={() => confirmDelete(b.id)} />`;

  code = code.replace(oldActions, newActions);
  
  // Also adjust the flex gap
  code = code.replace(/<div className="flex justify-end gap-1">/, `<div className="flex justify-end items-center gap-2">`);

  fs.writeFileSync('client/src/components/Bookings.jsx', code);
  console.log("Patched Bookings.jsx actions");
}
