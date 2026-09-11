const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const emailController = require('../controllers/emailController');

router.get('/settings', requireAuth, emailController.getEmailSettings);
router.post('/settings', requireAuth, emailController.saveEmailSettings);
router.post('/test', requireAuth, emailController.testEmail);
router.post('/settings/disconnect', requireAuth, emailController.disconnectEmailSettings);

module.exports = router;
