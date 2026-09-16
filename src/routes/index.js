const express = require('express');
const router = express.Router();

const authRoutes     = require('./authRoutes');
const budgetRoutes   = require('./budgetRoutes');
const paymentsRoutes = require('./paymentsRoutes');
const bookingsRoutes = require('./bookingsRoutes');
const savingsRoutes  = require('./savingsRoutes');
const guestsRoutes   = require('./guestsRoutes');
const emailRoutes    = require('./emailRoutes');
const telegramRoutes = require('./telegramRoutes');
const rsvpRoutes     = require('./rsvpRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const checklistRoutes = require('./checklistRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/', budgetRoutes);
router.use('/', paymentsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/savings', savingsRoutes);
router.use('/guests', guestsRoutes);
router.use('/checklist', checklistRoutes);
router.use('/email', emailRoutes);
router.use('/telegram', telegramRoutes);
router.use('/public/rsvp', rsvpRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;
