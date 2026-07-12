import React from 'react';
import '../styles/Contacto.css';

export function Footer({ onOpenLegal }) {
  return (
    <footer className="footer">
      <div className="footer-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Nova Strat Consulting. Todos los derechos reservados.</p>
        <div className="footer-links" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#privacidad" onClick={(e) => { e.preventDefault(); onOpenLegal('privacy'); }} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.8}>Aviso de Privacidad</a>
          <a href="#terminos" onClick={(e) => { e.preventDefault(); onOpenLegal('terms'); }} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.8}>Términos y Condiciones</a>
          <a href="#cookies" onClick={(e) => { e.preventDefault(); onOpenLegal('cookies'); }} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.8}>Política de Cookies</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
