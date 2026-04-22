// backend/server.js
// Servidor principal SaaS industrial

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Importar rutas
const authRoutes = require('./api/auth.routes');
const projectsRoutes = require('./api/projects.routes');
const simulationRoutes = require('./api/simulation.routes');
const exportRoutes = require('./api/export.routes');
const billingRoutes = require('./api/billing.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración Redis para colas
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Colas de trabajo
const femQueue = new Queue('fem-simulations', { connection: redisConnection });
const aiDesignQueue = new Queue('ai-designs', { connection: redisConnection });
const optimizationQueue = new Queue('optimizations', { connection: redisConnection });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes, intente más tarde'
}));

// Logging
const logger = require('./services/logger.service');

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const redisStatus = await redisConnection.ping().then(() => true).catch(() => false);
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      queues: {
        fem: redisStatus,
        ai: redisStatus,
        optimization: redisStatus
      },
      redis: redisStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handler global
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Grounding Designer Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
