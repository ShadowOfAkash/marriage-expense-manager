const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const savingsController = require('../controllers/savingsController');

router.get('/', requireAuth, savingsController.listSavings);
router.post('/', requireAuth, savingsController.createSaving);
router.delete('/:id', requireAuth, savingsController.deleteSaving);

module.exports = router;
