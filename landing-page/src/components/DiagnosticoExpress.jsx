import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle, Activity } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './DiagnosticoExpress.css';

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
    const score = calculateScore();
    
    // Validate phone number using libphonenumber-js
    if (!leadData.phone || !isValidPhoneNumber(leadData.phone)) {
      alert('Por favor ingresa un número de teléfono válido.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: leadData.company,
          contact_email: leadData.email,
          phone: leadData.phone,
          diagnosis_score: score
        })
      });
      
      if (response.ok) {
        setScoreResult(score);
      } else {
        console.error('Error al enviar lead');
        alert('Hubo un error al procesar tu solicitud.');
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

      return (
        <div className="diag-result-view fade-in">
          <Activity size={56} color={resultColor} style={{ marginBottom: '1.5rem', animation: 'pulse 2s infinite' }} />
          <h3>Nivel de Madurez: {resultTitle}</h3>
          <div className="score-display" style={{ color: resultColor }}>
            {scoreResult} <span>/ 50</span>
          </div>
          <p className="result-description">{resultText}</p>
          <div className="result-actions">
            <button className="btn-pill dark" onClick={resetForm} style={{ padding: '0.8rem 2.5rem' }}>
              Finalizar
              <span className="arrow-circle"><CheckCircle size={18} /></span>
            </button>
            <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" className="btn-outline-hero" style={{ borderColor: 'rgba(0,0,0,0.15)', color: '#000', textDecoration: 'none' }}>
              Solicitar Consultoría de Alto Impacto
            </a>
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
            <div className="form-group-diag">
              <input 
                type="text" placeholder="Nombre completo" required 
                value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} 
              />
            </div>
            <div className="form-group-diag">
              <input 
                type="text" placeholder="Nombre de la empresa" required 
                value={leadData.company} onChange={e => setLeadData({...leadData, company: e.target.value})} 
              />
            </div>
            <div className="form-row-diag">
              <div className="form-group-diag">
                <input 
                  type="email" placeholder="Correo electrónico" required 
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Ingresa un correo electrónico válido"
                  value={leadData.email} onChange={e => setLeadData({...leadData, email: e.target.value})} 
                />
              </div>
              <div className="form-group-diag phone-input-container">
                <PhoneInput
                  defaultCountry="MX"
                  placeholder="WhatsApp / Teléfono"
                  value={leadData.phone}
                  onChange={val => setLeadData({...leadData, phone: val})}
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
