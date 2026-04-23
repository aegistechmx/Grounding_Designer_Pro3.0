/**
 * Authentication Service
 * JWT-based authentication with role-based access control
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, firstName, lastName, role = 'engineer', plan = 'free' } = userData;
    
    try {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Insert user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, plan)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, role, plan, created_at`,
        [email, passwordHash, firstName, lastName, role, plan]
      );
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          plan: user.plan
        },
        token
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        throw new Error('Invalid credentials');
      }
      
      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      // Generate JWT token
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          plan: user.plan
        },
        token
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    };
    
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role, plan, created_at, last_login FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        plan: user.plan,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    try {
      const { firstName, lastName, role, plan } = updateData;
      
      const result = await pool.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             role = COALESCE($3, role),
             plan = COALESCE($4, plan),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING id, email, first_name, last_name, role, plan`,
        [firstName, lastName, role, plan, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        plan: user.plan
      };
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Check user permissions
   */
  checkPermission(userRole, requiredRole) {
    const roleHierarchy = {
      viewer: 1,
      engineer: 2,
      admin: 3
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check plan limits
   */
  checkPlanLimits(userPlan, usage) {
    const limits = {
      free: {
        simulations: 10,
        pdfExports: 5,
        excelExports: 10,
        storage: 100 * 1024 * 1024 // 100MB
      },
      pro: {
        simulations: 100,
        pdfExports: 50,
        excelExports: 100,
        storage: 1 * 1024 * 1024 * 1024 // 1GB
      },
      enterprise: {
        simulations: -1, // unlimited
        pdfExports: -1,
        excelExports: -1,
        storage: 10 * 1024 * 1024 * 1024 // 10GB
      }
    };
    
    const planLimit = limits[userPlan] || limits.free;
    
    if (planLimit.simulations === -1) {
      return { allowed: true };
    }
    
    const { simulationCount, pdfExportCount, excelExportCount, storageUsed } = usage;
    
    if (simulationCount >= planLimit.simulations) {
      return { allowed: false, reason: 'Simulation limit reached' };
    }
    
    if (pdfExportCount >= planLimit.pdfExports) {
      return { allowed: false, reason: 'PDF export limit reached' };
    }
    
    if (excelExportCount >= planLimit.excelExports) {
      return { allowed: false, reason: 'Excel export limit reached' };
    }
    
    if (storageUsed >= planLimit.storage) {
      return { allowed: false, reason: 'Storage limit reached' };
    }
    
    return { allowed: true };
  }
}

module.exports = new AuthService();
