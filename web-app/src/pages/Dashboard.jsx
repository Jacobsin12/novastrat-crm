import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Columns, Settings, LogOut, Search, Bell, Menu, X, Users, DollarSign, TrendingUp, Briefcase, CheckCircle, Clock, Calendar, Download, PhoneCall, Mail, Video, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const mockLeadsData = [
  { name: 'Ene', leads: 4 },
  { name: 'Feb', leads: 7 },
  { name: 'Mar', leads: 5 },
  { name: 'Abr', leads: 10 },
  { name: 'May', leads: 15 },
  { name: 'Jun', leads: 12 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />

      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} user={user} />

        <div className="dashboard-grid">
          {user.role === 'admin' && (
            <>
              {/* WELCOME CARD */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
                <h1 className="title-glass" style={{ margin: 0 }}>Panel de Dirección (CEO)</h1>
                <p style={{ margin: 0, fontSize: '1rem' }}>Bienvenido, <strong>{user.name}</strong>. Aquí tienes el resumen financiero y operativo de Nova Strat.</p>
              </div>

              {/* STAT CARDS - MINIMALIST */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <DollarSign size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ingresos Estimados</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>$124,500</h2>
                <p style={{color: '#10b981', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>+12% este mes</p>
              </div>
              
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Users size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Clientes Activos</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>14</h2>
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>En proceso</p>
              </div>

              {/* GRÁFICA DE LEADS */}
              <div className="card glass-panel col-span-2" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.25rem' }}>Crecimiento de Prospectos</h3>
                  <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => navigate('/leads')}>
                    Gestionar Nuevos Leads
                  </button>
                </div>
                <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockLeadsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--neumorphic-shadow)', backgroundColor: 'var(--color-bg-panel)', color: 'var(--color-text-main)' }}
                      />
                      <Area type="monotone" dataKey="leads" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {user.role === 'consultant' && (
            <>
              {/* WELCOME */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
                <h1 className="title-glass" style={{ margin: 0 }}>Panel de Consultor</h1>
                <p style={{ margin: 0, fontSize: '1rem' }}>Buen día, <strong>{user.name}</strong>. Aquí tienes tu resumen operativo y agenda de hoy.</p>
              </div>

              {/* QUICK METRICS */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Briefcase size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Proyectos Activos</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>3</h2>
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>Todos al corriente</p>
              </div>
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FileText size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Por Revisar</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: '#ef4444', fontWeight: 600 }}>5</h2>
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>Documentos nuevos</p>
              </div>

              {/* TO-DO LIST */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', gridRow: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Tareas de Hoy</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--color-bg-card-inner)', borderRadius: '8px', boxShadow: 'var(--inner-shadow)' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-teal)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Revisar reporte financiero (Financo)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--color-bg-card-inner)', borderRadius: '8px', boxShadow: 'var(--inner-shadow)' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-teal)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Enviar propuesta comercial a Globex</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--color-bg-card-inner)', borderRadius: '8px', boxShadow: 'var(--inner-shadow)' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-teal)' }} defaultChecked />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>Llamada de inicio con TechNova</span>
                  </label>
                </div>
              </div>

              {/* AGENDA DEL DÍA */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Agenda (Próximos)</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(20,184,166,0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent-teal)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-accent-teal)' }}>12:00</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>PM</span>
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Presentación Estratégica</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>TechNova Inc. (Videollamada)</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-card-inner)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>16:30</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>PM</span>
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Reunión Interna (Status)</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sala de juntas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRITICAL ALERTS */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Atención Requerida</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0 }}>
                  El proyecto <strong>Expansión GlobalTrade</strong> lleva 5 días sin movimiento en la fase de Negociación. 
                </p>
                <button className="btn-secondary" style={{ width: 'fit-content', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Enviar recordatorio</button>
              </div>

              {/* CONSULTANT ACTIVITY */}
              <div className="card glass-panel col-span-2">
                <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad de tus Proyectos</h3>
                <ul className="activity-list">
                  <li className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="activity-dot green"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>TechNova Inc. firmó el acuerdo de confidencialidad.</p>
                      <span>Hace 1 hora</span>
                    </div>
                  </li>
                  <li className="activity-item">
                    <div className="activity-dot blue"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>Se subió la factura del mes para LogisCorp.</p>
                      <span>Esta mañana</span>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          )}


          {user.role === 'client' && (
            <>
              {/* WELCOME */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
                <h1 className="title-glass" style={{ margin: 0 }}>Tu Portal de Proyecto</h1>
                <p style={{ margin: 0, fontSize: '1rem' }}>Bienvenido, <strong>{user.name}</strong>. Aquí puedes dar seguimiento en tiempo real al avance de tu consultoría.</p>
              </div>

              {/* PROGRESS STEPPER */}
              <div className="card glass-panel col-span-2" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <TrendingUp size={20} color="var(--color-accent)" />
                  <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.25rem' }}>Progreso del Proyecto</h3>
                </div>
                
                <div className="stepper-container">
                  <div className="step completed">
                    <div className="step-icon"><CheckCircle size={16} /></div>
                    <div className="step-content">
                      <h4>Diagnóstico</h4>
                      <p>Completado</p>
                    </div>
                  </div>
                  <div className="step-divider completed"></div>
                  
                  <div className="step active">
                    <div className="step-icon"><div style={{width: 8, height: 8, background: '#fff', borderRadius: '50%'}}></div></div>
                    <div className="step-content">
                      <h4>Estrategia</h4>
                      <p>En Proceso</p>
                    </div>
                  </div>
                  <div className="step-divider"></div>
                  
                  <div className="step">
                    <div className="step-icon">3</div>
                    <div className="step-content">
                      <h4>Implementación</h4>
                      <p>Pendiente</p>
                    </div>
                  </div>
                  <div className="step-divider"></div>
                  
                  <div className="step">
                    <div className="step-icon">4</div>
                    <div className="step-content">
                      <h4>Cierre</h4>
                      <p>Pendiente</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEXT MEETING */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Próxima Reunión</h4>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Presentación de Estrategia</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} /> Jueves 25 May, 10:00 AM
                  </p>
                </div>
                <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }}>
                  <Video size={16} /> Unirse a la llamada
                </button>
              </div>

              {/* CONSULTOR ASIGNADO */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Tu Consultor</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    AM
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)' }}>Aarón Martínez</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Socio Director</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <a href="mailto:aaron@novastrat.com" className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}><Mail size={16} color="var(--color-text-main)" /></a>
                  <a href="tel:+525555555555" className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}><PhoneCall size={16} color="var(--color-text-main)" /></a>
                </div>
              </div>

              {/* VAULT SUMMARY */}
              <div className="card glass-panel col-span-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--color-accent)" />
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Archivos Recientes</h4>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-muted)" style={{ cursor: 'pointer' }} onClick={() => navigate('/vault')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card-inner)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} color="#ef4444" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Reporte_Diagnostico.pdf</span>
                    </div>
                    <Download size={16} color="var(--color-text-muted)" style={{ cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card-inner)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={18} color="#14b8a6" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Plan_Estrategico_v1.xlsx</span>
                    </div>
                    <Download size={16} color="var(--color-text-muted)" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              </div>

              {/* CLIENT ACTIVITY */}
              <div className="card glass-panel col-span-2">
                <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad del Proyecto</h3>
                <ul className="activity-list">
                  <li className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="activity-dot blue"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>Aarón Martínez subió un nuevo documento: <strong>Plan_Estrategico_v1.xlsx</strong></p>
                      <span>Ayer a las 4:30 PM</span>
                    </div>
                  </li>
                  <li className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="activity-dot green"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>Fase de Diagnóstico Completada</p>
                      <span>Hace 3 días</span>
                    </div>
                  </li>
                  <li className="activity-item">
                    <div className="activity-dot gold"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>Proyecto Iniciado Oficialmente</p>
                      <span>Hace 2 semanas</span>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          )}

          {user.role !== 'client' && (
            <div className="card glass-panel col-span-2">
              <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad Reciente</h3>
              <ul className="activity-list">
                <li className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="activity-dot blue"></div>
                  <div className="activity-text">
                    <p style={{ margin: 0, fontWeight: 500 }}>Iniciaste sesión de forma segura.</p>
                    <span>Hace un momento</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot green"></div>
                  <div className="activity-text">
                    <p style={{ margin: 0, fontWeight: 500 }}>Nuevo lead recibido: "Logística SA"</p>
                    <span>Hace 2 horas</span>
                  </div>
                </li>
              </ul>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
