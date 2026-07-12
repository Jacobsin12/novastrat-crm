import React from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/Navbar.css';
import logoSrc from '../assets/nova1.png';

export function Navbar({ activeSection, menuOpen, setMenuOpen }) {
  const handleClientAccess = () => {
    const webAppUrl = import.meta.env.VITE_WEB_APP_URL || (window.location.origin.includes('5174') ? window.location.origin.replace('5174', '5173') : 'http://localhost:5173');
    window.location.href = `${webAppUrl}/login`;
  };

  return (
    <>
      {/* ═══ NAVBAR (fixed, liquid glass) ═══ */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#inicio" className="logo-container" style={{ cursor: 'pointer' }}>
            <img src={logoSrc} alt="Nova Strat" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </a>

          <div className="nav-center">
            <a href="#nosotros" className={activeSection === 'nosotros' ? 'active-link' : ''}>Nosotros</a>
            <a href="#servicios" className={activeSection === 'servicios' ? 'active-link' : ''}>Servicios</a>
            <a href="#metodologia" className={activeSection === 'metodologia' ? 'active-link' : ''}>Metodología</a>
            <a href="#equipo" className={activeSection === 'equipo' ? 'active-link' : ''}>Equipo</a>
            <a href="#contacto" className={activeSection === 'contacto' ? 'active-link' : ''}>Contacto</a>
          </div>

          <div className="nav-right">
            <button className="btn-nav" onClick={handleClientAccess}>Acceso a Clientes</button>
          </div>

          <div className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </div>
        </div>
      </nav>

      {/* Mobile drop-down overlay */}
      <div className={`mobile-nav-overlay ${menuOpen ? 'active' : ''}`}>
        <a href="#nosotros" onClick={() => setMenuOpen(false)} className={activeSection === 'nosotros' ? 'active-link' : ''}>Nosotros</a>
        <a href="#servicios" onClick={() => setMenuOpen(false)} className={activeSection === 'servicios' ? 'active-link' : ''}>Servicios</a>
        <a href="#metodologia" onClick={() => setMenuOpen(false)} className={activeSection === 'metodologia' ? 'active-link' : ''}>Metodología</a>
        <a href="#equipo" onClick={() => setMenuOpen(false)} className={activeSection === 'equipo' ? 'active-link' : ''}>Equipo</a>
        <a href="#contacto" onClick={() => setMenuOpen(false)} className={activeSection === 'contacto' ? 'active-link' : ''}>Contacto</a>
        <button
          className="btn-nav"
          style={{ background: '#000', color: '#fff', padding: '12px 28px', borderRadius: '50px', border: 'none', fontSize: '1rem', marginTop: '1rem', cursor: 'pointer' }}
          onClick={handleClientAccess}
        >
          Acceso a Clientes
        </button>
      </div>
    </>
  );
}

export default Navbar;
