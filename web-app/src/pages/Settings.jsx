import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, User, Shield, Smartphone, BellRing, Key, LogOut, Copy, Apple, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/dashboard/Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Estados para cambio de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Estados para 2FA
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isActivating2fa, setIsActivating2fa] = useState(false);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    if (getPasswordStrength(newPassword) < 100) {
      toast.error('La nueva contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }
    
    setIsSavingPassword(true);
    const toastId = toast.loading('Actualizando contraseña...');
    
    try {
      const response = await fetch(`${API_BASE}/api/users/change-password-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('¡Contraseña actualizada correctamente!', { id: toastId });
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        const updated = { ...user, must_change_password: 0 };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      } else {
        toast.error(data.error || 'Error al actualizar contraseña.', { id: toastId });
      }
    } catch (err) {
      toast.error('Error de red al actualizar contraseña.', { id: toastId });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSetup2fa = async () => {
    if (is2faEnabled) {
      if (!window.confirm('¿Estás seguro de que deseas desactivar la verificación en dos pasos (2FA)?')) return;
      const toastId = toast.loading('Desactivando 2FA...');
      try {
        const res = await fetch(`${API_BASE}/api/auth/2fa/disable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        if (res.ok) {
          toast.success('2FA desactivado con éxito.', { id: toastId });
          setIs2faEnabled(false);
        } else {
          toast.error('Error al desactivar 2FA.', { id: toastId });
        }
      } catch (err) {
        toast.error('Error de red al desactivar 2FA.', { id: toastId });
      }
      return;
    }

    const toastId = toast.loading('Generando secreto 2FA...');
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupSecret(data.secret);
        const encodedUrl = encodeURIComponent(data.otpauthUrl);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
        setSetupQrUrl(qrUrl);
        setIs2faModalOpen(true);
        toast.dismiss(toastId);
      } else {
        toast.error('Error al iniciar configuración 2FA.', { id: toastId });
      }
    } catch (err) {
      toast.error('Error de red al configurar 2FA.', { id: toastId });
    }
  };

  const handleVerify2fa = async (e) => {
    e.preventDefault();
    setIsActivating2fa(true);
    const toastId = toast.loading('Confirmando código...');
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify-enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: verificationCode })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('¡2FA activado correctamente!', { id: toastId });
        setIs2faEnabled(true);
        setIs2faModalOpen(false);
        setVerificationCode('');
      } else {
        toast.error(data.error || 'Código incorrecto.', { id: toastId });
      }
    } catch (err) {
      toast.error('Error de red al confirmar código.', { id: toastId });
    } finally {
      setIsActivating2fa(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Consultar estado 2FA
      fetch(`${API_BASE}/api/users/${parsedUser.id}/2fa-status`)
        .then(res => res.json())
        .then(data => setIs2faEnabled(data.enabled))
        .catch(err => console.error('Error fetching 2FA status:', err));
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
        toast.error('Tu dispositivo no soporta notificaciones web. En iPhone, intenta "Agregar a Inicio" esta página.');
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
        toast.error('Permiso denegado. Habilítalo desde la configuración de tu navegador.');
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
    <>
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
                    <button onClick={() => setIsPasswordModalOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cambiar Contraseña</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--color-bg-card-inner)', padding: '0.75rem', borderRadius: '12px', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <Smartphone size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>Autenticación 2FA</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Agrega una capa extra de seguridad a tu cuenta.</p>
                    <button onClick={handleSetup2fa} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: is2faEnabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: is2faEnabled ? '#ef4444' : 'var(--color-accent-teal)', border: is2faEnabled ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--color-accent-teal)', boxShadow: 'none' }}>
                      {is2faEnabled ? 'Desactivar 2FA' : 'Configurar 2FA'}
                    </button>
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
                    width: '46px', height: '26px', background: pushEnabled ? 'var(--color-accent-teal)' : 'rgba(255,255,255,0.05)', 
                    borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: pushEnabled ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'var(--inner-shadow)',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', background: '#fff', borderRadius: '50%', 
                    transform: pushEnabled ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
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
                    width: '46px', height: '26px', background: emailEnabled ? 'var(--color-accent-teal)' : 'rgba(255,255,255,0.05)', 
                    borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: emailEnabled ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'var(--inner-shadow)',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', background: '#fff', borderRadius: '50%', 
                    transform: emailEnabled ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
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

      {/* PASSWORD CHANGE MODAL */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>Cambiar Contraseña</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Contraseña Actual</label>
                <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }} placeholder="Introduce tu clave actual" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nueva Contraseña</label>
                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }} placeholder="Mínimo 8 caracteres" />
                
                {/* Strength Indicator */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                    <span>Fuerza de la contraseña</span>
                    <strong>
                      {getPasswordStrength(newPassword) === 0 ? 'Vacía' : 
                       getPasswordStrength(newPassword) <= 25 ? 'Débil 🔴' : 
                       getPasswordStrength(newPassword) <= 50 ? 'Regular 🟡' : 
                       getPasswordStrength(newPassword) <= 75 ? 'Buena 🔵' : 'Excelente/Segura 🟢'}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-card-inner)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: `${getPasswordStrength(newPassword)}%`, height: '100%', transition: 'all 0.3s ease', background: 
                      getPasswordStrength(newPassword) <= 25 ? '#ef4444' : 
                      getPasswordStrength(newPassword) <= 50 ? '#f59e0b' : 
                      getPasswordStrength(newPassword) <= 75 ? '#3b82f6' : '#10b981'
                    }} />
                  </div>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    <li style={{ color: newPassword.length >= 8 ? '#10b981' : 'inherit' }}>Mínimo 8 caracteres</li>
                    <li style={{ color: /[A-Z]/.test(newPassword) ? '#10b981' : 'inherit' }}>Al menos una mayúscula (A-Z)</li>
                    <li style={{ color: /[0-9]/.test(newPassword) ? '#10b981' : 'inherit' }}>Al menos un número (0-9)</li>
                    <li style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? '#10b981' : 'inherit' }}>Al menos un carácter especial (!@#$%, etc.)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Confirmar Nueva Contraseña</label>
                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }} placeholder="Repite la nueva clave" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>Las contraseñas no coinciden.</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => { setIsPasswordModalOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={isSavingPassword || newPassword !== confirmPassword || getPasswordStrength(newPassword) < 100}>
                  {isSavingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {is2faModalOpen && (
        <div className="modal-2fa-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-panel modal-2fa-panel" style={{ width: '100%', maxWidth: '750px', padding: '1.5rem', background: 'var(--color-bg-overlay)' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Configurar Verificación en Dos Pasos (2FA)</h3>
            
            {/* Layout horizontal: QR a la izquierda, instrucciones + form a la derecha */}
            <div className="modal-2fa-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* Columna izquierda: QR + Secret + Download */}
              <div className="modal-2fa-qr-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minWidth: '220px', background: 'var(--color-bg-card-inner)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                {setupQrUrl && (
                  <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '10px' }}>
                    <img src={setupQrUrl} alt="Google Authenticator QR Code" className="modal-2fa-qr-img" style={{ display: 'block', width: '180px', height: '180px' }} />
                  </div>
                )}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Clave manual de respaldo</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <code style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-gold-btn)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'Courier New, monospace', wordBreak: 'break-all' }}>
                      {setupSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(setupSecret).then(() => {
                          toast.success('Clave copiada al portapapeles');
                        }).catch(() => {
                          toast.error('No se pudo copiar');
                        });
                      }}
                      title="Copiar clave"
                      style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.25rem 0.4rem', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-bg-card-inner)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600 }}>
                    <Apple size={13} /> iOS
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-bg-card-inner)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600 }}>
                    <Smartphone size={13} /> Android
                  </a>
                </div>
              </div>

              {/* Columna derecha: Instrucciones + Form */}
              <div className="modal-2fa-form-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '250px' }}>
                {/* Tutorial compacto */}
                <div style={{ background: 'var(--color-bg-card-inner)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.45' }}>
                  <strong style={{ color: 'var(--color-text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                    <Lightbulb size={15} color="var(--color-gold-btn)" /> Instrucciones:
                  </strong>
                  <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    <li>Descarga <strong>Google Authenticator</strong> en tu teléfono.</li>
                    <li>Abre la app, toca (+) y selecciona <strong>Escanear QR</strong>.</li>
                    <li>Escanea el código QR.</li>
                    <li>Ingresa abajo el código de 6 dígitos generado.</li>
                  </ol>
                </div>

                {/* Form de Validación */}
                <form onSubmit={handleVerify2fa} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Código de 6 dígitos</label>
                    <input 
                      required 
                      type="text" 
                      maxLength={6}
                      pattern="\d{6}"
                      value={verificationCode} 
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))} 
                      placeholder="123456" 
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontSize: '1.25rem', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div className="modal-2fa-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <button type="button" onClick={() => { setIs2faModalOpen(false); setVerificationCode(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>Cancelar</button>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} disabled={isActivating2fa || verificationCode.length !== 6}>
                      {isActivating2fa ? 'Activando...' : 'Verificar y Activar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
