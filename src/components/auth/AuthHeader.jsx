import React from 'react';
import { LogOut, User, Settings, FolderOpen } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const AuthHeader = ({ darkMode, user, onLogout, onOpenProjects }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <User size={20} className="text-white" />
          </div>
          <div>
            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user.email}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {user.emailVerified ? '✅ Verificado' : '⚠️ No verificado'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjects}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-white hover:bg-gray-200 text-gray-700'
            }`}
            title="Mis Proyectos"
          >
            <FolderOpen size={20} />
          </button>
          
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400' 
                : 'bg-red-100 hover:bg-red-200 text-red-600'
            }`}
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthHeader;
