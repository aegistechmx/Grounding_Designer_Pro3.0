/**
 * Dashboard Service
 * Provides project history, metrics, and consumption data for SaaS dashboard
 */

import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

class DashboardService {
  /**
   * Get dashboard overview for user
   */
  async getDashboardOverview(userId) {
    try {
      // Get project count
      const projectsResult = await pool.query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM projects WHERE user_id = $1',
        [userId]
      );
      
      // Get simulation count
      const simulationsResult = await pool.query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = completed) as completed FROM simulations s JOIN projects p ON s.project_id = p.id WHERE p.user_id = $1',
        [userId]
      );
      
      // Get report count
      const reportsResult = await pool.query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = completed) as completed FROM reports r JOIN projects p ON r.project_id = p.id WHERE p.user_id = $1',
        [userId]
      );
      
      // Get compliance statistics
      const complianceResult = await pool.query(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE results->>'complies' = 'true') as compliant,
           COUNT(*) FILTER (WHERE results->>'complies' = 'false') as non_compliant
         FROM simulations s
         JOIN projects p ON s.project_id = p.id
         WHERE p.user_id = $1 AND s.status = 'completed'`,
        [userId]
      );
      
      return {
        projects: projectsResult.rows[0],
        simulations: simulationsResult.rows[0],
        reports: reportsResult.rows[0],
        compliance: complianceResult.rows[0]
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error.message}`);
    }
  }

  /**
   * Get recent projects
   */
  async getRecentProjects(userId, limit = 5) {
    try {
      const result = await pool.query(
        `SELECT p.*, 
           (SELECT COUNT(*) FROM simulations WHERE project_id = p.id) as simulation_count,
           (SELECT COUNT(*) FROM reports WHERE project_id = p.id) as report_count
         FROM projects p
         WHERE p.user_id = $1 AND p.is_active = true
         ORDER BY p.updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get recent projects: ${error.message}`);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM usage_tracking 
         WHERE user_id = $1 
         ORDER BY period_start DESC 
         LIMIT 12`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }
  }

  /**
   * Get current month usage
   */
  async getCurrentUsage(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM usage_tracking 
         WHERE user_id = $1 
         AND period_start = DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        // Create new usage record for current month
        await pool.query(
          `INSERT INTO usage_tracking (user_id, simulation_count, pdf_export_count, excel_export_count, storage_used)
           VALUES ($1, 0, 0, 0, 0)`,
          [userId]
        );
        
        return {
          user_id: userId,
          simulation_count: 0,
          pdf_export_count: 0,
          excel_export_count: 0,
          storage_used: 0,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString()
        };
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get current usage: ${error.message}`);
    }
  }

  /**
   * Get activity timeline
   */
  async getActivityTimeline(userId, limit = 10) {
    try {
      const activities = [];
      
      // Recent simulations
      const simulations = await pool.query(
        `SELECT s.id, s.created_at, 'simulation' as type, p.name as project_name, s.status
         FROM simulations s
         JOIN projects p ON s.project_id = p.id
         WHERE p.user_id = $1
         ORDER BY s.created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      simulations.rows.forEach(s => {
        activities.push({
          id: s.id,
          type: 'simulation',
          project: s.project_name,
          status: s.status,
          date: s.created_at,
          description: `Simulation ${s.status}`
        });
      });
      
      // Recent reports
      const reports = await pool.query(
        `SELECT r.id, r.created_at, 'report' as type, p.name as project_name, r.report_type, r.status
         FROM reports r
         JOIN projects p ON r.project_id = p.id
         WHERE p.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      reports.rows.forEach(r => {
        activities.push({
          id: r.id,
          type: 'report',
          project: r.project_name,
          status: r.status,
          date: r.created_at,
          description: `${r.report_type.toUpperCase()} report ${r.status}`
        });
      });
      
      // Sort by date and limit
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return activities.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get activity timeline: ${error.message}`);
    }
  }

  /**
   * Get compliance trends
   */
  async getComplianceTrends(userId, months = 6) {
    try {
      const result = await pool.query(
        `SELECT 
           DATE_TRUNC('month', s.created_at) as month,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE s.results->>'complies' = 'true') as compliant,
           COUNT(*) FILTER (WHERE s.results->>'complies' = 'false') as non_compliant
         FROM simulations s
         JOIN projects p ON s.project_id = p.id
         WHERE p.user_id = $1 
           AND s.status = 'completed'
           AND s.created_at >= CURRENT_DATE - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', s.created_at)
         ORDER BY month DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get compliance trends: ${error.message}`);
    }
  }

  /**
   * Get top performing projects
   */
  async getTopProjects(userId, metric = 'compliance', limit = 5) {
    try {
      let query;
      if (metric === 'compliance') {
        query = `
          SELECT p.id, p.name, p.updated_at,
                 (SELECT COUNT(*) FROM simulations WHERE project_id = p.id AND results->>'complies' = 'true') as compliant_count,
                 (SELECT COUNT(*) FROM simulations WHERE project_id = p.id) as total_count
          FROM projects p
          WHERE p.user_id = $1 AND p.is_active = true
          ORDER BY compliant_count DESC NULLS LAST
          LIMIT $2
        `;
      } else if (metric === 'recent') {
        query = `
          SELECT p.id, p.name, p.updated_at,
                 (SELECT COUNT(*) FROM simulations WHERE project_id = p.id) as simulation_count
          FROM projects p
          WHERE p.user_id = $1 AND p.is_active = true
          ORDER BY p.updated_at DESC
          LIMIT $2
        `;
      }
      
      const result = await pool.query(query, [userId, limit]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get top projects: ${error.message}`);
    }
  }
}

export default new DashboardService();
