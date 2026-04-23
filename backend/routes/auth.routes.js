/**
 * Authentication Routes
 * API endpoints for user authentication and registration
 */

import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';
import authService from '../services/auth.service.js';

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.register(userData);
    
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    const user = await authService.getUserById(decoded.userId);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * Update user info
 */
router.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    const user = await authService.updateUser(decoded.userId, req.body);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Check plan limits
 */
router.get('/limits', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    const limits = {
      free: {
        simulations: 10,
        pdfExports: 5,
        excelExports: 10,
        storage: 100 * 1024 * 1024
      },
      pro: {
        simulations: 100,
        pdfExports: 50,
        excelExports: 100,
        storage: 1 * 1024 * 1024 * 1024
      },
      enterprise: {
        simulations: -1,
        pdfExports: -1,
        excelExports: -1,
        storage: 10 * 1024 * 1024 * 1024
      }
    };
    
    const userLimits = limits[decoded.plan] || limits.free;
    
    res.json({
      success: true,
      plan: decoded.plan,
      limits: userLimits
    });
  } catch (error) {
    console.error('Get limits error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
