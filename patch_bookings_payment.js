const fs = require('fs');
let code = fs.readFileSync('client/src/components/Bookings.jsx', 'utf8');

// Import AddExpenseModal
if (!code.includes('AddExpenseModal')) {
  code = code.replace(
    /import \{ TailwindModal \} from '\.\/TailwindModal';/,
    "import { TailwindModal } from './TailwindModal';\nimport { AddExpenseModal } from './SharedModals';"
  );
  code = code.replace(/import \{ (.*) \} from 'lucide-react';/, "import { $1, CreditCard } from 'lucide-react';");

  // State for AddExpenseModal
  const hooks = `
  const [payBookingId, setPayBookingId] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const openPay = (id) => {
    setPayBookingId(id);
    setIsPayOpen(true);
  };
`;
  code = code.replace(/const openAdd = \(\) => \{/, hooks + "\n  const openAdd = () => {");

  // Add Button to table
  code = code.replace(
    /<Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick=\{\(\) => openEdit\(b\)\}><Pencil size=\{14\} \/><\/Button>/g,
    `<Button size="sm" variant="flat" className="bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 mr-2 font-medium" onClick={() => openPay(b.id)}><CreditCard size={14} className="mr-1"/> Make Payment</Button>\n                        <Button isIconOnly size="sm" variant="light" className="text-blue-600 hover:bg-blue-50" onClick={() => openEdit(b)}><Pencil size={14} /></Button>`
  );

  // Add Modal markup
  code = code.replace(
    /<\/div>\n\s*<TailwindModal isOpen=\{isAddOpen \|\| isEditOpen\}/,
    `</div>
      <AddExpenseModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} onSuccess={() => { setIsPayOpen(false); loadData(); }} initialBookingId={payBookingId} />
      <TailwindModal isOpen={isAddOpen || isEditOpen}`
  );

  fs.writeFileSync('client/src/components/Bookings.jsx', code);
  console.log("Patched Bookings.jsx for Making Payments");
}
