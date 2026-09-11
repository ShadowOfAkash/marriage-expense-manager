const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const paymentsController = require('../controllers/paymentsController');

// Receipt OCR scan
router.post(['/payments/scan', '/expenses/scan'], requireAuth, paymentsController.scanReceipt);

// Document upload
router.post('/upload', requireAuth, paymentsController.uploadFile);

// Categories
router.get(['/payments/categories', '/expenses/categories'], requireAuth, paymentsController.getCategories);

// CRUD operations
router.get(['/payments', '/expenses'], requireAuth, paymentsController.listPayments);
router.post(['/payments', '/expenses'], requireAuth, paymentsController.createPayment);
router.put(['/payments/:id', '/expenses/:id'], requireAuth, paymentsController.updatePayment);
router.post(['/payments/:id/detach', '/expenses/:id/detach'], requireAuth, paymentsController.detachPayment);
router.delete(['/payments/:id', '/expenses/:id'], requireAuth, paymentsController.deletePayment);

module.exports = router;
