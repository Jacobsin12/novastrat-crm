import React, { useState } from 'react';
import { Eye, EyeOff, LogOut, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterInfo, setShowRegisterInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const toastId = toast.loading('Iniciando sesión...');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('¡Login exitoso!', { id: toastId });
        // Guardar la info de sesión (idealmente en un contexto global o localStorage)
        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = '/dashboard';
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
                <a href="#">¿Olvidaste tu contraseña?</a>
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
                  <p style={{ margin: '0 0 0.5rem 0' }}>Para crear una cuenta, solicita un diagnóstico inicial en nuestra página web oficial.</p>
                  <a href="http://localhost:5173" style={{ color: 'var(--color-accent-teal)', fontWeight: 600 }}>Ir a NovaStrat.com</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
