import React from 'react';
import { ShieldCheck, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import useInView from '../hooks/useInView';
import '../styles/Nosotros.css';

export function Nosotros() {
  const [aboutRef, aboutVis] = useInView({ threshold: 0.1 });

  return (
    <section id="nosotros" className={`section-pad fade-section ${aboutVis ? 'visible' : ''}`} ref={aboutRef}>
      <div className="section-inner">
        <div className="about-row">
          <div>
            <div className="eyebrow">Sobre Nosotros</div>
            <h2>Quiénes<br />Somos.</h2>
            <button 
              className="btn-pill dark" 
              style={{ marginTop: '1.5rem' }}
              onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
            >
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
          <div className="value-card dark">
            <div>
              <Sparkles size={32} style={{ color: 'var(--color-gold)', marginBottom: '0.75rem' }} />
              <div className="card-title">Inspiración</div>
            </div>
            <div className="card-body">Motivamos a nuestros clientes a alcanzar nuevos horizontes.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Nosotros;
