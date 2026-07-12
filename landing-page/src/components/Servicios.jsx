import React from 'react';
import { FileSearch, Target, TrendingUp, Building, CheckCircle, Globe, Users, Anchor, BarChart2, ShieldCheck, Code } from 'lucide-react';
import useInView from '../hooks/useInView';
import '../styles/Servicios.css';

const servicesList = [
  { icon: FileSearch, title: 'Diagnóstico Empresarial', desc: 'Identificamos áreas de mejora y oportunidades de crecimiento.' },
  { icon: Target, title: 'Estrategia Empresarial', desc: 'Diseñamos planes estratégicos adaptados a tus necesidades.' },
  { icon: TrendingUp, title: 'Modelo de Negocio y Rentabilidad', desc: 'Desarrollo de modelos de negocio y análisis de rentabilidad.' },
  { icon: Building, title: 'Auditoría Administrativa', desc: 'Evaluación de procesos, estructura y gestión de riesgos.' },
  { icon: CheckCircle, title: 'Auditoría de Calidad', desc: 'Sistemas de calidad y control interno para tus clientes.' },
  { icon: Globe, title: 'Estrategia de Marketing', desc: 'Redes, difusión, marca y captación de clientes.' },
  { icon: Users, title: 'Consultoría de Capital Humano', desc: 'Capacitación, integración, motivación y retención de talento.' },
  { icon: Anchor, title: 'Consultoría Aduanal', desc: 'Importación, exportación y cumplimiento de regulaciones.' },
  { icon: BarChart2, title: 'Estrategia Financiera', desc: 'Diversificación de capital y gestión de oportunidades.' },
  { icon: ShieldCheck, title: 'Consultoría Patrimonial', desc: 'Blindaje patrimonial para familias y empresas.' },
  { icon: Code, title: 'Soluciones Tecnológicas', desc: 'Desarrollo e implementación de software a medida, aplicaciones y herramientas digitales para optimizar la operatividad de tu empresa.' },
];

export function Servicios() {
  const [servRef, servVis] = useInView({ threshold: 0.1 });

  return (
    <section id="servicios" className={`section-pad fade-section ${servVis ? 'visible' : ''}`} ref={servRef}>
      <div className="section-inner">
        <div className="eyebrow">Lo que hacemos</div>
        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', marginBottom: '3rem', color: '#000' }}>Nuestros Servicios.</h2>

        <div className="services-grid">
          {servicesList.map((service, idx) => {
            const Icon = service.icon;
            return (
              <div key={idx} className="service-card">
                <div className="service-icon"><Icon size={24} /></div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Servicios;
