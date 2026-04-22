// src/services/auth.service.js
// Servicio de autenticación compatible con navegador (sin dependencias Node.js)

// Usuarios almacenados en localStorage
const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('grounding_users') || '[]');
  } catch (error) {
    console.error('Error parsing users:', error);
    return [];
  }
};
const setUsers = (users) => {
  try {
    localStorage.setItem('grounding_users', JSON.stringify(users || []));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Generar hash simple (para demo - en producción usar bcrypt en backend)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Generar token simple (para demo - en producción usar JWT en backend)
const generateToken = (userId) => {
  return btoa(`${userId}-${Date.now()}-${Math.random()}`);
};

export const authService = {
  register(username, password, email) {
    const users = getUsers();
    
    // Verificar si usuario existe
    if (users.find(u => u.username === username)) {
      throw new Error('El usuario ya existe');
    }
    
    const hashedPassword = simpleHash(password);
    const newUser = {
      id: Date.now(),
      username,
      password: hashedPassword,
      email,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    setUsers(users);
    
    const token = generateToken(newUser.id);
    const user = { id: newUser.id, username, email };
    localStorage.setItem('grounding_token', token);
    localStorage.setItem('grounding_user', JSON.stringify(user));
    
    return { token, user };
  },
  
  login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    const hashedPassword = simpleHash(password);
    if (user.password !== hashedPassword) {
      throw new Error('Contraseña incorrecta');
    }
    
    const token = generateToken(user.id);
    const userWithoutPassword = { id: user.id, username, email: user.email };
    localStorage.setItem('grounding_token', token);
    localStorage.setItem('grounding_user', JSON.stringify(userWithoutPassword));
    
    return { token, user: userWithoutPassword };
  },
  
  verifyToken(token) {
    try {
      const userStr = localStorage.getItem('grounding_user');
      const tokenStr = localStorage.getItem('grounding_token');
      return userStr && tokenStr === token ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },
  
  logout() {
    localStorage.removeItem('grounding_token');
    localStorage.removeItem('grounding_user');
  },
  
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('grounding_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing current user:', error);
      return null;
    }
  },
  
  isAuthenticated() {
    return !!localStorage.getItem('grounding_token');
  }
};
