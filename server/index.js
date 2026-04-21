const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'grounding_db'
});

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ user: result.rows[0], token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE PROYECTOS
// ============================================

app.get('/api/projects', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', auth, async (req, res) => {
  const { name, description, params } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, params) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, name, description, params]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', auth, async (req, res) => {
  const { name, description, params } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, description = $2, params = $3, updated_at = NOW() 
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [name, description, params, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE DISEÑOS
// ============================================

app.get('/api/projects/:projectId/designs', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM designs WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/designs', auth, async (req, res) => {
  const { name, params, results } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO designs (project_id, name, params, results) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.projectId, name, params, results]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE REPORTES
// ============================================

app.get('/api/designs/:designId/reports', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reports WHERE design_id = $1 ORDER BY created_at DESC`,
      [req.params.designId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/designs/:designId/reports', auth, async (req, res) => {
  const { content, format } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO reports (design_id, content, format) 
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.designId, content, format]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
