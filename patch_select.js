const fs = require('fs');
let content = fs.readFileSync('client/src/components/SharedModals.jsx', 'utf8');

const expenseSelectRegex = /<Select\s+selectedKeys=\{form\.category[\s\S]*?<\/Select>/m;
const expenseNativeSelect = `
            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><Tag size={12} /> Category</Label>
              <div className="relative">
                <select
                  value={form.category || ''}
                  onChange={(e) => setF('category', e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                >
                  <option value="" disabled>— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
`;

content = content.replace(expenseSelectRegex, expenseNativeSelect.trim());

const savingSelectRegex = /<Select\s+selectedKeys=\{form\.month[\s\S]*?<\/Select>/m;
const savingNativeSelect = `
            <div>
              <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-1"><CalendarDays size={12} /> Month</Label>
              <div className="relative">
                <select
                  value={form.month || ''}
                  onChange={(e) => setF('month', e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-sm font-medium text-zinc-900 border-none outline-none focus:ring-2 focus:ring-zinc-400 appearance-none cursor-pointer"
                >
                  <option value="" disabled>— Select —</option>
                  {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
`;

content = content.replace(savingSelectRegex, savingNativeSelect.trim());

// need to add ChevronDown import to SharedModals if missing
if (!content.includes('ChevronDown')) {
  content = content.replace(/import { (.*) } from 'lucide-react';/, "import { $1, ChevronDown } from 'lucide-react';");
}

fs.writeFileSync('client/src/components/SharedModals.jsx', content);
