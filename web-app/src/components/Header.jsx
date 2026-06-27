import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, LogOut, CheckCircle2, AlertCircle, X, Check, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import '../styles/Dashboard.css';

export default function Header({ toggleSidebar, user }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nuevo Lead Asignado', desc: 'TechNova se ha registrado.', time: 'Hace 10 min', read: false, type: 'info' },
    { id: 2, title: 'Documento Subido', desc: 'Se subió "Contrato.pdf".', time: 'Hace 2 hrs', read: false, type: 'success' },
    { id: 3, title: 'Firma Pendiente', desc: 'Recuerda firmar el NDA.', time: 'Hace 1 día', read: true, type: 'alert' }
  ]);
  const notifRef = useRef(null);

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Close notifications if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationIcon = ({ type }) => {
    switch(type) {
      case 'success': return <CheckCircle2 size={18} color="#10b981" />;
      case 'alert': return <AlertCircle size={18} color="#f59e0b" />;
      default: return <Bell size={18} color="#3b82f6" />;
    }
  };

  return (
    <header className="top-header glass-panel" style={{ position: 'relative', zIndex: 999 }}>
      <div className="header-toggle">
        <button className="icon-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      {/* Contenedor principal de la derecha */}
      <div className="header-content">
        
        {/* Lupa */}
        <div className="header-search">
          <Search size={18} color="var(--color-text-muted)" />
          <input type="text" placeholder="Buscar..." />
        </div>

        {/* Theme Toggle */}
        <button 
          className="icon-btn" 
          onClick={toggleTheme}
          style={{ 
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-card-inner)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--inner-shadow)'
          }}
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun size={20} color="var(--color-accent-yellow)" /> : <Moon size={20} color="var(--color-accent)" />}
        </button>

        {/* Notificaciones */}
        <div ref={notifRef} className="header-notif">
          <button 
            className={`icon-btn ${showNotifications ? 'active' : ''}`} 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              position: 'relative', 
              background: showNotifications ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={22} color={showNotifications ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
            {unreadCount > 0 && <span className="badge" style={{ top: 0, right: 0 }}>{unreadCount}</span>}
          </button>

          {/* Modal de Notificaciones */}
          {showNotifications && (
            <div className="notifications-modal glass-panel">
              <div className="notif-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className="notif-body">
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>No tienes notificaciones nuevas.</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notif-icon-wrapper" style={{ background: notif.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : notif.type === 'alert' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                        <NotificationIcon type={notif.type} />
                      </div>
                      <div className="notif-content">
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: !notif.read ? 600 : 400 }}>{notif.title}</h4>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{notif.desc}</p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{notif.time}</span>
                      </div>
                      {!notif.read && <div className="unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              
              <div className="notif-footer">
                <button style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%', padding: '0.5rem' }}>Ver todas las notificaciones</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Avatar y Salir */}
        <div className="header-user">
          {/* Botón de Logout (Oculto en móvil por CSS) */}
          <button className="icon-btn hide-on-mobile" onClick={handleLogout} title="Cerrar sesión" style={{ color: '#ef4444' }}>
            <LogOut size={20} />
          </button>

          {/* Avatar */}
          <div className="avatar" style={{background: 'var(--color-accent)', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold'}}>
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
