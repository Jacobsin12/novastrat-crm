import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, User, Shield, Smartphone, BellRing, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/Dashboard.css';

export default function Settings() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // Settings states
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    
    // Check if push notifications are already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, [navigate]);

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      // Request permission
      if (!('Notification' in window)) {
        alert('Este navegador no soporta notificaciones de escritorio.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        // Here you would normally subscribe the user to your Push Service (VAPID/Firebase)
        new Notification('¡Notificaciones Activadas!', {
          body: 'Recibirás alertas importantes aquí.',
          icon: '/vite.svg'
        });
      } else {
        alert('Permiso de notificaciones denegado. Habilítalo desde la configuración de tu navegador.');
      }
    } else {
      // "Disable" logic (visually, since we can't un-grant permission via JS)
      setPushEnabled(false);
      // Here you would normally unsubscribe the user from your Push Service
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />

      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} user={user} />

        <div className="dashboard-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* PERFIL */}
            <div className="card glass-panel" style={{ padding: '2rem' }}>
              <h2 className="title-glass" style={{ marginBottom: '2rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={24} color="var(--color-accent-teal)" /> Mi Perfil
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-teal), var(--color-gold-btn))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)' }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>{user.name}</h3>
                  <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1rem 0', fontSize: '1rem' }}>{user.email}</p>
                  <span style={{ display: 'inline-block', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent-teal)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                    Rol: {user.role === 'admin' ? 'Administrador' : user.role === 'consultant' ? 'Consultor' : 'Cliente'}
                  </span>
                </div>
                <button className="btn-primary" style={{ marginTop: '1rem', width: '100%', maxWidth: '200px', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>Editar Perfil</button>
              </div>
            </div>

            {/* SEGURIDAD */}
            <div className="card glass-panel" style={{ padding: '2rem' }}>
              <h2 className="title-glass" style={{ marginBottom: '2rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={24} color="var(--color-gold-btn)" /> Seguridad
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ background: 'var(--color-bg-card-inner)', padding: '0.75rem', borderRadius: '12px', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <Key size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Contraseña</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Actualiza tu contraseña periódicamente para mayor seguridad.</p>
                    <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cambiar Contraseña</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--color-bg-card-inner)', padding: '0.75rem', borderRadius: '12px', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <Smartphone size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Autenticación 2FA</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Agrega una capa extra de seguridad a tu cuenta.</p>
                    <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--color-accent-teal)', border: '1px solid var(--color-accent-teal)', boxShadow: 'none' }}>Configurar 2FA</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* NOTIFICACIONES */}
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <h2 className="title-glass" style={{ marginBottom: '1.5rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BellRing size={24} color="var(--color-accent-teal)" /> Notificaciones
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-bg-card-inner)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>Notificaciones Push (Web/Móvil)</h4>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Recibe alertas instantáneas sobre nuevos leads y actualizaciones.</p>
                </div>
                
                {/* Custom Toggle Switch */}
                <div 
                  onClick={handlePushToggle}
                  style={{ 
                    width: '50px', height: '28px', background: pushEnabled ? 'var(--color-accent-teal)' : 'var(--color-bg-card-inner)', 
                    borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: pushEnabled ? '0 0 10px rgba(20, 184, 166, 0.4)' : 'var(--inner-shadow)',
                    border: pushEnabled ? 'none' : '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ 
                    width: '22px', height: '22px', background: '#fff', borderRadius: '50%', 
                    position: 'absolute', top: pushEnabled ? '3px' : '2px', left: pushEnabled ? '25px' : '3px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-bg-card-inner)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>Correos Electrónicos</h4>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Resumen semanal y alertas críticas.</p>
                </div>
                
                {/* Custom Toggle Switch */}
                <div 
                  onClick={() => setEmailEnabled(!emailEnabled)}
                  style={{ 
                    width: '50px', height: '28px', background: emailEnabled ? 'var(--color-accent-teal)' : 'var(--color-bg-card-inner)', 
                    borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: emailEnabled ? '0 0 10px rgba(20, 184, 166, 0.4)' : 'var(--inner-shadow)',
                    border: emailEnabled ? 'none' : '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ 
                    width: '22px', height: '22px', background: '#fff', borderRadius: '50%', 
                    position: 'absolute', top: emailEnabled ? '3px' : '2px', left: emailEnabled ? '25px' : '3px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>

            </div>
          </div>

          {/* DANGER ZONE */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', paddingBottom: '2rem' }}>
            <button 
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
