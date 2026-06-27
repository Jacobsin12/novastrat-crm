import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, LayoutDashboard, Columns, LogOut, FileText, Users, Settings, Building, Calendar, CheckCircle2, ChevronRight, Activity, Handshake, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/Pipeline.css';

export default function Pipeline() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Estados del Kanban
  const [cards, setCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else navigate('/login');
    
    // Simular carga de tarjetas
    setCards([
      { id: 1, title: 'Reestructura Organizacional', client: 'TechNova', status: 'prospecting', date: '2026-05-15', client_name: 'TechNova' },
      { id: 2, title: 'Optimización de Procesos', client: 'LogisCorp', status: 'proposal', date: '2026-05-18', client_name: 'LogisCorp' },
      { id: 3, title: 'Auditoría Financiera', client: 'Financo', status: 'negotiation', date: '2026-05-20', client_name: 'Financo' },
      { id: 4, title: 'Expansión de Mercado', client: 'GlobalTrade', status: 'closed_won', date: '2026-05-21', client_name: 'GlobalTrade' }
    ]);
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const columns = [
    { id: 'prospecting', title: '1. Prospección', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <Target size={18} color="#3b82f6" /> },
    { id: 'proposal', title: '2. Propuesta', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', icon: <FileText size={18} color="#eab308" /> },
    { id: 'negotiation', title: '3. Negociación', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: <Handshake size={18} color="#f97316" /> },
    { id: 'closed_won', title: '4. Ganado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={18} color="#10b981" /> }
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
    if (draggedCard && draggedCard.status !== status) {
      const updatedCards = cards.map(c => 
        c.id === draggedCard.id ? { ...c, status } : c
      );
      setCards(updatedCards);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const visibleCards = user?.role === 'client' 
    ? cards.filter(c => c.client_name === user.name) 
    : cards;

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header toggleSidebar={toggleSidebar} user={user} />

        <div className="pipeline-header">
          <h1 className="title-glass">Pipeline de Ventas</h1>
          <p className="subtitle-glass">Organiza y desliza tus oportunidades. (Desliza hacia los lados en tu celular)</p>
        </div>

        <div className="kanban-board">
          {columns.map(col => {
            const colCards = visibleCards.filter(c => c.status === col.id);
            return (
              <div 
                key={col.id} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
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
                      className={`kanban-card color-${col.id}`}
                      style={{ '--card-color': col.color }}
                      draggable={user.role !== 'client'} // Clients cannot drag
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                    >
                      <h4>{card.title}</h4>
                      
                      <p>
                        <Building size={14} opacity={0.6} /> 
                        {card.client}
                      </p>
                      
                      <div className="card-footer">
                        <span className="card-date">
                          <Calendar size={12} opacity={0.6} /> {formatDate(card.date)}
                        </span>
                        <div className="card-avatar" style={{ background: col.color }}>
                          {card.client.charAt(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
