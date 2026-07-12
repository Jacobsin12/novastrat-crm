import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { ThemeProvider } from './hooks/useTheme';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Team from './pages/Team';
import Vault from './pages/Vault';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <Router basename={import.meta.env.BASE_URL}>
      <Toaster 
        position="top-right"
        containerStyle={{
          zIndex: 99999,
          top: 30,
          right: 30,
        }}
      >
        {(t) => (
          <div
            className="premium-toast"
            style={{
              background: 'var(--color-bg-card, rgba(255, 255, 255, 0.95))',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border, rgba(0, 0, 0, 0.05))',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              width: '360px',
              position: 'relative',
              pointerEvents: 'auto',
              fontFamily: 'Inter, system-ui, sans-serif',
              animation: t.visible 
                ? 'toastEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
                : 'toastExit 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Icono de app izquierdo */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: t.type === 'error' ? '#ef4444' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
            }}>
              {t.type === 'error' ? '✕' : 'N'}
            </div>

            {/* Contenido principal */}
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main, #0f172a)' }}>
                  {t.type === 'error' ? 'Error' : 'Nova Strat'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>ahora</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-muted, #475569)', lineHeight: 1.4, fontWeight: 500 }}>
                {typeof t.message === 'function' ? t.message(t) : t.message}
              </p>
            </div>

            {/* Botón de cerrar X */}
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s',
                marginTop: '-2px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-card-inner, rgba(0,0,0,0.05))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ✕
            </button>
          </div>
        )}
      </Toaster>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/team" element={<Team />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
