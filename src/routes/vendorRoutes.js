const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const vendorController = require('../controllers/vendorController');

// Public-ish (still needs auth)
router.get('/categories', requireAuth, vendorController.getCategories);
router.get('/search', requireAuth, vendorController.searchVendors);
router.get('/photo', vendorController.getVendorPhoto); // No auth for photo proxy (img src tags)
router.get('/location', requireAuth, vendorController.getLocation);
router.post('/location', requireAuth, vendorController.saveLocation);
router.get('/autocomplete', requireAuth, vendorController.autocompleteLocations);
router.post('/quote', requireAuth, vendorController.requestQuote);
router.get('/:placeId', requireAuth, vendorController.getVendorDetails);

module.exports = router;
