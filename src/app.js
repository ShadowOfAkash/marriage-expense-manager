const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { PUBLIC_DIR, UPLOADS_DIR } = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (Render, Railway, Heroku, Cloudflare, etc.)
app.set('trust proxy', 1);

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Assets
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Healthcheck (Railway / Render / container health check)
app.get('/api/health', (req, res) => res.status(200).send('OK'));

// Mount all API endpoints under /api
app.use('/api', apiRoutes);

// Explicit route for RSVP portal direct links
app.get('/rsvp/:token', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Single Page Application (SPA) catch-all fallback
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
