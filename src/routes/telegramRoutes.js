const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const telegramController = require('../controllers/telegramController');

router.get('/status', requireAuth, telegramController.getStatus);
router.post('/link-code', requireAuth, telegramController.generateLinkCode);
router.post('/set-id', requireAuth, telegramController.setTelegramId);
router.post('/disconnect', requireAuth, telegramController.disconnect);
router.post('/webhook', telegramController.handleWebhook);

module.exports = router;
