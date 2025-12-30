const logger = require('../logger');

// Lightweight request logger to trace incoming callbacks (e.g., Click)
function requestLogger(req, res, next) {
  const { method, originalUrl, query, body, headers } = req;
  logger.info('Incoming request', {
    method,
    url: originalUrl,
    ip: req.ip,
    query,
    body,
    // Limit headers to the essentials to avoid noise
    headers: {
      'user-agent': headers['user-agent'],
      'x-forwarded-for': headers['x-forwarded-for']
    }
  });
  next();
}

module.exports = requestLogger;
