// Enhanced error logging and monitoring middleware
const path = require('path');

// Request logging middleware
module.exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request details
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Log response details
    console.log(`[${timestamp}] ${req.method} ${req.path} - Status: ${status} - Duration: ${duration}ms`);
    
    // Log errors for debugging
    if (status >= 400) {
      console.error(`[${timestamp}] Error Response:`, {
        method: req.method,
        path: req.path,
        status,
        body: data,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Error logging middleware
module.exports.errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] Unhandled Error:`, {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Send generic error response to avoid leaking sensitive information
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp,
    requestId: generateRequestId()
  });
};

// Generate unique request ID for tracking
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Performance monitoring middleware
module.exports.performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    // Log slow requests (>2 seconds)
    if (duration > 2000) {
      console.warn(`[${timestamp}] Slow Request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Track performance metrics
    const performanceData = {
      timestamp,
      method: req.method,
      path: req.path,
      duration,
      statusCode: res.statusCode,
      ip: req.ip
    };
    
    // In production, you would send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // monitoringService.trackPerformance(performanceData);
      console.log('Performance Data:', performanceData);
    }
  });
  
  next();
};

// Request ID middleware for tracking
module.exports.requestIdMiddleware = (req, res, next) => {
  req.requestId = generateRequestId();
  res.set('X-Request-ID', req.requestId);
  next();
};
