require('dotenv/config');
const { validateEnv } = require('./config/envValidation.js');

// Validate environment variables at startup
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  console.error('\nPlease check your .env file and ensure all required environment variables are set.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const calculateRoute = require('./routes/calculate.js');
const pdfRoutes = require('./routes/pdf.routes.js');
const projectsRoutes = require('./routes/projects.routes.js');
const simulationRoutes = require('./routes/simulation.routes.js');
const reportsRoutes = require('./routes/reports.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const pricingRoutes = require('./routes/pricing.routes.js');
const batchRoutes = require('./routes/batch.routes.js');
const billingRoutes = require('./routes/billing.routes.js');
const { securityHeaders, createRateLimiter, calculationRateLimiter, pricingRateLimiter, corsOptions, authRateLimiter } = require('./middleware/security.js');
const { sanitizeInput } = require('./middleware/validation.js');
const { requestLogger, errorLogger, performanceMonitor, requestIdMiddleware } = require('./middleware/logging.js');
const { createTimeoutMiddleware, timeoutHandler } = require('./middleware/timeout.js');
const socketService = require('./services/collaboration/socket.service.js');

const app = express();
const server = createServer(app);

// Logging and monitoring middleware
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(performanceMonitor);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);

// Performance middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Skip compression for already-compressed content types
    const contentType = res.getHeader('Content-Type');
    if (contentType) {
      const skipTypes = [
        'application/pdf',
        'application/zip',
        'application/x-gzip',
        'application/gzip',
        'image/',
        'video/',
        'audio/'
      ];
      return !skipTypes.some(type => contentType.includes(type));
    }
    return true;
  }
}));
app.use(createTimeoutMiddleware(30000)); // 30 second timeout

// Rate limiting
app.use(createRateLimiter());

// Error handling middleware (must be last)
app.use(timeoutHandler);
app.use(errorLogger);

// SaaS API Routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pricing', pricingRateLimiter, pricingRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/billing', billingRoutes);

// Legacy Routes (maintain backward compatibility)
app.use('/api/calculate', calculateRoute);
app.use('/api/pdf', pdfRoutes);

// Serve generated files (PDFs, etc.)
app.use('/files', express.static(path.join(process.cwd(), 'outputs')));

// Serve local storage files
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'grounding-saas' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Grounding Designer Pro SaaS API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints:`);
  console.log(`  - /api/auth (authentication)`);
  console.log(`  - /api/projects (project management)`);
  console.log(`  - /api/simulation (IEEE 80 & FEM simulations)`);
  console.log(`  - /api/reports (PDF/Excel/DXF generation)`);
  console.log(`  - /api/dashboard (SaaS dashboard)`);
  console.log(`  - /api/pricing (pricing & billing)`);
  console.log(`  - /api/batch (multi-export & ZIP generation)`);
  console.log(`  - /api/billing (Stripe checkout & webhooks)`);
  console.log(`  - /files (serving generated PDFs)`);
  console.log(`  - Socket.IO (real-time collaboration)`);
});

// Initialize Socket.IO
socketService.initialize(server);
