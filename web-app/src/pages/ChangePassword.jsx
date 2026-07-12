import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/Login.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validaciones de seguridad de contraseña
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedChecksCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const progressPercent = (passedChecksCount / 4) * 100;

  let strengthLabel = 'Muy débil';
  let strengthColor = '#ef4444'; // Rojo

  if (passedChecksCount === 2) {
    strengthLabel = 'Débil';
    strengthColor = '#f97316'; // Naranja
  } else if (passedChecksCount === 3) {
    strengthLabel = 'Aceptable';
    strengthColor = '#f59e0b'; // Amarillo/Oro
  } else if (passedChecksCount === 4) {
    strengthLabel = 'Fuerte y Segura';
    strengthColor = '#10b981'; // Verde
  }

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (!parsed.must_change_password) {
        navigate('/dashboard');
      } else {
        setUser(parsed);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      return toast.error('La contraseña debe cumplir con todos los requisitos de seguridad.');
    }
    if (!passwordsMatch) {
      return toast.error('Las contraseñas no coinciden');
    }

    setIsLoading(true);
    const toastId = toast.loading('Actualizando contraseña...');

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('¡Contraseña actualizada exitosamente!', { id: toastId });
        // Actualizar localStorage para que ya no pida cambio
        const updatedUser = { ...user, must_change_password: 0 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        toast.error(data.error || 'Error al actualizar la contraseña', { id: toastId });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Error de conexión', { id: toastId });
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="login-page">
      <div className="login-container-mobile">
        {/* Animated Background */}
        <div className="login-image-section animated-bg">
          <div className="finance-orb orb-1"></div>
          <div className="finance-orb orb-2"></div>
          
          <div className="falling-coin coin-1">🔐</div>
          <div className="falling-coin coin-2">🔑</div>
          <div className="falling-coin coin-3">✓</div>
          <div className="falling-coin coin-4">N</div>
          <div className="falling-coin coin-5">🛡</div>
          <div className="falling-coin coin-6">★</div>
          
          <div className="bg-text-overlay">
            <h2>Seguridad.<br/>Primero.<br/>NovaStrat.</h2>
          </div>
        </div>

        {/* Card de Cambio de Contraseña */}
        <div className="login-card-section">
          <div className="login-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(59, 130, 246, 0.15))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}>
                <ShieldCheck size={24} color="#14b8a6" />
              </div>
            </div>

            <h1 className="login-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Cambio de Contraseña</h1>
            <p style={{ 
              color: 'var(--color-text-muted, #94a3b8)', 
              fontSize: '0.875rem', 
              textAlign: 'center', 
              marginBottom: '1.5rem',
              lineHeight: 1.5 
            }}>
              Hola <strong>{user.name}</strong>, por seguridad debes establecer una nueva contraseña antes de continuar.
            </p>

            <form className="login-form-element" onSubmit={handleSubmit}>
              <div className="input-rel">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  className="login-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <div 
                  className="input-icon-right cursor-pointer" 
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              {/* Indicador de fortaleza y barra de progreso */}
              {newPassword.length > 0 && (
                <div style={{ marginBottom: '0.25rem', marginTop: '-0.5rem' }}>
                  <div style={{ 
                    height: '5px', 
                    borderRadius: '3px', 
                    background: 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '3px',
                      width: `${progressPercent}%`,
                      background: strengthColor,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Seguridad:</span>
                    <span style={{ color: strengthColor, fontWeight: 700 }}>
                      {strengthLabel}
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de requisitos */}
              <div style={{ 
                fontSize: '0.8rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.4rem', 
                padding: '0.85rem', 
                background: 'rgba(0,0,0,0.02)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '12px',
                marginBottom: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasMinLength ? '#10b981' : 'var(--color-text-muted)' }}>
                  <span style={{ 
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
                    background: hasMinLength ? '#10b981' : '#94a3b8', 
                    transition: 'all 0.2s' 
                  }} />
                  Mínimo 8 caracteres
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasUppercase ? '#10b981' : 'var(--color-text-muted)' }}>
                  <span style={{ 
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
                    background: hasUppercase ? '#10b981' : '#94a3b8', 
                    transition: 'all 0.2s' 
                  }} />
                  Al menos una mayúscula (A-Z)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasNumber ? '#10b981' : 'var(--color-text-muted)' }}>
                  <span style={{ 
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
                    background: hasNumber ? '#10b981' : '#94a3b8', 
                    transition: 'all 0.2s' 
                  }} />
                  Al menos un número (0-9)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasSpecial ? '#10b981' : 'var(--color-text-muted)' }}>
                  <span style={{ 
                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
                    background: hasSpecial ? '#10b981' : '#94a3b8', 
                    transition: 'all 0.2s' 
                  }} />
                  Al menos un carácter especial (ej. @, $, !, %, &, *)
                </div>
              </div>

              <div className="input-rel">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar nueva contraseña"
                  className="login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div 
                  className="input-icon-right cursor-pointer" 
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              {/* Indicador de coincidencia */}
              {confirmPassword.length > 0 && (
                <p style={{ 
                  color: passwordsMatch ? '#10b981' : '#ef4444', 
                  fontSize: '0.8rem', 
                  marginTop: '-0.5rem', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600
                }}>
                  {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}

              <div className="login-action">
                <button 
                  type="submit" 
                  className="btn-login-submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  style={{ 
                    opacity: (isLoading || !isPasswordValid || !passwordsMatch) ? 0.5 : 1, 
                    width: '100%', 
                    maxWidth: 'none',
                    cursor: (!isPasswordValid || !passwordsMatch) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
