import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './hooks/useTheme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Team from './pages/Team';
import Vault from './pages/Vault';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            color: '#000',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/team" element={<Team />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
