const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

router.get('/budget', requireAuth, budgetController.getBudget);
router.post('/budget', requireAuth, budgetController.updateBudget);
router.get('/summary', requireAuth, budgetController.getSummary);

module.exports = router;
