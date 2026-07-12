import { API_BASE } from '../config.js';
import React, { useState } from 'react';
import { Eye, EyeOff, LogOut, ChevronDown, Shield, Key, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const landingUrl = import.meta.env.VITE_LANDING_PAGE_URL && import.meta.env.VITE_LANDING_PAGE_URL !== 'http://localhost:5174' 
    ? import.meta.env.VITE_LANDING_PAGE_URL 
    : (window.location.origin.includes('localhost') ? 'http://localhost:5174' : window.location.origin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterInfo, setShowRegisterInfo] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  // Estados para login 2FA
  const [requires2fa, setRequires2fa] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [totpToken, setTotpToken] = useState('');
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setIsRecovering(true);
    const toastId = toast.loading('Solicitando contraseña temporal...');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Se ha enviado un correo con tu contraseña temporal.', { id: toastId });
        setIsRecoveryModalOpen(false);
        setRecoveryEmail('');
      } else {
        toast.error(data.error || 'Error al solicitar contraseña temporal', { id: toastId });
      }
    } catch (err) {
      toast.error('Error de red al solicitar la recuperación', { id: toastId });
    } finally {
      setIsRecovering(false);
    }
  };

  const handle2faVerifySubmit = async (e) => {
    e.preventDefault();
    setIsVerifying2fa(true);
    const toastId = toast.loading('Verificando código 2FA...');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, token: totpToken })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('¡Autenticación exitosa!', { id: toastId });
        localStorage.setItem('user', JSON.stringify(data));
        if (data.must_change_password === 1) {
          navigate('/change-password');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(data.error || 'Código de verificación incorrecto.', { id: toastId });
      }
    } catch (err) {
      toast.error('Error al verificar 2FA.', { id: toastId });
    } finally {
      setIsVerifying2fa(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const toastId = toast.loading('Iniciando sesión...');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.requires_2fa) {
          toast.dismiss(toastId);
          setTempUserId(data.tempUserId);
          setRequires2fa(true);
          setIsLoading(false);
          return;
        }

        toast.success('¡Login exitoso!', { id: toastId });
        // Guardar la info de sesión (idealmente en un contexto global o localStorage)
        localStorage.setItem('user', JSON.stringify(data));
        
        // Si el usuario debe cambiar su contraseña, redirigir a la pantalla de cambio
        if (data.must_change_password === 1) {
          navigate('/change-password');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Usuario o contraseña incorrecto', { id: toastId });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Error al iniciar sesión', { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container-mobile">
        {/* Animated Financial Background */}
        <div className="login-image-section animated-bg">
          <div className="finance-orb orb-1"></div>
          <div className="finance-orb orb-2"></div>
          
          <div className="falling-coin coin-1">$</div>
          <div className="falling-coin coin-2">%</div>
          <div className="falling-coin coin-3">↑</div>
          <div className="falling-coin coin-4">N</div>
          <div className="falling-coin coin-5">€</div>
          <div className="falling-coin coin-6">¥</div>
          
          <div className="bg-text-overlay">
            <h2>Rendimiento.<br/>Estrategia.<br/>NovaStrat.</h2>
          </div>
        </div>

        {/* Bottom Half: Liquid Glass Card */}
        <div className="login-card-section">
          <div className="login-card glass-panel">
            <h1 className="login-title">Bienvenido a Nova!</h1>

            <form className="login-form-element" onSubmit={handleSubmit}>
              <div className="input-rel">
                <input 
                  type="text" 
                  placeholder="Usuario" 
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
              
              <div className="input-rel">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Contraseña" 
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <div className="input-icon-right cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

               <div className="login-forgot">
                <a href="#" onClick={(e) => { e.preventDefault(); setIsRecoveryModalOpen(true); }}>¿Olvidaste tu contraseña?</a>
              </div>

              <div className="login-action">
                <button type="submit" className="btn-login-submit" disabled={isLoading}>
                  {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
              </div>

              <div className="login-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowRegisterInfo(!showRegisterInfo)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}
                >
                  ¿Quieres registrarte?
                  <ChevronDown size={16} style={{ transform: showRegisterInfo ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </button>

                <div style={{
                  maxHeight: showRegisterInfo ? '100px' : '0',
                  opacity: showRegisterInfo ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  marginTop: showRegisterInfo ? '0.5rem' : '0',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
                    Para registrarte, solicita nuestro <strong>Diagnóstico Express</strong>. Al completarlo, nuestro equipo evaluará tu caso y te enviará tus credenciales de acceso por correo.
                  </p>
                  <a href={`${landingUrl}/?open-diagnostic=true`} style={{ color: '#1e365d', fontWeight: 700, textDecoration: 'underline' }}>
                    Comenzar Diagnóstico de Registro
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Recovery Modal */}
      {isRecoveryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', background: 'rgba(244, 247, 254, 0.96)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(37, 99, 235, 0.18)', border: '1px solid rgba(37, 99, 235, 0.25)', boxSizing: 'border-box' }}>
            
            {/* Logo de la Empresa (NovaStrat) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--color-accent-teal, #3b82f6)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-accent-teal, #3b82f6)' }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.02em' }}>NovaStrat</span>
            </div>

            {/* Llave Dorada + Mail / Recuperación Metáfora */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'rgba(217, 119, 6, 0.08)', 
                border: '1px solid rgba(217, 119, 6, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                position: 'relative',
                boxShadow: '0 8px 24px rgba(217, 119, 6, 0.1)'
              }}>
                <Key size={28} color="#d97706" />
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#d97706', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(244, 247, 254, 0.96)' }}>
                  <Mail size={9} color="#fff" />
                </div>
              </div>
            </div>

            <h2 className="login-title" style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: '#0f172a', textAlign: 'center' }}>Recuperar Contraseña</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.45', textAlign: 'center' }}>
              Introduce tu correo electrónico y te enviaremos una contraseña temporal de acceso.
            </p>

            <form onSubmit={handleRecoverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-rel" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', color: '#64748b', zIndex: 10 }} />
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  className="login-input"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required 
                  style={{ 
                    paddingLeft: '2.75rem', 
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box',
                    color: '#0f172a'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsRecoveryModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.12)', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-login-submit" style={{ flex: 1, margin: 0 }} disabled={isRecovering}>
                  {isRecovering ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Login Modal */}
      {requires2fa && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', background: 'rgba(244, 247, 254, 0.96)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(37, 99, 235, 0.18)', border: '1px solid rgba(37, 99, 235, 0.25)', boxSizing: 'border-box' }}>
            
            {/* Logo de la Empresa (NovaStrat) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--color-accent-teal, #3b82f6)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-accent-teal, #3b82f6)' }} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.02em' }}>NovaStrat</span>
            </div>

            {/* Escudo de Seguridad / Google Authenticator Metáfora */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'rgba(37, 99, 235, 0.08)', 
                border: '1px solid rgba(37, 99, 235, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                position: 'relative',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.1)'
              }}>
                <Shield size={28} color="#2563eb" />
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#2563eb', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(244, 247, 254, 0.96)' }}>
                  <Key size={9} color="#fff" />
                </div>
              </div>
            </div>

            <h2 className="login-title" style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: '#0f172a', textAlign: 'center' }}>Verificación de Seguridad</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.45', textAlign: 'center' }}>
              Tu cuenta tiene activada la verificación en dos pasos. Ingresa el código de 6 dígitos de tu app Google Authenticator.
            </p>

            <form onSubmit={handle2faVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-rel">
                <input 
                  required 
                  type="text" 
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="Ej. 123456" 
                  className="login-input"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  style={{ 
                    fontSize: '1.25rem', 
                    letterSpacing: '8px', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    padding: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '12px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                    color: '#0f172a'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setRequires2fa(false); setTotpToken(''); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.12)', background: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-login-submit" style={{ flex: 1, margin: 0 }} disabled={isVerifying2fa || totpToken.length !== 6}>
                  {isVerifying2fa ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
