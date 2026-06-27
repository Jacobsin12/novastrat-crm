import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, BarChart2, ShieldCheck, TrendingUp, Building, Menu, X, Users, Lightbulb, Target, FileSearch, CheckCircle, Globe, Anchor, MessageCircle, Mail } from 'lucide-react';
import './App.css';
import logoSrc from './assets/nova1.png';
import DiagnosticoExpress from './components/DiagnosticoExpress';

const IconX = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z"/>
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
  </svg>
);

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

/* Hook: scroll-triggered visibility */
function useInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.unobserve(el); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

/* Clients for the marquee */
const clients = [
  { name: 'Corporativos', style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '15px' } },
  { name: 'PYMES', style: { fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: '13px', textTransform: 'uppercase' } },
  { name: 'Startups', style: { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: '0.01em', fontSize: '15px', fontStyle: 'italic' } },
  { name: 'Familias', style: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: '0.12em', fontSize: '13px', textTransform: 'uppercase' } },
  { name: 'Emprendedores', style: { fontFamily: "'Palatino', 'Book Antiqua', serif", fontWeight: 400, letterSpacing: '-0.01em', fontSize: '16px' } },
  { name: 'Inversionistas', style: { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, letterSpacing: '0.04em', fontSize: '14px' } },
  { name: 'Empresas', style: { fontFamily: 'Verdana, sans-serif', fontWeight: 700, letterSpacing: '-0.03em', fontSize: '13px' } },
  { name: 'Gobiernos', style: { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: '0.02em', fontSize: '14px' } },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [aboutRef, aboutVis] = useInView();
  const [servRef, servVis] = useInView();
  const [methRef, methVis] = useInView();
  const [teamRef, teamVis] = useInView();
  const [ctaRef, ctaVis] = useInView();

  // Scrollspy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'nosotros', 'servicios', 'metodologia', 'equipo', 'contacto'];
      let current = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      if (current !== activeSection) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* ═══ NAVBAR (fixed, liquid glass) ═══ */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo-container">
            <img src={logoSrc} alt="Nova Strat" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>

          <div className="nav-center">
            <a href="#nosotros" className={activeSection === 'nosotros' ? 'active-link' : ''}>Nosotros</a>
            <a href="#servicios" className={activeSection === 'servicios' ? 'active-link' : ''}>Servicios</a>
            <a href="#metodologia" className={activeSection === 'metodologia' ? 'active-link' : ''}>Metodología</a>
            <a href="#equipo" className={activeSection === 'equipo' ? 'active-link' : ''}>Equipo</a>
            <a href="#contacto" className={activeSection === 'contacto' ? 'active-link' : ''}>Contacto</a>
          </div>

          <div className="nav-right">
            <button className="btn-nav" onClick={() => window.location.href = 'http://localhost:5174/login'}>Acceso a Clientes</button>
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
          onClick={() => window.location.href = 'http://localhost:5174/login'}
        >
          Acceso a Clientes
        </button>
      </div>

      {/* ═══ HERO (rounded card with floating orbs + coins) ═══ */}
      <header id="inicio" className="hero-section">
        <div className="hero-card">
          {/* Floating orbs */}
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-orb hero-orb-4" />
          <div className="hero-orb hero-orb-5" />

          {/* Floating glass coins */}
          <div className="hero-coin hero-coin-1">$</div>
          <div className="hero-coin hero-coin-2">$</div>
          <div className="hero-coin hero-coin-3">$</div>

          <div className="hero-card-content">
            <h1 className="hero-title">
              Transformamos tu<br />Potencial en <span className="text-gold">Resultados</span>
            </h1>
            <p className="hero-subtitle">
              Consultoría empresarial integral, estrategia financiera y blindaje patrimonial diseñados para llevar a tu organización al siguiente nivel.
            </p>
            <div className="hero-actions">
              <button className="btn-pill dark" onClick={() => setIsDiagOpen(true)}>
                Iniciar Diagnóstico
                <span className="arrow-circle"><ArrowRight size={18} /></span>
              </button>
              <button className="btn-outline-hero" onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}>
                Agendar Asesoría
              </button>
            </div>

            {/* Brand marquee — full width */}
            <div className="hero-marquee">
              <div className="marquee-track">
                {[...clients, ...clients, ...clients].map((c, i) => (
                  <span key={i} className="hero-marquee-item" style={c.style}>{c.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ ABOUT / NOSOTROS ═══ */}
      <section id="nosotros" className={`section-pad fade-section ${aboutVis ? 'visible' : ''}`} ref={aboutRef}>
        <div className="section-inner">
          <div className="about-row">
            <div>
              <div className="eyebrow">Sobre Nosotros</div>
              <h2>Quiénes<br />Somos.</h2>
              <button className="btn-pill dark" style={{ marginTop: '1.5rem' }}>
                Conoce más
                <span className="arrow-circle"><ArrowRight size={18} /></span>
              </button>
            </div>
            <div>
              <p className="about-paragraph">
                Somos una consultora especializada en ofrecer soluciones estratégicas a empresas que buscan mejorar, optimizar y expandir sus operaciones. Trabajamos de la mano con nuestros clientes para identificar oportunidades y construir caminos hacia el éxito.
              </p>
            </div>
          </div>

          {/* Value cards — fintech card grid with liquid glass */}
          <div className="values-cards">
            <div className="value-card glass" style={{ gridColumn: 'span 2', background: 'linear-gradient(160deg, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0.5) 100%)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div>
                <div className="card-title" style={{ color: 'var(--color-primary)' }}>Nuestra Misión</div>
              </div>
              <div className="card-body" style={{ color: 'rgba(0,0,0,0.55)' }}>
                Ayudar a las empresas a crecer y alcanzar su máximo potencial aprovechando al máximo sus capacidades.
              </div>
            </div>
            <div className="value-card dark">
              <div>
                <ShieldCheck size={32} style={{ color: 'var(--color-gold)', marginBottom: '0.75rem' }} />
                <div className="card-title">Integridad</div>
              </div>
              <div className="card-body">Actuamos con honestidad y transparencia en cada proyecto.</div>
            </div>
            <div className="value-card dark">
              <div>
                <Lightbulb size={32} style={{ color: 'var(--color-gold)', marginBottom: '0.75rem' }} />
                <div className="card-title">Innovación</div>
              </div>
              <div className="card-body">Buscamos soluciones creativas y estrategias disruptivas.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SERVICIOS ═══ */}
      <section id="servicios" className={`section-pad fade-section ${servVis ? 'visible' : ''}`} ref={servRef}>
        <div className="section-inner">
          <div className="eyebrow">Lo que hacemos</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', marginBottom: '3rem', color: '#000' }}>Nuestros Servicios.</h2>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><FileSearch size={24} /></div>
              <h3>Diagnóstico Empresarial</h3>
              <p>Identificamos áreas de mejora y oportunidades de crecimiento.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Target size={24} /></div>
              <h3>Estrategia Empresarial</h3>
              <p>Diseñamos planes estratégicos adaptados a tus necesidades.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><TrendingUp size={24} /></div>
              <h3>Modelo de Negocio y Rentabilidad</h3>
              <p>Desarrollo de modelos de negocio y análisis de rentabilidad.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Building size={24} /></div>
              <h3>Auditoría Administrativa</h3>
              <p>Evaluación de procesos, estructura y gestión de riesgos.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><CheckCircle size={24} /></div>
              <h3>Auditoría de Calidad</h3>
              <p>Sistemas de calidad y control interno para tus clientes.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Globe size={24} /></div>
              <h3>Estrategia de Marketing</h3>
              <p>Redes, difusión, marca y captación de clientes.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Users size={24} /></div>
              <h3>Consultoría de Capital Humano</h3>
              <p>Capacitación, integración, motivación y retención de talento.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Anchor size={24} /></div>
              <h3>Consultoría Aduanal</h3>
              <p>Importación, exportación y cumplimiento de regulaciones.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><BarChart2 size={24} /></div>
              <h3>Estrategia Financiera</h3>
              <p>Diversificación de capital y gestión de oportunidades.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><ShieldCheck size={24} /></div>
              <h3>Consultoría Patrimonial</h3>
              <p>Blindaje patrimonial para familias y empresas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ METODOLOGÍA ═══ */}
      <section id="metodologia" className={`methodology-section fade-section ${methVis ? 'visible' : ''}`} ref={methRef}>
        <div className="section-inner">
          <div className="methodology-header">
            <div>
              <div className="eyebrow">Nuestro Proceso</div>
              <h2>Cómo<br />Trabajamos.</h2>
            </div>
            <div>
              <p>Metodología probada en cuatro pasos hacia la transformación empresarial de alto impacto.</p>
            </div>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Diagnóstico</h3>
              <p>Analizamos a fondo tu empresa para identificar fortalezas y áreas de mejora.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Estrategia</h3>
              <p>Diseñamos un plan personalizado con objetivos claros y alcanzables.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Implementación</h3>
              <p>Acompañamos la ejecución con asesoría continua y seguimiento.</p>
            </div>
            <div className="step-card">
              <div className="step-number">04</div>
              <h3>Resultados</h3>
              <p>Medimos el impacto y aseguramos el éxito de las estrategias.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EQUIPO ═══ */}
      <section id="equipo" className={`section-pad fade-section ${teamVis ? 'visible' : ''}`} ref={teamRef}>
        <div className="section-inner">
          <div className="eyebrow">Profesionales</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', marginBottom: '3rem', color: '#000' }}>Nuestro Equipo.</h2>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/andres.jpg" alt="Andrés Galán" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Andrés Galán</h3>
              <p>Cofundador · Consultor Administrativo y de Calidad</p>
            </div>
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/erika.jpg" alt="Erika Martínez" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Erika Martínez</h3>
              <p>Cofundadora · Consultora de Marketing</p>
            </div>
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/marco.jpg" alt="Marco Muñoz" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Marco Muñoz</h3>
              <p>Consultor Senior</p>
            </div>
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/aaron.jpg" alt="Aarón Martínez" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Aarón Martínez</h3>
              <p>Consultor Financiero</p>
            </div>
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/damian.jpg" alt="Damián Hernández" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Damián Hernández</h3>
              <p>Consultor Aduanal</p>
            </div>
            <div className="team-card">
              <div className="team-image-wrapper">
                <img src="/team/diego.jpg" alt="Diego Olvera" className="team-img" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <h3>Diego Olvera</h3>
              <p>Consultor de Capital Humano</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACTO ═══ */}
      <section id="contacto" className={`contact-section fade-section ${ctaVis ? 'visible' : ''}`} ref={ctaRef}>
        <div className="contact-container">
          <h2>Hablemos</h2>
          <p className="contact-subtitle">¿Tienes alguna pregunta o quieres trabajar con nosotros? Escríbenos directamente por WhatsApp o envíanos un mensaje.</p>
          <div className="contact-actions">
            <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" className="btn-whatsapp">
              <MessageCircle size={20} />
              Contáctanos por WhatsApp
            </a>
            <a href="mailto:nova.strat.consulting@gmail.com" className="btn-email">
              <Mail size={16} />
              nova.strat.consulting@gmail.com
            </a>
          </div>

          <div className="social-links" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#000'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="X (Twitter)">
              <IconX size={28} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0866FF'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="Facebook">
              <IconFacebook size={28} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#E1306C'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="Instagram">
              <IconInstagram size={28} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={{ color: '#666', transition: 'transform 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#0A66C2'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }} aria-label="LinkedIn">
              <IconLinkedin size={28} />
            </a>
          </div>

          <div className="contact-divider">
            <span>o envíanos un mensaje</span>
          </div>

          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado! Nos pondremos en contacto contigo pronto.'); e.target.reset(); }}>
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

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Nova Strat Consulting. Todos los derechos reservados.</p>
      </footer>
      <DiagnosticoExpress isOpen={isDiagOpen} onClose={() => setIsDiagOpen(false)} />
    </>
  );
}

export default App;
