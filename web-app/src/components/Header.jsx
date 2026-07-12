import { API_BASE } from '../config.js';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, LogOut, CheckCircle2, AlertCircle, X, Check, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import '../styles/dashboard/Layout.css';

export default function Header({ toggleSidebar, user, isSidebarOpen }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Hace un momento';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/notifications?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllRead = async () => {
    if (!user || notifications.length === 0) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ids: unreadIds })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotifClick = () => {
    if (window.innerWidth <= 1024) {
      navigate('/notifications');
    } else {
      setShowNotifications(!showNotifications);
    }
  };

  const handleNotificationItemClick = (notif) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.url) {
      navigate(notif.url);
    }
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

  // Sync notifications on load, window custom storage event (from Notifications page), and setup poll
  useEffect(() => {
    fetchNotifications();
    
    const handleStorageSync = () => {
      fetchNotifications();
    };
    window.addEventListener('storage', handleStorageSync);
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [user]);

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
      {!isSidebarOpen && (
        <div className="header-toggle">
          <button className="icon-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Contenedor principal de la derecha */}
      <div className="header-content">
        
        {/* Lupa */}
        <div className="header-search">
          <Search size={18} color="var(--color-text-muted)" />
          <input type="text" placeholder="Buscar..." />
        </div>
        {/* Agrupador de Acciones a la Derecha */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
              onClick={handleNotifClick}
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
                    notifications.map(notif => {
                      const isRead = notif.read;
                      return (
                        <div 
                          key={notif.id} 
                          className={`notif-item ${!isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationItemClick(notif)}
                        >
                          <div className="notif-icon-wrapper" style={{ background: notif.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : notif.type === 'alert' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                            <NotificationIcon type={notif.type} />
                          </div>
                          <div className="notif-content">
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: !isRead ? 600 : 400 }}>{notif.title}</h4>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{notif.desc}</p>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatTime(notif.time)}</span>
                          </div>
                          {!isRead && <div className="unread-dot"></div>}
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="notif-footer">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%', padding: '0.5rem' }}
                  >
                    Ver todas las notificaciones
                  </button>
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
            <div 
              className="avatar" 
              onClick={() => navigate('/settings')}
              style={{
                background: 'var(--color-accent)', 
                color: '#fff', 
                width: '36px', 
                height: '36px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: '50%', 
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, filter 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              title="Configuración de Perfil"
            >
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
