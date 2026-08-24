const fs = require('fs');

// --- 1. Dashboard.jsx ---
let dashboard = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Replace `fmt` with `fmtK` in the values passed to StatCard
dashboard = dashboard.replace(/value=\{fmt\(summary\?\.budget\)\}/g, "value={fmtK(summary?.budget)}");
dashboard = dashboard.replace(/value=\{fmt\(summary\?\.totalSavings\)\}/g, "value={fmtK(summary?.totalSavings)}");
dashboard = dashboard.replace(/value=\{fmt\(summary\?\.totalExpenses\)\}/g, "value={fmtK(summary?.totalExpenses)}");
dashboard = dashboard.replace(/value=\{fmt\(summary\?\.amountStillRequired\)\}/g, "value={fmtK(summary?.amountStillRequired)}");
dashboard = dashboard.replace(/value=\{fmt\(Math\.abs\(summary\?\.availableBalance \|\| 0\)\)\}/g, "value={fmtK(Math.abs(summary?.availableBalance || 0))}");

// Update baseColor for each card
dashboard = dashboard.replace(/gradient="linear\(135deg, gold\.400, gold\.600\)"/g, `baseColor="#0EA5E9"`);
dashboard = dashboard.replace(/gradient="linear\(135deg, #10B981, #059669\)"/g, `baseColor="#10B981"`);
dashboard = dashboard.replace(/gradient="linear\(135deg, brand\.500, brand\.700\)"/g, `baseColor="#1B2CC1"`);
dashboard = dashboard.replace(/gradient="linear\(135deg, #F59E0B, #D97706\)"/g, `baseColor="#E09913"`);
dashboard = dashboard.replace(/gradient=\{`linear\(135deg, \$\{\(summary\?\.availableBalance \|\| 0\) >= 0 \? '#7F55B0, #643994' : '#EF4444, #DC2626'\}\)`\}/g, `baseColor="#7F55B0"`);

fs.writeFileSync('client/src/components/Dashboard.jsx', dashboard);


// --- 2. Expenses.jsx ---
let expenses = fs.readFileSync('client/src/components/Expenses.jsx', 'utf8');

// The array is mapped. Replace fmt with fmtK, and use the unified colors.
const expensesCardOld = `        {[
          { label: 'Total Entries',   value: expenses.length,    color: '#091540', icon: LayoutList },
          { label: 'Total Spent',     value: fmt(totalAll),      color: '#1B2CC1', icon: Receipt },
          { label: 'Filtered Items',  value: filtered.length,    color: '#7692FF', icon: FilterX },
          { label: 'Filtered Total',  value: fmt(filteredTotal), color: '#ABD2FA', icon: Tag },
        ].map(({ label, value, color, icon: Icon }) => (`;

const expensesCardNew = `        {[
          { label: 'Total Spent',     value: fmtK(totalAll),      color: '#10B981', icon: Receipt },
          { label: 'Total Entries',   value: expenses.length,    color: '#1B2CC1', icon: LayoutList },
          { label: 'Filtered Total',  value: fmtK(filteredTotal), color: '#E09913', icon: Tag },
          { label: 'Filtered Items',  value: filtered.length,    color: '#0EA5E9', icon: FilterX },
        ].map(({ label, value, color, icon: Icon }) => (`;

expenses = expenses.replace(expensesCardOld, expensesCardNew);

// Ensure we don't need to replace `fmtK` if it's not imported. It is imported in api.js.
// Wait, is fmtK imported in Expenses.jsx? Let's check imports in Expenses.jsx
if (!expenses.includes('fmtK')) {
  expenses = expenses.replace(/fmt } from '\.\.\/utils\/api'/, "fmt, fmtK } from '../utils/api'");
  expenses = expenses.replace(/fmt, MONTH_NAMES } from '\.\.\/utils\/api'/, "fmt, fmtK, MONTH_NAMES } from '../utils/api'");
}
fs.writeFileSync('client/src/components/Expenses.jsx', expenses);


// --- 3. Savings.jsx ---
let savings = fs.readFileSync('client/src/components/Savings.jsx', 'utf8');

const savingsCardOld = `        {[
          { label: 'Total Saved',      value: fmt(totalSaved),                     color: '#10B981', icon: PiggyBank },
          { label: 'Entries',          value: savings.length,                       color: '#1b2cc1', icon: BarChart2 },
          { label: 'Still Required',   value: fmt(summary?.amountStillRequired),    color: '#E09913', icon: Clock     },
          { label: 'Budget Goal',      value: fmt(summary?.budget),                 color: '#0EA5E9', icon: Target    },
        ].map(({ label, value, color, icon: Icon }) => (`;

const savingsCardNew = `        {[
          { label: 'Total Saved',      value: fmtK(totalSaved),                     color: '#10B981', icon: PiggyBank },
          { label: 'Entries',          value: savings.length,                       color: '#1B2CC1', icon: BarChart2 },
          { label: 'Still Required',   value: fmtK(summary?.amountStillRequired),    color: '#E09913', icon: Clock     },
          { label: 'Budget Goal',      value: fmtK(summary?.budget),                 color: '#0EA5E9', icon: Target    },
        ].map(({ label, value, color, icon: Icon }) => (`;

savings = savings.replace(savingsCardOld, savingsCardNew);

fs.writeFileSync('client/src/components/Savings.jsx', savings);

console.log("Unified colors and formats applied.");
