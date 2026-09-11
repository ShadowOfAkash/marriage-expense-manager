const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const bookingsController = require('../controllers/bookingsController');

router.get('/', requireAuth, bookingsController.listBookings);
router.post('/', requireAuth, bookingsController.createBooking);
router.put('/:id', requireAuth, bookingsController.updateBooking);
router.delete('/:id', requireAuth, bookingsController.deleteBooking);

module.exports = router;
