const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const guestsController = require('../controllers/guestsController');

// Summary & bulk operations
router.get('/summary', requireAuth, guestsController.getSummary);
router.post('/bulk', requireAuth, guestsController.bulkOperations);
router.post('/import', requireAuth, guestsController.importGuests);
router.post('/send-bulk-invitations', requireAuth, guestsController.sendBulkInvitations);

// Streaming PDF card (accessible directly by guests or previewers)
router.get('/:id/invitation-pdf', guestsController.downloadInvitationPdf);

// Individual operations
router.get('/', requireAuth, guestsController.listGuests);
router.get('/:id', requireAuth, guestsController.getGuestById);
router.post('/', requireAuth, guestsController.createGuest);
router.put('/:id', requireAuth, guestsController.updateGuest);
router.delete('/:id', requireAuth, guestsController.deleteGuest);
router.patch('/:id/rsvp', requireAuth, guestsController.patchRsvpStatus);
router.patch('/:id/stay', requireAuth, guestsController.patchStayPreference);
router.post('/:id/send-invitation', requireAuth, guestsController.sendSingleInvitation);
router.post('/:id/send-telegram-invitation', requireAuth, guestsController.sendTelegramInvitation);

module.exports = router;
