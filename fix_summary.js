const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldSummary = `app.get('/api/summary', requireAuth, async (req, res) => {
  try {
    let budgetAmount, totalExpenses, totalSavings;
    if (useLibSQL) {
      const bRow = await dbGet('SELECT amount FROM budget WHERE id = 1');
      const eRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM expenses');
      const sRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM savings');
      budgetAmount  = bRow?.amount || 0;
      totalExpenses = Number(eRow?.total || 0);
      totalSavings  = Number(sRow?.total || 0);
    } else {
      const d = readJSON();
      budgetAmount  = d.budget.amount || 0;
      totalExpenses = d.expenses.reduce((s, e) => s + e.amount, 0);
      totalSavings  = d.savings.reduce((s, e) => s + e.amount, 0);
    }
    res.json({
      budget: budgetAmount, totalExpenses, totalSavings,
      amountStillRequired: Math.max(0, budgetAmount - totalSavings),
      availableBalance:    totalSavings - totalExpenses,
      savingsProgress:     budgetAmount > 0 ? Math.min(100, (totalSavings  / budgetAmount) * 100) : 0,
      expenseProgress:     budgetAmount > 0 ? Math.min(100, (totalExpenses / budgetAmount) * 100) : 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const newSummary = `app.get('/api/summary', requireAuth, async (req, res) => {
  try {
    let budgetAmount, totalExpenses, totalSavings;
    if (useLibSQL) {
      const bRow = await dbGet('SELECT amount FROM user_budget WHERE user_id = ?', [req.user.uid]);
      const eRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id = ?', [req.user.uid]);
      const sRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM savings WHERE user_id = ?', [req.user.uid]);
      budgetAmount  = bRow?.amount || 0;
      totalExpenses = Number(eRow?.total || 0);
      totalSavings  = Number(sRow?.total || 0);
    } else {
      const d = readJSON();
      budgetAmount  = d.user_budgets?.[req.user.uid]?.amount || 0;
      
      const userExpenses = d.expenses.filter(e => e.user_id === req.user.uid);
      const userSavings = d.savings.filter(s => s.user_id === req.user.uid);
      
      totalExpenses = userExpenses.reduce((s, e) => s + e.amount, 0);
      totalSavings  = userSavings.reduce((s, e) => s + e.amount, 0);
    }
    res.json({
      budget: budgetAmount, totalExpenses, totalSavings,
      amountStillRequired: Math.max(0, budgetAmount - totalSavings),
      availableBalance:    totalSavings - totalExpenses,
      savingsProgress:     budgetAmount > 0 ? Math.min(100, (totalSavings  / budgetAmount) * 100) : 0,
      expenseProgress:     budgetAmount > 0 ? Math.min(100, (totalExpenses / budgetAmount) * 100) : 0,
    });
  } catch (e) { 
    console.error("Summary Route Error:", e);
    res.status(500).json({ error: e.message }); 
  }
});`;

code = code.replace(oldSummary, newSummary);
fs.writeFileSync('server.js', code);
console.log('Fixed /api/summary for multi-tenant auth');
