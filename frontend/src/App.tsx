// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';
import { ProjectEditor } from './pages/ProjectEditor';
import { SimulationView } from './pages/SimulationView';
import { ComplianceReport } from './pages/ComplianceReport';
import { Login } from './pages/Login';
import { isAuthenticated } from './services/auth.service';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/projects/:id" element={
          <PrivateRoute>
            <ProjectEditor />
          </PrivateRoute>
        } />
        <Route path="/simulation/:simulationId" element={
          <PrivateRoute>
            <SimulationView />
          </PrivateRoute>
        } />
        <Route path="/compliance/:projectId" element={
          <PrivateRoute>
            <ComplianceReport />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
