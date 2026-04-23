/**
 * Version Service
 * Handles project versioning and comparison
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

class VersionService {
  /**
   * Create new project version
   */
  async createVersion(projectId, simulationId, versionData = {}) {
    const { versionName, description } = versionData;
    
    try {
      // Get current max version number
      const result = await pool.query(
        'SELECT MAX(version_number) as max_version FROM project_versions WHERE project_id = $1',
        [projectId]
      );
      
      const currentMax = result.rows[0].max_version || 0;
      const newVersionNumber = currentMax + 1;
      
      // Set previous current version to false
      await pool.query(
        'UPDATE project_versions SET is_current = false WHERE project_id = $1',
        [projectId]
      );
      
      // Insert new version
      const insertResult = await pool.query(
        `INSERT INTO project_versions (project_id, simulation_id, version_number, version_name, description, is_current)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [projectId, simulationId, newVersionNumber, versionName || `v${newVersionNumber}`, description]
      );
      
      // Update simulation version number
      await pool.query(
        'UPDATE simulations SET version_number = $1 WHERE id = $2',
        [newVersionNumber, simulationId]
      );
      
      return insertResult.rows[0];
    } catch (error) {
      throw new Error(`Failed to create version: ${error.message}`);
    }
  }

  /**
   * Get all versions for a project
   */
  async getProjectVersions(projectId) {
    try {
      const result = await pool.query(
        `SELECT pv.*, s.params, s.results, s.created_at as simulation_date
         FROM project_versions pv
         JOIN simulations s ON pv.simulation_id = s.id
         WHERE pv.project_id = $1
         ORDER BY pv.version_number DESC`,
        [projectId]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get versions: ${error.message}`);
    }
  }

  /**
   * Get current version of a project
   */
  async getCurrentVersion(projectId) {
    try {
      const result = await pool.query(
        `SELECT pv.*, s.params, s.results, s.created_at as simulation_date
         FROM project_versions pv
         JOIN simulations s ON pv.simulation_id = s.id
         WHERE pv.project_id = $1 AND pv.is_current = true
         LIMIT 1`,
        [projectId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('No current version found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get current version: ${error.message}`);
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(projectId, version1, version2) {
    try {
      const result = await pool.query(
        `SELECT pv.*, s.params, s.results
         FROM project_versions pv
         JOIN simulations s ON pv.simulation_id = s.id
         WHERE pv.project_id = $1 AND pv.version_number IN ($2, $3)
         ORDER BY pv.version_number`,
        [projectId, version1, version2]
      );
      
      if (result.rows.length < 2) {
        throw new Error('Not enough versions to compare');
      }
      
      const v1 = result.rows[0];
      const v2 = result.rows[1];
      
      const r1 = v1.results;
      const r2 = v2.results;
      
      // Calculate differences
      const differences = {
        Rg: {
          v1: r1.Rg,
          v2: r2.Rg,
          change: r2.Rg - r1.Rg,
          changePercent: ((r2.Rg - r1.Rg) / r1.Rg * 100).toFixed(2)
        },
        GPR: {
          v1: r1.GPR,
          v2: r2.GPR,
          change: r2.GPR - r1.GPR,
          changePercent: ((r2.GPR - r1.GPR) / r1.GPR * 100).toFixed(2)
        },
        Em: {
          v1: r1.Em,
          v2: r2.Em,
          change: r2.Em - r1.Em,
          changePercent: ((r2.Em - r1.Em) / r1.Em * 100).toFixed(2)
        },
        Es: {
          v1: r1.Es,
          v2: r2.Es,
          change: r2.Es - r1.Es,
          changePercent: ((r2.Es - r1.Es) / r1.Es * 100).toFixed(2)
        },
        compliance: {
          v1: r1.complies,
          v2: r2.complies,
          changed: r1.complies !== r2.complies
        }
      };
      
      // Calculate cost difference
      const cost1 = this.estimateCost(v1.params);
      const cost2 = this.estimateCost(v2.params);
      
      differences.cost = {
        v1: cost1,
        v2: cost2,
        change: cost2 - cost1,
        changePercent: ((cost2 - cost1) / cost1 * 100).toFixed(2)
      };
      
      return {
        version1: {
          number: v1.version_number,
          name: v1.version_name,
          date: v1.simulation_date
        },
        version2: {
          number: v2.version_number,
          name: v2.version_name,
          date: v2.simulation_date
        },
        differences,
        improvement: this.calculateImprovement(differences)
      };
    } catch (error) {
      throw new Error(`Failed to compare versions: ${error.message}`);
    }
  }

  /**
   * Set current version
   */
  async setCurrentVersion(projectId, versionNumber) {
    try {
      // Set all versions to false
      await pool.query(
        'UPDATE project_versions SET is_current = false WHERE project_id = $1',
        [projectId]
      );
      
      // Set specified version to true
      const result = await pool.query(
        `UPDATE project_versions 
         SET is_current = true 
         WHERE project_id = $1 AND version_number = $2
         RETURNING *`,
        [projectId, versionNumber]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Version not found');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to set current version: ${error.message}`);
    }
  }

  /**
   * Delete version
   */
  async deleteVersion(projectId, versionNumber) {
    try {
      const result = await pool.query(
        `DELETE FROM project_versions 
         WHERE project_id = $1 AND version_number = $2
         RETURNING *`,
        [projectId, versionNumber]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Version not found');
      }
      
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete version: ${error.message}`);
    }
  }

  /**
   * Estimate cost from params
   */
  estimateCost(params) {
    const { gridLength, gridWidth, numParallel, numParallelY, numRods } = params;
    const totalConductor = (numParallel * gridLength) + (numParallelY * gridWidth);
    const conductorCost = totalConductor * 12;
    const rodCost = numRods * 25;
    return conductorCost + rodCost;
  }

  /**
   * Calculate overall improvement score
   */
  calculateImprovement(differences) {
    let score = 0;
    
    // Resistance improvement (lower is better)
    if (differences.Rg.change < 0) {
      score += Math.abs(differences.Rg.changePercent) * 0.3;
    }
    
    // Voltage improvement (lower is better)
    if (differences.Em.change < 0) {
      score += Math.abs(differences.Em.changePercent) * 0.2;
    }
    if (differences.Es.change < 0) {
      score += Math.abs(differences.Es.changePercent) * 0.2;
    }
    
    // Compliance improvement
    if (differences.compliance.changed && differences.compliance.v2) {
      score += 30;
    }
    
    // Cost improvement (lower is better)
    if (differences.cost.change < 0) {
      score += Math.abs(differences.cost.changePercent) * 0.3;
    }
    
    return Math.min(Math.round(score), 100);
  }
}

module.exports = new VersionService();
