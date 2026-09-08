const fs = require('fs');
let code = fs.readFileSync('client/src/components/SharedModals.jsx', 'utf8');

// Add Bookings state and effect
code = code.replace(
  /export function AddExpenseModal\(\{ isOpen, onClose, onSuccess \}\) \{/,
  "export function AddExpenseModal({ isOpen, onClose, onSuccess, initialBookingId }) {"
);

const hooks = `
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    if (isOpen) {
      api.getBookings().then(setBookings).catch(() => {});
      if (initialBookingId) setF('booking_id', initialBookingId);
    } else {
      setForm({ ...EMPTY_EXP_FORM, date: new Date().toISOString().split('T')[0] });
    }
  }, [isOpen, initialBookingId]);
`;

code = code.replace(
  /const setF = \(k, v\) => setForm\(p => \(\{ \.\.\.p, \[k\]: v \}\)\);/,
  "const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));\n" + hooks
);

const categoryInput = `<Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><PieChart size={12} /> Category</Label>`;

const bookingDropdown = `
          <div>
            <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarCheck size={12} /> Attach to Booking (Optional)</Label>
            <div className="relative">
              <select 
                value={form.booking_id || ''} 
                onChange={(e) => setF('booking_id', e.target.value)}
                className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none appearance-none cursor-pointer"
              >
                <option value="">-- No Booking --</option>
                {bookings.map(b => <option key={b.id} value={b.id}>{b.vendor} - {b.service}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
`;

code = code.replace(
  /<div>\s*<Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1\.5 mb-1"><PieChart size=\{12\} \/> Category<\/Label>/,
  bookingDropdown + "\n          <div>\n            " + categoryInput
);

code = code.replace(/import \{ (.*) \} from 'lucide-react';/, "import { $1, CalendarCheck } from 'lucide-react';");

fs.writeFileSync('client/src/components/SharedModals.jsx', code);
console.log("Patched SharedModals.jsx");
