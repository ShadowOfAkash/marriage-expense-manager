const fs = require('fs');
let code = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

const hook = `
  const [bookings, setBookings] = useState([]);
  const loadData = async () => {
    try {
      const [expData, bkData] = await Promise.all([api.getExpenses(), api.getBookings()]);
      setExpenses(expData || []);
      setBookings(bkData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
`;
code = code.replace(/const loadData = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/, hook.trim());

// Add th column
code = code.replace(
  /<th className="py-3 px-4 font-medium whitespace-nowrap">CATEGORY<\/th>/,
  '<th className="py-3 px-4 font-medium whitespace-nowrap">BOOKING</th>\n                  <th className="py-3 px-4 font-medium whitespace-nowrap">CATEGORY</th>'
);

// Add td column
const td = `
                    <td className="py-3 px-4 text-zinc-600 font-medium">
                      {e.booking_id ? (() => {
                        const b = bookings.find(x => String(x.id) === String(e.booking_id));
                        return b ? <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-100">{b.vendor} ({b.service})</span> : <span className="text-zinc-400">—</span>;
                      })() : <span className="text-zinc-400">—</span>}
                    </td>
`;
code = code.replace(
  /<td className="py-3 px-4">\n\s*<div className="flex items-center gap-2">/,
  td.trim() + '\n                    <td className="py-3 px-4">\n                      <div className="flex items-center gap-2">'
);

// Update Edit Form loading
code = code.replace(
  /setForm\(\{ \.\.\.e \}\);/,
  "setForm({ ...e, booking_id: e.booking_id || '' });"
);

// Add booking dropdown to Edit modal
const editDropdown = `
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarCheck size={12} /> Attach to Booking</label>
            <select value={form.booking_id || ''} onChange={(e) => setForm(p => ({...p, booking_id: e.target.value}))} className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none appearance-none cursor-pointer">
              <option value="">-- No Booking --</option>
              {bookings.map(b => <option key={b.id} value={b.id}>{b.vendor} - {b.service}</option>)}
            </select>
          </div>
`;

code = code.replace(
  /<div>\s*<label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1\.5 mb-1"><PieChart size=\{12\} \/> Category<\/label>/,
  editDropdown + "\n          <div>\n            <label className=\"text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1\"><PieChart size={12} /> Category</label>"
);

code = code.replace(/import \{ (.*) \} from 'lucide-react';/, "import { $1, CalendarCheck } from 'lucide-react';");

fs.writeFileSync('client/src/components/Expenses.jsx', code);
console.log("Patched Expenses.jsx");
