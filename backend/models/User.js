// backend/models/User.js
// Modelo de usuario para PostgreSQL

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_designer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.company = data.company;
    this.professionalLicense = data.professionalLicense;
    this.subscriptionTier = data.subscription_tier;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password, name, company, professional_license, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        hashedPassword,
        userData.name,
        userData.company || null,
        userData.professionalLicense || null,
        userData.subscriptionTier || 'free'
      ]
    );
    
    return new User(result.rows[0]);
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  async save() {
    const result = await pool.query(
      `UPDATE users
       SET email = $1, password = $2, name = $3, company = $4,
           professional_license = $5, subscription_tier = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        this.email,
        this.password,
        this.name,
        this.company,
        this.professionalLicense,
        this.subscriptionTier,
        this.id
      ]
    );
    
    return new User(result.rows[0]);
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      company: this.company,
      professionalLicense: this.professionalLicense,
      subscriptionTier: this.subscriptionTier,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Crear tabla si no existe
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        professional_license VARCHAR(100),
        subscription_tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
    `);
    
    console.log('✅ Tabla de usuarios inicializada');
  } catch (error) {
    console.error('❌ Error al inicializar la tabla de usuarios:', error.message);
  }
}

initDatabase();

module.exports = User;
