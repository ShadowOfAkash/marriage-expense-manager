const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const weddingProfileController = require('../controllers/weddingProfileController');

router.get('/profile', requireAuth, weddingProfileController.getProfile);
router.post('/profile', requireAuth, weddingProfileController.saveProfile);
router.post('/upload-photo', requireAuth, weddingProfileController.uploadWeddingPhoto);
router.post('/onboard', requireAuth, weddingProfileController.completeOnboarding);

module.exports = router;
