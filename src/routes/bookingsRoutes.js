const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const bookingsController = require('../controllers/bookingsController');

// Static / Collection level endpoints (Must be before /:id)
router.get('/', requireAuth, bookingsController.listBookings);
router.get('/summary', requireAuth, bookingsController.getVendorSummary);
router.get('/call-sheet', requireAuth, bookingsController.getCallSheet);
router.get('/marketplace', requireAuth, bookingsController.getMarketplaceDirectory);
router.post('/marketplace/shortlist', requireAuth, bookingsController.shortlistMarketplaceVendor);
router.post('/', requireAuth, bookingsController.createBooking);

// Item level endpoints
router.put('/:id', requireAuth, bookingsController.updateBooking);
router.patch('/:id/stage', requireAuth, bookingsController.updateHiringStage);
router.patch('/:id/favorite', requireAuth, bookingsController.toggleFavorite);
router.delete('/:id', requireAuth, bookingsController.deleteBooking);

module.exports = router;
