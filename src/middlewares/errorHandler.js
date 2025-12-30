const logger = require('../logger');

module.exports = function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  if (res.headersSent) return next(err);

  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    error: err.code || 'INTERNAL_ERROR',
    message: err.publicMessage || 'Internal server error'
  });
};
