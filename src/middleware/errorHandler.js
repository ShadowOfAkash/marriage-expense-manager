function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = {
  errorHandler
};
