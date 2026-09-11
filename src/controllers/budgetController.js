const { isLibSQL, dbGet, dbRun, readJSON, writeJSON } = require('../db');

async function getBudget(req, res) {
  try {
    if (isLibSQL()) {
      const row = await dbGet('SELECT amount FROM user_budget WHERE user_id = ?', [req.user.uid]);
      return res.json({ amount: row?.amount || 0 });
    }
    const d = readJSON();
    res.json({ amount: d.user_budgets?.[req.user.uid]?.amount || d.budget?.amount || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateBudget(req, res) {
  const { amount } = req.body;
  if (amount === undefined || isNaN(amount)) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const numAmount = Number(amount);
  try {
    if (isLibSQL()) {
      await dbRun(`
        INSERT INTO user_budget (user_id, amount, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          amount = excluded.amount,
          updated_at = datetime('now')
      `, [req.user.uid, numAmount]);
      return res.json({ success: true, amount: numAmount });
    }

    const d = readJSON();
    if (!d.user_budgets) d.user_budgets = {};
    if (!d.user_budgets[req.user.uid]) d.user_budgets[req.user.uid] = {};
    d.user_budgets[req.user.uid].amount = numAmount;
    d.budget.amount = numAmount;
    writeJSON(d);
    res.json({ success: true, amount: numAmount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getSummary(req, res) {
  try {
    let budgetAmount, totalExpenses, totalSavings;
    if (isLibSQL()) {
      const bRow = await dbGet('SELECT amount FROM user_budget WHERE user_id = ?', [req.user.uid]);
      const eRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE user_id = ?', [req.user.uid]);
      const sRow = await dbGet('SELECT COALESCE(SUM(amount),0) as total FROM savings WHERE user_id = ?', [req.user.uid]);
      budgetAmount  = bRow?.amount || 0;
      totalExpenses = Number(eRow?.total || 0);
      totalSavings  = Number(sRow?.total || 0);
    } else {
      const d = readJSON();
      budgetAmount  = d.user_budgets?.[req.user.uid]?.amount || d.budget?.amount || 0;
      
      const userPayments = (d.payments || d.expenses || []).filter(e => e.user_id === req.user.uid || !e.user_id || e.user_id === 'legacy_user');
      const userSavings = (d.savings || []).filter(s => s.user_id === req.user.uid || !s.user_id || s.user_id === 'legacy_user');
      
      totalExpenses = userPayments.reduce((s, e) => s + e.amount, 0);
      totalSavings  = userSavings.reduce((s, e) => s + e.amount, 0);
    }

    res.json({
      budget: budgetAmount,
      totalExpenses,
      totalSavings,
      amountStillRequired: Math.max(0, budgetAmount - totalSavings),
      availableBalance:    totalSavings - totalExpenses,
      savingsProgress:     budgetAmount > 0 ? (totalSavings  / budgetAmount) * 100 : 0,
      expenseProgress:     budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0,
      isOverBudget:        budgetAmount > 0 ? totalExpenses > budgetAmount : false,
      overBudgetAmount:    Math.max(0, totalExpenses - budgetAmount),
    });
  } catch (e) {
    console.error('Summary Route Error:', e);
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getBudget,
  updateBudget,
  getSummary
};
