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
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2.5rem' }}>
        <button 
          className="modal-close" 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ color: 'var(--accent-teal)', marginBottom: '1.5rem', fontSize: '2rem' }}>{title}</h2>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1rem', textAlign: 'left' }}>
          {text}
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={onClose} className="btn-pill dark">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LegalModal;
