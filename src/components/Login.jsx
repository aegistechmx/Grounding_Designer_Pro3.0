// src/components/Login.jsx
import React, { useState } from 'react';
import { authService } from '../services/auth.service';

export const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let result;
      if (isLogin) {
        result = authService.login(username, password);
      } else {
        result = authService.register(username, password, email);
      }
      
      onLogin?.(result.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
      <div className="bg-gray-800 rounded-xl p-8 w-96 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">⚡ Grounding Designer Pro</h1>
        <h2 className="text-xl text-center mb-6">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
          >
            {isLogin ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>
        
        <div className="text-center mt-4 text-sm text-gray-400">
          <button onClick={() => setIsLogin(!isLogin)} className="hover:text-white">
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
