import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Nosotros from './components/Nosotros';
import Servicios from './components/Servicios';
import Metodologia from './components/Metodologia';
import Equipo from './components/Equipo';
import Contacto from './components/Contacto';
import Footer from './components/Footer';
import DiagnosticoExpress from './components/DiagnosticoExpress';
import LegalModal from './components/LegalModal';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [legalDoc, setLegalDoc] = useState(null);

  // Automatically open the diagnostic modal if coming from the login registration link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('open-diagnostic') === 'true') {
      setIsDiagOpen(true);
      // Clean up the URL query parameters so it doesn't open again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Scrollspy logic to track which section is currently in view for the navbar
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

  // Lock body scroll when the mobile menu is open to prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <Navbar 
        activeSection={activeSection} 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen} 
      />
      
      <Hero onStartDiagnostic={() => setIsDiagOpen(true)} />
      
      <Nosotros />
      
      <Servicios />
      
      <Metodologia />
      
      <Equipo />
      
      <Contacto />
      
      <Footer onOpenLegal={setLegalDoc} />
      
      <DiagnosticoExpress 
        isOpen={isDiagOpen} 
        onClose={() => setIsDiagOpen(false)} 
      />

      <LegalModal docType={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}

export default App;
