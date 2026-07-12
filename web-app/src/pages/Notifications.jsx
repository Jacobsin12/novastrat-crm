import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertCircle, Trash2, Inbox, ChevronRight, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchNotifications(parsedUser.id);
      
      const interval = setInterval(() => {
        fetchNotifications(parsedUser.id);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchNotifications = async (userId) => {
    const activeUserId = userId || (user ? user.id : null);
    if (!activeUserId) return;
    try {
      // Pedimos un historial amplio de hasta 50 notificaciones
      const res = await fetch(`${API_BASE}/api/notifications?limit=50&userId=${activeUserId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchNotifications(user.id);
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
        toast.success('Notificación marcada como leída');
      }
    } catch (err) {
      toast.error('Error al conectar con el servidor');
    }
  };

  const markAsUnread = async (id, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/unread`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchNotifications(user.id);
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
        toast.success('Notificación marcada como no leída');
      }
    } catch (err) {
      toast.error('Error al conectar con el servidor');
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
        fetchNotifications(user.id);
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (err) {
      toast.error('Error al conectar con el servidor');
    }
  };

  const clearAllHistory = async () => {
    if (!user || notifications.length === 0) return;
    const allIds = notifications.map(n => n.id);

    try {
      const res = await fetch(`${API_BASE}/api/notifications/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ids: allIds })
      });
      if (res.ok) {
        setNotifications([]);
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
        toast.success('Historial de notificaciones limpiado');
      }
    } catch (err) {
      toast.error('Error al conectar con el servidor');
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchNotifications(user.id);
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
        toast.success('Notificación eliminada');
      }
    } catch (err) {
      toast.error('Error al conectar con el servidor');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!user) return;
    if (!notif.read) {
      try {
        await fetch(`${API_BASE}/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        // Despachar evento para actualizar el Header en tiempo real
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.url) {
      navigate(notif.url);
    }
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread') return !n.read;
      if (filter === 'read') return n.read;
      return true; // 'all'
    });

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const NotificationIcon = ({ type }) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'alert':
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return <Bell size={20} color="#3b82f6" />;
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-grid" style={{ display: 'block' }}>
      <div className="card glass-panel notif-page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="title-glass" style={{ margin: '0 0 0.5rem 0' }}>Centro de Notificaciones</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Gestiona todas las alertas y actividades recientes del sistema.</p>
          </div>

          <div className="notif-top-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {filteredNotifications.some(n => !n.read) && (
              <button 
                onClick={markAllRead} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.6rem 1.25rem', 
                  fontSize: '0.85rem', 
                  background: 'var(--color-bg-card-inner, rgba(20, 184, 166, 0.08))', 
                  border: '1px solid var(--color-border, rgba(20, 184, 166, 0.15))', 
                  color: 'var(--color-accent-teal, #14b8a6)', 
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 184, 166, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-card-inner, rgba(20, 184, 166, 0.08))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Check size={16} /> Marcar todas como leídas
              </button>
            )}
            {filteredNotifications.length > 0 && (
              <button 
                onClick={clearAllHistory} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.6rem 1.25rem', 
                  fontSize: '0.85rem', 
                  background: 'rgba(239, 68, 68, 0.06)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  color: '#ef4444', 
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Trash2 size={16} /> Limpiar todo
              </button>
            )}
          </div>
        </div>

        {/* Fichas de Filtro */}
        <div className="notif-filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <button 
            onClick={() => setFilter('all')} 
            style={{ 
              background: filter === 'all' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', 
              border: filter === 'all' ? '1px solid rgba(20, 184, 166, 0.2)' : 'none', 
              color: filter === 'all' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem' 
            }}
          >
            Todas ({notifications.length})
          </button>
          <button 
            onClick={() => setFilter('unread')} 
            style={{ 
              background: filter === 'unread' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', 
              border: filter === 'unread' ? '1px solid rgba(20, 184, 166, 0.2)' : 'none', 
              color: filter === 'unread' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem' 
            }}
          >
            No leídas ({notifications.filter(n => !n.read).length})
          </button>
          <button 
            onClick={() => setFilter('read')} 
            style={{ 
              background: filter === 'read' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', 
              border: filter === 'read' ? '1px solid rgba(20, 184, 166, 0.2)' : 'none', 
              color: filter === 'read' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '20px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem' 
            }}
          >
            Leídas ({notifications.filter(n => n.read).length})
          </button>
        </div>

        {/* Lista de Notificaciones */}
        {filteredNotifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-bg-card-inner)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem', boxShadow: 'var(--inner-shadow)', border: '1px solid var(--color-border)' }}>
              <Inbox size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>Sin notificaciones</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '320px', margin: 0 }}>No se encontraron alertas en esta categoría de filtro.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredNotifications.map(notif => {
              const isRead = notif.read;
              return (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`notif-page-item ${isRead ? 'read' : ''}`}
                >
                  <div className="item-main">
                    <div className="notif-icon-container" style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: notif.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : notif.type === 'alert' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: 'var(--inner-shadow)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      flexShrink: 0
                    }}>
                      <NotificationIcon type={notif.type} />
                    </div>
                    
                    <div className="notif-text-wrapper" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <h4 className="notif-item-title" style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: isRead ? 500 : 700 }}>
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent-teal)' }} />
                        )}
                      </div>
                      <p className="notif-item-desc" style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: isRead ? 'var(--color-text-muted)' : 'var(--color-text-main)', opacity: isRead ? 0.8 : 1, lineHeight: 1.4 }}>
                        {notif.desc}
                      </p>
                      <span className="notif-item-time" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatTime(notif.time)}
                      </span>
                    </div>
                  </div>

                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Botón de visto/no visto (ojo) */}
                    {isRead ? (
                      <button 
                        onClick={(e) => markAsUnread(notif.id, e)} 
                        title="Marcar como no leída"
                        className="notif-action-icon-btn"
                      >
                        <EyeOff size={15} />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => markAsRead(notif.id, e)} 
                        title="Marcar como leída"
                        className="notif-action-icon-btn unread"
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    
                    {/* Botón de basura */}
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      title="Eliminar notificación"
                      className="notif-action-icon-btn delete"
                    >
                      <Trash2 size={15} />
                    </button>
                    
                    {notif.url && (
                      <div className="notif-chevron" style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                        <ChevronRight size={18} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
