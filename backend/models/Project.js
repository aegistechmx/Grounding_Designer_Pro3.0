// backend/models/Project.js
// Modelo de proyecto para PostgreSQL

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_designer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

class Project {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.description = data.description;
    this.voltageLevel = data.voltageLevel;
    this.soilProfile = data.soilProfile;
    this.gridDesign = data.gridDesign;
    this.simulationResults = data.simulationResults;
    this.complianceStatus = data.complianceStatus;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async findByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => new Project(row));
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new Project(result.rows[0]) : null;
  }

  async save() {
    const result = await pool.query(
      `INSERT INTO projects 
       (id, user_id, name, description, voltage_level, soil_profile, grid_design, 
        simulation_results, compliance_status, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        grid_design = EXCLUDED.grid_design,
        simulation_results = EXCLUDED.simulation_results,
        compliance_status = EXCLUDED.compliance_status,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        this.id, this.userId, this.name, this.description, this.voltageLevel,
        JSON.stringify(this.soilProfile), JSON.stringify(this.gridDesign),
        JSON.stringify(this.simulationResults), JSON.stringify(this.complianceStatus),
        this.status, this.createdAt, this.updatedAt
      ]
    );
    
    return new Project(result.rows[0]);
  }

  async update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date();
    return this.save();
  }

  async delete() {
    await pool.query('DELETE FROM projects WHERE id = $1', [this.id]);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      voltageLevel: this.voltageLevel,
      soilProfile: this.soilProfile,
      gridDesign: this.gridDesign,
      simulationResults: this.simulationResults,
      complianceStatus: this.complianceStatus,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Crear tabla si no existe
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        voltage_level FLOAT,
        soil_profile JSONB,
        grid_design JSONB,
        simulation_results JSONB,
        compliance_status JSONB,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    `);
    
    console.log('✅ Base de datos inicializada');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    // Don't throw - allow the app to continue even if DB init fails
  }
}

initDatabase();

module.exports = Project;
