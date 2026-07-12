import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, CheckCircle, Activity } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/DiagnosticoExpress.css';

// Componente selector de país personalizado con buscador interactivo
const SearchableCountrySelect = ({ value, onChange, options, iconComponent: IconComponent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => {
    if (!o.value) return false;
    return o.label.toLowerCase().includes(search.toLowerCase()) || 
           o.value.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="custom-country-select-container" ref={dropdownRef}>
      <button 
        type="button" 
        className="custom-country-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Seleccionar país"
      >
        <IconComponent country={value} />
        <span className="custom-country-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="custom-country-dropdown">
          <div className="custom-country-search-box">
            <input
              type="text"
              placeholder="Buscar país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="custom-country-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`custom-country-option-item ${o.value === value ? 'active' : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <IconComponent country={o.value} />
                  <span>{o.label}</span>
                </button>
              ))
            ) : (
              <div className="no-countries-found">No se encontraron países</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const QUESTIONS = [
  {
    id: 1,
    question: '¿Cómo describirías la claridad de la estrategia actual de tu empresa?',
    options: [
      { text: 'Totalmente clara y compartida con todo el equipo', score: 10 },
      { text: 'Existe, pero no todos la conocen o la aplican al 100%', score: 5 },
      { text: 'No tenemos una estrategia formalmente definida', score: 0 }
    ]
  },
  {
    id: 2,
    question: '¿Cuentas con indicadores (KPIs) financieros y operativos?',
    options: [
      { text: 'Sí, los medimos y analizamos regularmente en reportes', score: 10 },
      { text: 'Tenemos algunos, pero no se revisan constantemente', score: 5 },
      { text: 'No medimos con indicadores formales', score: 0 }
    ]
  },
  {
    id: 3,
    question: '¿Tus procesos operativos están documentados y estandarizados?',
    options: [
      { text: 'Sí, operamos bajo procesos claros, manuales y de calidad', score: 10 },
      { text: 'Solo algunos procesos clave están documentados', score: 5 },
      { text: 'No, dependemos totalmente del conocimiento de las personas', score: 0 }
    ]
  },
  {
    id: 4,
    question: '¿Cómo percibes el clima laboral y la retención de talento?',
    options: [
      { text: 'Excelente clima, motivación alta y baja rotación', score: 10 },
      { text: 'Clima aceptable, pero la integración y rotación son retos', score: 5 },
      { text: 'Mala comunicación, desmotivación o alta rotación', score: 0 }
    ]
  },
  {
    id: 5,
    question: '¿Qué tan preparada está la empresa frente a riesgos (legales, financieros, fiscales)?',
    options: [
      { text: 'Tenemos un blindaje patrimonial, fiscal y financiero', score: 10 },
      { text: 'Conocemos los riesgos, pero no tenemos un plan sólido preventivo', score: 5 },
      { text: 'No hemos evaluado los riesgos de forma profesional', score: 0 }
    ]
  }
];

export default function DiagnosticoExpress({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOptionSelect = (score) => {
    setAnswers({ ...answers, [currentStep]: score });
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    return Object.values(answers).reduce((acc, curr) => acc + curr, 0);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    const score = calculateScore();
    
    // Validate phone number using libphonenumber-js
    if (!leadData.phone || !isValidPhoneNumber(leadData.phone)) {
      setErrorMsg('Por favor ingresa un número de teléfono válido.');
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE || (window.location.origin.includes('localhost') ? 'http://localhost:3000' : window.location.origin);
      const response = await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: leadData.company,
          contact_name: leadData.name,
          contact_email: leadData.email,
          contact_phone: leadData.phone,
          diagnosis_score: score
        })
      });
      
      if (response.ok) {
        setScoreResult(score);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'already_exists') {
          setErrorMsg(errorData.message || 'Este correo electrónico ya se encuentra registrado. Ya hemos recibido tu solicitud.');
        } else {
          console.error('Error al enviar lead:', errorData);
          setErrorMsg('Hubo un error al procesar tu solicitud.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsFinished(false);
    setScoreResult(null);
    setShowSuccessNotice(false);
    setErrorMsg('');
    setLeadData({ name: '', email: '', phone: '', company: '', countryCode: '+52' });
    onClose();
  };

  const renderContent = () => {
    // 1. Result View
    if (scoreResult !== null) {
      let resultTitle = '';
      let resultText = '';
      let resultColor = '';
      
      if (scoreResult >= 40) {
        resultTitle = 'Empresa Estructurada y Escalable';
        resultText = 'Tu organización tiene una base sólida. Es el momento ideal para implementar estrategias financieras avanzadas de diversificación y blindaje patrimonial.';
        resultColor = '#25D366'; // Green
      } else if (scoreResult >= 25) {
        resultTitle = 'Empresa en Crecimiento con Oportunidades';
        resultText = 'Tienes potencial, pero requieres estandarizar procesos, definir KPIs y mejorar el modelo de rentabilidad para escalar sin depender del operador principal.';
        resultColor = '#D4AF37'; // Gold
      } else {
        resultTitle = 'Organización en Riesgo de Estancamiento';
        resultText = 'Es vital y urgente realizar una auditoría administrativa y rediseñar la estrategia general para evitar pérdidas operativas y financieras graves.';
        resultColor = '#E63946'; // Red
      }

      if (showSuccessNotice) {
        return (
          <div className="diag-result-view fade-in">
            <CheckCircle size={56} color="#25D366" style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite' }} />
            <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--color-black)' }}>¡Solicitud Recibida!</h3>
            
            <div className="registration-notice" style={{
              background: 'rgba(30, 54, 93, 0.05)',
              border: '1px dashed rgba(30, 54, 93, 0.2)',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '2rem',
              fontSize: '0.9rem',
              color: '#1e365d',
              lineHeight: '1.5',
              textAlign: 'left',
              fontFamily: 'var(--font-body)'
            }}>
              <strong>Proceso de Registro Iniciado:</strong> Nuestro equipo ha recibido tu diagnóstico y tus datos de contacto. Evaluaremos tu perfil para crear tu cuenta de acceso. Nos pondremos en contacto contigo por <strong>WhatsApp</strong> o <strong>correo electrónico</strong> en un plazo máximo de 24 horas hábiles para proporcionarte tus credenciales de acceso al Panel de Nova.
            </div>

            <div className="result-actions">
              <button className="btn-pill dark" onClick={resetForm} style={{ padding: '0.8rem 2.5rem' }}>
                Finalizar
                <span className="arrow-circle"><CheckCircle size={18} /></span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="diag-result-view fade-in">
          <Activity size={56} color={resultColor} style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite' }} />
          <h3>Nivel de Madurez: {resultTitle}</h3>
          <div className="score-display" style={{ color: resultColor }}>
            {scoreResult} <span>/ 50</span>
          </div>
          <p className="result-description">{resultText}</p>
          
          <div className="result-actions">
            <button className="btn-pill dark" onClick={() => setShowSuccessNotice(true)} style={{ padding: '0.8rem 2.5rem' }}>
              Enviar Solicitud
              <span className="arrow-circle"><ArrowRight size={18} /></span>
            </button>
            <button className="btn-outline-hero" onClick={resetForm} style={{ borderColor: 'rgba(0,0,0,0.15)', color: '#000' }}>
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    // 2. Lead Capture View (Finished questionnaire)
    if (isFinished) {
      return (
        <div className="diag-lead-view fade-in">
          <h3>¡Análisis completado!</h3>
          <p>Para desbloquear tu diagnóstico y conocer las recomendaciones de nuestros expertos, déjanos tus datos.</p>
          <form className="diag-form" onSubmit={handleSubmitLead}>
            {errorMsg && (
              <div className="diag-error-banner fade-in" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                color: '#ea3838',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontFamily: 'var(--font-body)'
              }}>
                <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="form-group-diag">
              <input 
                type="text" placeholder="Nombre completo" required 
                value={leadData.name} onChange={e => { setErrorMsg(''); setLeadData({...leadData, name: e.target.value}); }} 
              />
            </div>
            <div className="form-group-diag">
              <input 
                type="text" placeholder="Nombre de la empresa" required 
                value={leadData.company} onChange={e => { setErrorMsg(''); setLeadData({...leadData, company: e.target.value}); }} 
              />
            </div>
            <div className="form-row-diag">
              <div className="form-group-diag">
                <input 
                  type="email" placeholder="Correo electrónico" required 
                  title="Ingresa un correo electrónico válido"
                  value={leadData.email} onChange={e => { setErrorMsg(''); setLeadData({...leadData, email: e.target.value}); }} 
                />
              </div>
              <div className="form-group-diag phone-input-container">
                <PhoneInput
                  defaultCountry="MX"
                  countrySelectComponent={SearchableCountrySelect}
                  placeholder="WhatsApp / Teléfono"
                  value={leadData.phone}
                  onChange={val => { setErrorMsg(''); setLeadData({...leadData, phone: val}); }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-pill dark" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.9rem 2rem' }}>
              {isSubmitting ? 'Calculando Resultados...' : 'Descubrir Mi Resultado'}
              {!isSubmitting && <span className="arrow-circle"><ArrowRight size={18} /></span>}
            </button>
          </form>
        </div>
      );
    }

    // 3. Question View
    const q = QUESTIONS[currentStep];
    const progress = ((currentStep) / QUESTIONS.length) * 100;

    return (
      <div className="diag-question-view fade-in" key={currentStep}>
        <div className="diag-progress-bar">
          <div className="diag-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="diag-step-indicator">Paso {currentStep + 1} de {QUESTIONS.length}</p>
        <h3 className="diag-question-text">{q.question}</h3>
        <div className="diag-options">
          {q.options.map((opt, i) => (
            <button key={i} className="diag-option-btn" onClick={() => handleOptionSelect(opt.score)}>
              <span className="diag-option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="diag-option-text">{opt.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="diag-overlay">
      <div className="diag-modal liquid-glass-modal">
        <button className="diag-close-btn" onClick={resetForm}><X size={24} /></button>
        <div className="diag-modal-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
