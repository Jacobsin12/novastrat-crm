import React from 'react';
import { X } from 'lucide-react';
import '../styles/Contacto.css';

const content = {
  privacy: {
    title: 'Aviso de Privacidad',
    text: `En Nova Strat Consulting, nos tomamos muy en serio la privacidad de tus datos.
    
    1. Recopilación de Datos
    Recopilamos información personal que nos proporcionas voluntariamente, como nombre, correo electrónico y número de teléfono, para poder ofrecerte nuestros servicios de consultoría.
    
    2. Uso de la Información
    Tu información se utiliza exclusivamente para:
    - Proveer los servicios solicitados.
    - Mejorar nuestra plataforma y atención al cliente.
    - Enviar comunicaciones relevantes sobre tu proyecto.
    
    3. Protección de Datos
    Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra acceso no autorizado.
    
    4. Contacto
    Si deseas ejercer tus derechos ARCO (Acceso, Rectificación, Cancelación u Oposición), puedes escribirnos a nova.strat.consulting@gmail.com.`
  },
  terms: {
    title: 'Términos y Condiciones',
    text: `Bienvenido a Nova Strat Consulting.
    
    1. Aceptación de los Términos
    Al utilizar nuestros servicios, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, no debes utilizar nuestra plataforma.
    
    2. Uso de los Servicios
    Nuestros servicios de consultoría están diseñados para asesorar a empresas y profesionales. Las recomendaciones proporcionadas están basadas en nuestro análisis experto, pero la implementación y sus resultados son responsabilidad del cliente.
    
    3. Bóveda Digital (Panel de Nova)
    El uso de la bóveda digital es para el intercambio de documentos relacionados con la consultoría. No está permitido subir material ilegal, ofensivo o que infrinja derechos de autor.
    
    4. Modificaciones
    Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación.`
  },
  cookies: {
    title: 'Política de Cookies',
    text: `Nova Strat Consulting utiliza cookies para mejorar tu experiencia en nuestra web.
    
    1. ¿Qué son las cookies?
    Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web.
    
    2. Cookies que utilizamos
    - Cookies esenciales: Necesarias para el funcionamiento básico del sitio y la autenticación en el Panel de Nova.
    - Cookies analíticas: Nos ayudan a entender cómo los visitantes interactúan con la página web, recopilando información de forma anónima.
    
    3. Gestión de cookies
    Puedes configurar tu navegador para rechazar las cookies, pero esto podría afectar el funcionamiento de ciertas áreas de nuestra plataforma (como la sesión del Panel de Nova).
    
    Al continuar navegando, aceptas el uso de cookies según esta política.`
  }
};

export function LegalModal({ docType, onClose }) {
  if (!docType || !content[docType]) return null;

  const { title, text } = content[docType];

  return (
    <div 
      className="legal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 9999, padding: '1rem' 
      }}
    >
      <div 
        className="legal-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto', 
          position: 'relative', padding: '2.5rem', 
          backgroundColor: '#111928', // Dark solid background like the rest of the site
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '15px', right: '15px', 
            background: 'rgba(255,255,255,0.1)', border: 'none', 
            cursor: 'pointer', color: 'white',
            borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ color: 'var(--accent-teal, #14b8a6)', marginBottom: '1.5rem', fontSize: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>{title}</h2>
        
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1rem', textAlign: 'left' }}>
          {text}
        </div>
        
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <button onClick={onClose} className="btn-pill dark" style={{ padding: '0.75rem 2.5rem' }}>
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LegalModal;
