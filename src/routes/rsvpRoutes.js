const express = require('express');
const router = express.Router();
const rsvpController = require('../controllers/rsvpController');

router.get('/:token', rsvpController.getPublicGuestDetails);
router.post('/:token', rsvpController.submitPublicResponse);

module.exports = router;
