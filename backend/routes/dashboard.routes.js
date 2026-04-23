/**
 * Dashboard Routes
 * API endpoints for SaaS dashboard data
 */

import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth';
import dashboardService from '../services/dashboard.service';

/**
 * Get dashboard overview
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const overview = await dashboardService.getDashboardOverview(userId);
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get recent projects
 */
router.get('/recent-projects', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 5;
    const projects = await dashboardService.getRecentProjects(userId, limit);
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get recent projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get usage statistics
 */
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const statistics = await dashboardService.getUsageStatistics(userId);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Get usage statistics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get current month usage
 */
router.get('/current-usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const usage = await dashboardService.getCurrentUsage(userId);
    
    res.json({
      success: true,
      usage
    });
  } catch (error) {
    console.error('Get current usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get activity timeline
 */
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const activities = await dashboardService.getActivityTimeline(userId, limit);
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get activity timeline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get compliance trends
 */
router.get('/compliance-trends', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const months = parseInt(req.query.months) || 6;
    const trends = await dashboardService.getComplianceTrends(userId, months);
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('Get compliance trends error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get top projects
 */
router.get('/top-projects', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const metric = req.query.metric || 'compliance';
    const limit = parseInt(req.query.limit) || 5;
    const projects = await dashboardService.getTopProjects(userId, metric, limit);
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get top projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
