/**
 * Request Timeout Middleware
 * Prevents hanging requests by setting a timeout
 */

const timeout = require('connect-timeout');

/**
 * Create timeout middleware with configurable duration
 */
function createTimeoutMiddleware(timeoutMs = 30000) {
  return timeout(timeoutMs, {
    respond: true
  });
}

/**
 * Handle timeout errors
 */
function timeoutHandler(err, req, res, next) {
  if (err instanceof timeout.TimeoutError) {
    console.error(`Request timeout: ${req.method} ${req.path}`);
    return res.status(504).json({
      success: false,
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  }
  next(err);
}

module.exports = {
  createTimeoutMiddleware,
  timeoutHandler
};
