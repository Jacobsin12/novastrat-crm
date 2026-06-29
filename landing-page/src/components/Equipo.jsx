import React, { useState } from 'react';
import { X } from 'lucide-react';
import useInView from '../hooks/useInView';
import '../styles/Equipo.css';

const teamMembers = [
  { name: 'Andrés Galán', role: 'Cofundador · Consultor Administrativo y de Calidad', img: '/team/andres.jpg' },
  { name: 'Erika Martínez', role: 'Cofundadora · Consultora de Marketing', img: '/team/erika.jpg' },
  { name: 'Marco Muñoz', role: 'Consultor Senior', img: '/team/marco.jpg' },
  { name: 'Aarón Martínez', role: 'Consultor Financiero', img: '/team/aaron.jpg' },
  { name: 'Damián Hernández', role: 'Consultor Aduanal', img: '/team/damian.jpg' },
  { name: 'Diego Olvera', role: 'Consultor de Capital Humano', img: '/team/diego.jpg' },
];

export function Equipo() {
  const [teamRef, teamVis] = useInView({ threshold: 0.1 });
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);

  React.useEffect(() => {
    const handleScroll = () => {
      // Only run this effect on mobile viewports
      if (window.innerWidth > 768) {
        setActiveCardIndex(null);
        return;
      }

      const cards = document.querySelectorAll('.team-card');
      let closestIndex = null;
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - cardCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      // Focus the card if it's within the center 40% of the viewport
      if (minDistance < window.innerHeight * 0.4) {
        setActiveCardIndex(closestIndex);
      } else {
        setActiveCardIndex(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    // Initial calculation on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <>
      <section id="equipo" className={`section-pad fade-section ${teamVis ? 'visible' : ''}`} ref={teamRef}>
        <div className="section-inner">
          <div className="eyebrow">Profesionales</div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', marginBottom: '3rem', color: '#000' }}>Nuestro Equipo.</h2>

          <div className={`team-grid ${activeCardIndex !== null ? 'has-active-mobile' : ''}`}>
            {teamMembers.map((member, idx) => (
              <div 
                key={idx} 
                className={`team-card ${activeCardIndex === idx ? 'active-mobile' : ''}`} 
                onClick={() => setSelectedMember(member)}
              >
                <div className="team-image-wrapper">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="team-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal interactivo de detalle de miembro del equipo */}
      {selectedMember && (
        <div className="team-modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="team-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="team-modal-close" onClick={() => setSelectedMember(null)} aria-label="Cerrar modal">
              <X size={20} />
            </button>
            <div className="team-modal-body">
              <div className="team-modal-image-wrapper">
                <img
                  src={selectedMember.img}
                  alt={selectedMember.name}
                  className="team-modal-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h3 className="team-modal-name">{selectedMember.name}</h3>
              <p className="team-modal-role">{selectedMember.role}</p>
              <p className="team-modal-bio">
                Profesional especializado de NovaStrat. Comprometido con la excelencia y la entrega de soluciones estratégicas personalizadas para impulsar el crecimiento, la eficiencia y el éxito sostenible de tu empresa.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Equipo;
