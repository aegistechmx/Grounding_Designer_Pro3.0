// backend/middleware/auth.js
// Autenticación JWT y control de roles

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const roles = {
  ENGINEER: 'engineer',
  SENIOR_ENGINEER: 'senior_engineer',
  ADMIN: 'admin',
  COMPANY_OWNER: 'company_owner'
};

const permissions = {
  [roles.ENGINEER]: ['read:projects', 'create:projects', 'update:projects', 'run:simulations'],
  [roles.SENIOR_ENGINEER]: ['read:projects', 'create:projects', 'update:projects', 'delete:projects', 'run:simulations', 'run:optimizations'],
  [roles.ADMIN]: ['*'],
  [roles.COMPANY_OWNER]: ['*', 'manage:users', 'manage:billing']
};

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de autorización inválido. Use: Bearer <token>' });
  }

  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = permissions[userRole] || [];
    
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes('*') || userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticate, authorize, roles, generateToken };
