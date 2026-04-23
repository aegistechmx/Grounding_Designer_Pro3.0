import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import calculateRoute from './routes/calculate.js';
import pdfRoutes from './routes/pdf.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import batchRoutes from './routes/batch.routes.js';
import billingRoutes from './routes/billing.routes.js';
import { securityHeaders, createRateLimiter, calculationRateLimiter, pricingRateLimiter, corsOptions } from './middleware/security.js';
import { sanitizeInput } from './middleware/validation.js';
import { requestLogger, errorLogger, performanceMonitor, requestIdMiddleware } from './middleware/logging.js';
import socketService from './services/collaboration/socket.service.js';

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

// Rate limiting
app.use(createRateLimiter());

// Error handling middleware (must be last)
app.use(errorLogger);

// SaaS API Routes
app.use('/api/auth', authRoutes);
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
