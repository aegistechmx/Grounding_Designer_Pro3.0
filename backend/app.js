import express from 'express';
import cors from 'cors';
import calculateRoute from './routes/calculate.js';
import pdfRoutes from './routes/pdf.routes.js';
import { securityHeaders, createRateLimiter, calculationRateLimiter, corsOptions } from './middleware/security.js';
import { sanitizeInput } from './middleware/validation.js';
import { requestLogger, errorLogger, performanceMonitor, requestIdMiddleware } from './middleware/logging.js';

const app = express();

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

// Routes
app.use('/api/calculate', calculateRoute);
app.use('/api/pdf', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IEEE 80 Grounding Calculator API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
