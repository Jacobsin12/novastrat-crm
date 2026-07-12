import React from 'react';
import '../styles/Contacto.css';

export function Footer() {
  return (
    <footer className="footer" style={{ padding: '2rem 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', marginTop: '4rem' }}>
      <div className="footer-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>&copy; {new Date().getFullYear()} Nova Strat Consulting. Todos los derechos reservados.</p>
        <div className="footer-links" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--accent-teal)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Aviso de Privacidad</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--accent-teal)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Términos y Condiciones</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--accent-teal)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>Política de Cookies</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
