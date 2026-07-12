import React from 'react';
import { ArrowRight, MessageCircle, Mail } from 'lucide-react';
import useInView from '../hooks/useInView';
import '../styles/Contacto.css';

const IconFacebook = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const IconInstagram = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const IconLinkedin = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export function Contacto() {
  const [ctaRef, ctaVis] = useInView({ threshold: 0.1 });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('¡Mensaje enviado! Nos pondremos en contacto contigo pronto.');
    e.currentTarget.reset();
  };

  return (
    <section id="contacto" className={`contact-section fade-section ${ctaVis ? 'visible' : ''}`} ref={ctaRef}>
      <div className="contact-container">
        <h2>Hablemos</h2>
        <p className="contact-subtitle">¿Tienes alguna pregunta o quieres trabajar con nosotros? Escríbenos directamente por WhatsApp o envíanos un mensaje.</p>
        <div className="contact-actions">
          <a href="https://wa.me/5215656473672" target="_blank" rel="noreferrer" className="btn-whatsapp">
            <MessageCircle size={20} />
            Contáctanos por WhatsApp
          </a>
          <a href="mailto:nova.strat.consulting@gmail.com" className="btn-email">
            <Mail size={16} />
            nova.strat.consulting@gmail.com
          </a>
        </div>

        <div className="social-links" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
          <a href="https://www.facebook.com/profile.php?id=61563968161216" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0866FF'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="Facebook">
            <IconFacebook size={28} />
          </a>
          <a href="https://www.instagram.com/novastratconsulting" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#E1306C'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="Instagram">
            <IconInstagram size={28} />
          </a>
          <a href="https://www.linkedin.com/company/nova-strat-consulting/" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0A66C2'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="LinkedIn">
            <IconLinkedin size={28} />
          </a>
        </div>

        <div className="contact-divider">
          <span>o envíanos un mensaje</span>
        </div>

        <form className="contact-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact-name">Nombre</label>
              <input type="text" id="contact-name" name="name" placeholder="Tu nombre completo" required />
            </div>
            <div className="form-group">
              <label htmlFor="contact-email">Correo electrónico</label>
              <input type="email" id="contact-email" name="email" placeholder="tu@correo.com" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="contact-subject">Asunto</label>
            <input type="text" id="contact-subject" name="subject" placeholder="¿En qué te podemos ayudar?" />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Mensaje</label>
            <textarea id="contact-message" name="message" rows="4" placeholder="Cuéntanos sobre tu proyecto o consulta..." required></textarea>
          </div>
          <button type="submit" className="btn-pill dark" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 2rem' }}>
            Enviar Mensaje
            <span className="arrow-circle"><ArrowRight size={18} /></span>
          </button>
        </form>
      </div>
    </section>
  );
}

export default Contacto;
