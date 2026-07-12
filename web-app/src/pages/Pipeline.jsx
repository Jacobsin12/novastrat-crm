import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, LayoutDashboard, Columns, LogOut, FileText, Users, Settings, Building, Calendar, CheckCircle2, ChevronRight, Activity, Handshake, Target, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import '../styles/Pipeline.css';

export default function Pipeline() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [user, setUser] = useState(null);

  // Estados del Kanban
  const [cards, setCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [pendingStageChange, setPendingStageChange] = useState(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [stageDescription, setStageDescription] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProjects();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const columns = [
    { id: 'Diagnóstico Inicial', title: '1. Diagnóstico', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <Target size={18} color="#3b82f6" /> },
    { id: 'Plan Estratégico', title: '2. Estrategia', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', icon: <FileText size={18} color="#eab308" /> },
    { id: 'Implementación', title: '3. Implementación', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: <Handshake size={18} color="#f97316" /> },
    { id: 'Cierre', title: '4. Cierre', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={18} color="#10b981" /> }
  ];

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedCard(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (draggedCard && draggedCard.stage !== status) {
      setPendingStageChange({ card: draggedCard, newStage: status });
      setStageDescription('');
      setIsDescriptionModalOpen(true);
    }
  };

  const confirmStageChange = async () => {
    if (!pendingStageChange || !stageDescription.trim()) {
      alert('Debes ingresar una descripción de lo que se hizo para avanzar.');
      return;
    }
    
    const { card, newStage } = pendingStageChange;
    
    // Optimistic UI update
    const updatedCards = cards.map(c => 
      c.id === card.id ? { ...c, stage: newStage } : c
    );
    setCards(updatedCards);
    setIsDescriptionModalOpen(false);
    
    // Format timestamp
    const nowStr = new Date().toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newDescription = (card.description ? card.description + '\n\n' : '') + 
      `[${nowStr} - Cambio a '${newStage}']:\n${stageDescription.trim()}`;
      
    try {
      const response = await fetch(`${API_BASE}/api/projects/${card.id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, description: newDescription })
      });
      if (!response.ok) {
        console.error('Error updating stage on server');
        fetchProjects(); // Revert
      } else {
        fetchProjects(); // To get the updated description fully
      }
    } catch (err) {
      console.error('Connection error updating stage:', err);
      fetchProjects(); // Revert
    }
    
    setPendingStageChange(null);
    setStageDescription('');
  };
  
  const cancelStageChange = () => {
    setIsDescriptionModalOpen(false);
    setPendingStageChange(null);
    setStageDescription('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const visibleCards = user?.role === 'client' 
    ? cards.filter(c => c.client_name === user.name) 
    : cards;

  if (!user) return null;

  return (
    <>
      <div className="pipeline-header">
          <h1 className="title-glass">Proyectos y Consultorías</h1>
          <p className="subtitle-glass">
            {user.role === 'client' 
              ? 'Visualiza el estado de tu consultoría. Haz clic en tu tarjeta para ver más detalles.' 
              : 'Controla las fases de consultoría de tus clientes activos. Arrastra las tarjetas para avanzar de etapa.'}
          </p>
        </div>

        <div className="kanban-board">
          {columns.map(col => {
            const colCards = visibleCards.filter(c => c.stage === col.id);
            return (
              <div 
                key={col.id} 
                className="kanban-column"
                onDragOver={user.role === 'client' ? null : handleDragOver}
                onDrop={user.role === 'client' ? null : (e) => handleDrop(e, col.id)}
              >
                {/* Colored Top Bar */}
                <div className="column-color-bar" style={{ background: col.color }}></div>
                
                <div className="column-header">
                  <h3>{col.icon} {col.title}</h3>
                  <span className="column-count" style={{ background: col.bg, color: col.color }}>{colCards.length}</span>
                </div>
                <div className="column-body">
                  {colCards.map(card => (
                    <div 
                      key={card.id} 
                      className={`kanban-card stage-${col.id.replace(/\s+/g, '-').toLowerCase()}`}
                      style={{ '--card-color': col.color, cursor: 'pointer' }}
                      draggable={user.role !== 'client'} // Clients cannot drag
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedCard(card)}
                    >
                      <h4>{card.title}</h4>
                      
                      <p>
                        <Building size={14} opacity={0.6} /> 
                        {card.client_name}
                      </p>
                      
                      <div className="card-footer">
                        <span className="card-date">
                          <Calendar size={12} opacity={0.6} /> {formatDate(card.created_at)}
                        </span>
                        <div className="card-avatar" style={{ background: col.color }}>
                          {card.client_name ? card.client_name.charAt(0) : 'C'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      {/* MODAL DETALLES DE PROYECTO */}
      {selectedCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Detalles del Proyecto</h3>
              <button onClick={() => setSelectedCard(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre de la Consultoría</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{selectedCard.title}</strong>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Cliente</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 500 }}>{selectedCard.client_name}</span>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fase / Etapa Kanban</span>
                <span style={{ 
                  display: 'inline-block',
                  background: 'rgba(20, 184, 166, 0.1)', 
                  color: '#14b8a6', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600 
                }}>{selectedCard.stage}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Descripción / Avance de Consultoría</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-main)', background: 'var(--color-bg-card-inner)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {selectedCard.description || 'El consultor aún no ha agregado una descripción detallada del avance del proyecto.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDescriptionModalOpen && pendingStageChange && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={cancelStageChange}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div className="modal-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Descripción de Avance</h3>
              <button onClick={cancelStageChange} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Para mover el proyecto a <strong>"{pendingStageChange.newStage}"</strong>, es obligatorio ingresar una descripción de lo que se hizo.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <textarea 
                value={stageDescription}
                onChange={(e) => setStageDescription(e.target.value)}
                placeholder="Ej. Se finalizó el análisis financiero y se presentó el reporte..."
                style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={cancelStageChange}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={confirmStageChange} disabled={!stageDescription.trim()} style={{ padding: '0.6rem 1.25rem', opacity: stageDescription.trim() ? 1 : 0.5, cursor: stageDescription.trim() ? 'pointer' : 'not-allowed' }}>
                Guardar y Mover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
