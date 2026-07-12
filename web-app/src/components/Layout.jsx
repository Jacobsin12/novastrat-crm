import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/dashboard/Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.must_change_password === 1) {
        navigate('/change-password');
      } else {
        setUser(parsedUser);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    if (!user) return;
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registrado:', reg.scope);
          
          return Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              return fetch(`${API_BASE}/api/vapid-public-key`)
                .then(res => res.json())
                .then(data => {
                  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
                  
                  return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                  }).then(subscription => {
                    return fetch(`${API_BASE}/api/push-subscribe`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        subscription: subscription.toJSON(),
                        userId: user.id
                      })
                    });
                  });
                });
            } else {
              console.warn('Permiso de notificaciones push rechazado por el usuario.');
            }
          });
        })
        .catch(err => {
          console.error('Error registrando o suscribiendo a Notificaciones Push:', err);
        });
    }
  }, [user]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) return null;

  const isPipeline = location.pathname === '/pipeline';

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />
      <main 
        className="main-content" 
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
      >
        <div style={{ padding: '1.5rem 1.5rem 0 1.5rem', flexShrink: 0 }}>
          <Header toggleSidebar={toggleSidebar} user={user} isSidebarOpen={isSidebarOpen} />
        </div>
        <div 
          className="page-content-scroll" 
          style={{ 
            flex: 1, 
            overflowY: isPipeline ? 'hidden' : 'auto', 
            padding: '0 1.5rem 1.5rem 1.5rem',
            display: isPipeline ? 'flex' : 'block',
            flexDirection: isPipeline ? 'column' : 'initial'
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
