import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Columns, Settings, LogOut, Search, Bell, Menu, X, Users, DollarSign, TrendingUp, Briefcase, CheckCircle, Clock, Calendar, Download, PhoneCall, Mail, Video, ChevronRight, AlertTriangle, MessageCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/dashboard/Dashboard.css';

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
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeClients: 0,
    estimatedRevenue: 120000,
    leadsChart: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Estados del portal de cliente
  const [clientProject, setClientProject] = useState(null);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [clientDocuments, setClientDocuments] = useState([]);
  
  // Estados de reuniones para Admin/Asesor
  const [adminMeetings, setAdminMeetings] = useState([]);
  const [proposingMeetingId, setProposingMeetingId] = useState(null);
  const [proposedDateInput, setProposedDateInput] = useState('');
  const [proposedTimeInput, setProposedTimeInput] = useState('10:00');
  
  // Estados para solicitar reunión
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Reunión de Avance');
  const [meetingDateOnly, setMeetingDateOnly] = useState('');
  const [meetingTimeOnly, setMeetingTimeOnly] = useState('10:00');
  const [meetingDuration, setMeetingDuration] = useState('60');
  const [meetingConsultantId, setMeetingConsultantId] = useState('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  const fetchStats = async (currentUser) => {
    const userObj = currentUser || user;
    if (!userObj) return;
    try {
      let url = `${API_BASE}/api/dashboard/stats`;
      if (userObj.role === 'consultant') {
        url = `${API_BASE}/api/consultant/${userObj.id}/dashboard`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminMeetings = async (currentUser) => {
    const userObj = currentUser || user;
    if (!userObj) return;
    try {
      let url = `${API_BASE}/api/meetings/admin`;
      if (userObj.role === 'consultant') {
        url = `${API_BASE}/api/meetings/admin?consultantId=${userObj.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAdminMeetings(data);
      }
    } catch (err) {
      console.error('Error fetching admin meetings:', err);
    }
  };

  const handleRespondMeeting = async (meetingId, status, proposedDate = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, proposed_date_time: proposedDate })
      });
      if (res.ok) {
        toast.success(
          status === 'accepted' ? 'Reunión aceptada. Enlace de Meet generado.' :
          status === 'rejected' ? 'Reunión rechazada.' :
          'Propuesta de cambio enviada al cliente.'
        );
        setProposingMeetingId(null);
        setProposedDateInput('');
        setProposedTimeInput('10:00');
        if (user && user.role === 'client') {
          fetchClientData(user.id);
        } else {
          fetchAdminMeetings();
        }
      } else {
        toast.error('Error al responder a la reunión');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const fetchClientData = async (clientId) => {
    try {
      const projRes = await fetch(`${API_BASE}/api/projects/client/${clientId}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setClientProject(projData);
        
        if (projData) {
          const docsRes = await fetch(`${API_BASE}/api/documents?projectId=${projData.id}`);
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            setClientDocuments(docsData);
          }
        }
      }
      
      const meetRes = await fetch(`${API_BASE}/api/meetings/client/${clientId}`);
      if (meetRes.ok) {
        const meetData = await meetRes.json();
        setClientMeetings(meetData);
      }
    } catch (err) {
      console.error('Error fetching client portal data:', err);
    }
  };

  const getStepStatus = (stepStage) => {
    if (!clientProject) return 'pending';
    const stages = ['Diagnóstico Inicial', 'Plan Estratégico', 'Implementación', 'Cierre'];
    const currentIdx = stages.indexOf(clientProject.stage);
    const targetIdx = stages.indexOf(stepStage);
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'pending';
  };

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    if (!meetingDateOnly || !meetingTimeOnly) return toast.error('Selecciona una fecha y hora.');
    if (!meetingConsultantId) return toast.error('Por favor, selecciona un consultor.');

    const requestedStart = new Date(meetingDateOnly + 'T' + meetingTimeOnly).getTime();
    if (requestedStart < Date.now()) {
      return toast.error('No puedes agendar una reunión en el pasado.');
    }

    setIsSubmittingMeeting(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/meetings/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user.id,
          consultant_id: meetingConsultantId,
          title: meetingTitle,
          date_time: meetingDateOnly + 'T' + meetingTimeOnly,
          duration_minutes: meetingDuration
        })
      });
      
      if (res.ok) {
        toast.success('Solicitud de reunión enviada exitosamente.');
        setIsMeetingModalOpen(false);
        setMeetingTitle('Reunión de Avance');
        setMeetingDateOnly('');
        setMeetingTimeOnly('10:00');
        setMeetingConsultantId('');
        fetchClientData(user.id);
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.error);
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return 'Hace un momento';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getMinDate = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchStats(parsedUser);
      if (parsedUser.role === 'client') {
        fetchClientData(parsedUser.id);
      } else {
        fetchAdminMeetings(parsedUser);
      }
      
      const interval = setInterval(() => {
        fetchStats(parsedUser);
        if (parsedUser.role === 'client') {
          fetchClientData(parsedUser.id);
        } else {
          fetchAdminMeetings(parsedUser);
        }
      }, 5000);
      return () => clearInterval(interval);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  const refreshDashboard = () => {
    if (!user) return;
    fetchStats(user);
    if (user.role === 'client') {
      fetchClientData(user.id);
    } else {
      fetchAdminMeetings(user);
    }
  };

  return (
    <div className="dashboard-grid">
          {user.role === 'admin' && (
            <>
              {/* WELCOME CARD */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h1 className="title-glass" style={{ margin: 0 }}>Panel de Dirección (CEO)</h1>
                  <button onClick={refreshDashboard} title="Actualizar" style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: '8px', color: 'var(--color-accent-teal)', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'; }}>
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '1rem' }}>Bienvenido, <strong>{user.name}</strong>. Aquí tienes el resumen financiero y operativo de Nova Strat.</p>
              </div>

              {/* STAT CARDS - MINIMALIST */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <DollarSign size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ingresos Estimados</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(stats.estimatedRevenue)}
                </h2>
                <p style={{color: '#10b981', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>+12% este mes</p>
              </div>
              
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Users size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Clientes Activos</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>{stats.activeClients}</h2>
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
                <div style={{ width: '100%', height: 260 }}>
                  {/* Se agregó minWidth={0} aquí abajo para solucionar el error de redimensionamiento */}
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={stats.leadsChart && stats.leadsChart.length > 0 ? stats.leadsChart : mockLeadsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

              {/* SOLICITUDES DE REUNIÓN PARA ADMIN/ASESOR */}
              <div className="card glass-panel col-span-2" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--color-accent)" /> Solicitudes de Reuniones de Clientes
                </h3>

                {adminMeetings.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                    No hay solicitudes de reunión registradas.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {adminMeetings.map(meet => {
                      const dateStr = new Date(meet.date_time).toLocaleString('es-MX', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      });
                      return (
                        <div key={meet.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-bg-card-inner)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 600, display: 'inline-block', marginBottom: '0.25rem' }}>
                              {meet.company_name || meet.client_name}
                            </span>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{meet.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Clock size={14} /> {dateStr}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {meet.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button 
                                  onClick={() => handleRespondMeeting(meet.id, 'accepted')} 
                                  className="btn-primary" 
                                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#10b981', border: 'none', borderRadius: '10px', fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s', cursor: 'pointer' }}
                                >
                                  Aceptar
                                </button>
                                <button 
                                  onClick={() => setProposingMeetingId(meet.id)} 
                                  className="btn-secondary" 
                                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', transition: 'all 0.2s', cursor: 'pointer' }}
                                >
                                  Proponer Nueva Fecha
                                </button>
                              </div>
                            )}

                            {meet.status === 'accepted' && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>✓ Aceptada</span>
                                {meet.meet_link && (
                                  <a href={meet.meet_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'underline' }}>Enlace de Meet</a>
                                )}
                              </div>
                            )}

                            {meet.status === 'rejected' && (
                              <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Rechazada</span>
                            )}

                            {meet.status === 'proposed' && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>Cambio propuesto</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  Nueva fecha: {meet.proposed_date_time ? new Date(meet.proposed_date_time).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No especificada'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Formulario inline para proponer fecha */}
                          {proposingMeetingId === meet.id && (
                            <div style={{ width: '100%', borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>Nueva propuesta:</label>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input 
                                  type="date" 
                                  required
                                  min={getMinDate()}
                                  value={proposedDateInput}
                                  onChange={e => setProposedDateInput(e.target.value)}
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--color-border)', 
                                    background: 'var(--color-bg-card-inner)', 
                                    color: 'var(--color-text-main)', 
                                    fontSize: '0.85rem',
                                    boxShadow: 'var(--inner-shadow)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                />
                                <input 
                                  type="time" 
                                  required
                                  value={proposedTimeInput}
                                  onChange={e => setProposedTimeInput(e.target.value)}
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--color-border)', 
                                    background: 'var(--color-bg-card-inner)', 
                                    color: 'var(--color-text-main)', 
                                    fontSize: '0.85rem',
                                    boxShadow: 'var(--inner-shadow)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                />
                              </div>
                              <button onClick={() => {
                                if (!proposedDateInput || !proposedTimeInput) return toast.error('Selecciona una fecha y hora.');
                                handleRespondMeeting(meet.id, 'proposed', proposedDateInput + 'T' + proposedTimeInput);
                              }} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Enviar Propuesta</button>
                              <button onClick={() => setProposingMeetingId(null)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Cancelar</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

           {user.role === 'consultant' && (
            <>
              {/* WELCOME */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h1 className="title-glass" style={{ margin: 0 }}>Panel de Consultor</h1>
                  <button onClick={refreshDashboard} title="Actualizar" style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: '8px', color: 'var(--color-accent-teal)', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'; }}>
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '1rem' }}>Buen día, <strong>{user.name}</strong>. Aquí tienes tu resumen operativo y agenda de hoy.</p>
              </div>

              {/* QUICK METRICS */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Briefcase size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Mis Clientes Activos</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)', fontWeight: 600 }}>{stats.activeClients || 0}</h2>
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>En proceso de consultoría</p>
              </div>
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FileText size={18} color="var(--color-text-muted)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Docs por Revisar</h4>
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: (stats.pendingDocs || 0) > 0 ? '#ef4444' : 'var(--color-text-main)', fontWeight: 600 }}>{stats.pendingDocs || 0}</h2>
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500}}>Subidos por clientes</p>
              </div>

              {/* LISTA DE CLIENTES ASIGNADOS */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', gridRow: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Mis Clientes</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', overflowY: 'auto', maxHeight: '350px' }}>
                  {!stats.clientsList || stats.clientsList.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No tienes clientes asignados actualmente.</p>
                  ) : (
                    stats.clientsList.map(c => (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem', background: 'var(--color-bg-card-inner)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{c.company_name || c.name}</span>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent-teal)', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>{c.progress}%</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Fase: {c.stage}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AGENDA DEL DÍA */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Reuniones Pendientes</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {adminMeetings.filter(m => m.status === 'pending').length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin reuniones pendientes por confirmar.</p>
                  ) : (
                    adminMeetings.filter(m => m.status === 'pending').slice(0, 3).map(meet => (
                      <div key={meet.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(20,184,166,0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--color-accent-teal)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-accent-teal)' }}>
                            {new Date(meet.date_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{meet.title}</h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{meet.company_name || meet.client_name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ATENCION */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Recordatorio</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', margin: 0 }}>
                  Recuerda revisar y validar a tiempo la bóveda de tus clientes asignados. Solo cuentas con permisos de lectura para auditar la información.
                </p>
              </div>

              {/* CONSULTANT ACTIVITY */}
              <div className="card glass-panel col-span-2" style={{ padding: '1.5rem' }}>
                <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad de tus Proyectos</h3>
                {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>Sin actividad reciente.</p>
                ) : (
                  <ul className="activity-list">
                    {stats.recentActivity.map((act, index) => (
                      <li key={index} className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
                        <div className={`activity-dot ${act.type === 'document' ? 'green' : 'blue'}`}></div>
                        <div className="activity-text">
                          <p style={{ margin: 0, fontWeight: 500 }}>{act.description}</p>
                          <span>{formatActivityTime(act.date)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* SOLICITUDES DE REUNIÓN PARA ADMIN/ASESOR */}
              <div className="card glass-panel col-span-2" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--color-accent)" /> Solicitudes de Reuniones de Clientes
                </h3>

                {adminMeetings.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                    No hay solicitudes de reunión registradas.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {adminMeetings.filter(m => m.status !== 'completed' && m.status !== 'cancelled').map(meet => {
                      const dateStr = new Date(meet.date_time).toLocaleString('es-MX', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      });
                      return (
                        <div key={meet.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-bg-card-inner)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 600, display: 'inline-block', marginBottom: '0.25rem' }}>
                              {meet.company_name || meet.client_name}
                            </span>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{meet.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Clock size={14} /> {dateStr}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {meet.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button 
                                  onClick={() => handleRespondMeeting(meet.id, 'accepted')} 
                                  className="btn-primary" 
                                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#10b981', border: 'none', borderRadius: '10px', fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s', cursor: 'pointer' }}
                                >
                                  Aceptar
                                </button>
                                <button 
                                  onClick={() => setProposingMeetingId(meet.id)} 
                                  className="btn-secondary" 
                                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', transition: 'all 0.2s', cursor: 'pointer' }}
                                >
                                  Proponer Nueva Fecha
                                </button>
                              </div>
                            )}

                            {meet.status === 'accepted' && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>✓ Aceptada</span>
                                {meet.meet_link && (
                                  <a href={meet.meet_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'underline', marginBottom: '0.25rem' }}>Enlace de Meet</a>
                                )}
                                <button 
                                  onClick={() => handleRespondMeeting(meet.id, 'completed')} 
                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Marcar Completada
                                </button>
                              </div>
                            )}

                            {meet.status === 'rejected' && (
                              <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Rechazada</span>
                            )}

                            {meet.status === 'proposed' && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>Cambio propuesto</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  Nueva fecha: {meet.proposed_date_time ? new Date(meet.proposed_date_time).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No especificada'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Formulario inline para proponer fecha */}
                          {proposingMeetingId === meet.id && (
                            <div style={{ width: '100%', borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>Nueva propuesta:</label>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input 
                                  type="date" 
                                  required
                                  min={getMinDate()}
                                  value={proposedDateInput}
                                  onChange={e => setProposedDateInput(e.target.value)}
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--color-border)', 
                                    background: 'var(--color-bg-card-inner)', 
                                    color: 'var(--color-text-main)', 
                                    fontSize: '0.85rem',
                                    boxShadow: 'var(--inner-shadow)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                />
                                <input 
                                  type="time" 
                                  required
                                  value={proposedTimeInput}
                                  onChange={e => setProposedTimeInput(e.target.value)}
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--color-border)', 
                                    background: 'var(--color-bg-card-inner)', 
                                    color: 'var(--color-text-main)', 
                                    fontSize: '0.85rem',
                                    boxShadow: 'var(--inner-shadow)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                />
                              </div>
                              <button onClick={() => {
                                if (!proposedDateInput || !proposedTimeInput) return toast.error('Selecciona una fecha y hora.');
                                handleRespondMeeting(meet.id, 'proposed', proposedDateInput + 'T' + proposedTimeInput);
                              }} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Enviar Propuesta</button>
                              <button onClick={() => setProposingMeetingId(null)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Cancelar</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {user.role === 'client' && (
            <>
              {/* WELCOME */}
              <div className="card glass-panel col-span-2 welcome-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem', padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h1 className="title-glass" style={{ margin: 0 }}>Tu Portal de Proyecto</h1>
                  <button onClick={refreshDashboard} title="Actualizar" style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: '8px', color: 'var(--color-accent-teal)', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'; }}>
                    <RefreshCw size={18} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '1rem' }}>
                  Bienvenido, <strong>{user.name}</strong>. Aquí puedes dar seguimiento en tiempo real al avance de tu consultoría.
                </p>
                {clientProject && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', italic: 'true' }}>
                    Proyecto: <strong>{clientProject.title}</strong>
                  </p>
                )}
              </div>

              {/* PROGRESS STEPPER */}
              <div className="card glass-panel col-span-2" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <TrendingUp size={20} color="var(--color-accent)" />
                  <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.25rem' }}>Progreso del Proyecto</h3>
                </div>
                
                <div className="stepper-container">
                  {/* STEP 1: Diagnóstico Inicial */}
                  <div className={`step ${getStepStatus('Diagnóstico Inicial')}`}>
                    <div className="step-icon">
                      {getStepStatus('Diagnóstico Inicial') === 'completed' ? <CheckCircle size={16} /> : '1'}
                    </div>
                    <div className="step-content">
                      <h4>Diagnóstico</h4>
                      <p>{getStepStatus('Diagnóstico Inicial') === 'completed' ? 'Completado' : getStepStatus('Diagnóstico Inicial') === 'active' ? 'En Proceso' : 'Pendiente'}</p>
                    </div>
                  </div>
                  <div className={`step-divider ${getStepStatus('Plan Estratégico') === 'completed' || getStepStatus('Plan Estratégico') === 'active' ? 'completed' : ''}`}></div>
                  
                  {/* STEP 2: Plan Estratégico */}
                  <div className={`step ${getStepStatus('Plan Estratégico')}`}>
                    <div className="step-icon">
                      {getStepStatus('Plan Estratégico') === 'completed' ? <CheckCircle size={16} /> : '2'}
                    </div>
                    <div className="step-content">
                      <h4>Estrategia</h4>
                      <p>{getStepStatus('Plan Estratégico') === 'completed' ? 'Completado' : getStepStatus('Plan Estratégico') === 'active' ? 'En Proceso' : 'Pendiente'}</p>
                    </div>
                  </div>
                  <div className={`step-divider ${getStepStatus('Implementación') === 'completed' || getStepStatus('Implementación') === 'active' ? 'completed' : ''}`}></div>
                  
                  {/* STEP 3: Implementación */}
                  <div className={`step ${getStepStatus('Implementación')}`}>
                    <div className="step-icon">
                      {getStepStatus('Implementación') === 'completed' ? <CheckCircle size={16} /> : '3'}
                    </div>
                    <div className="step-content">
                      <h4>Implementación</h4>
                      <p>{getStepStatus('Implementación') === 'completed' ? 'Completado' : getStepStatus('Implementación') === 'active' ? 'En Proceso' : 'Pendiente'}</p>
                    </div>
                  </div>
                  <div className={`step-divider ${getStepStatus('Cierre') === 'completed' || getStepStatus('Cierre') === 'active' ? 'completed' : ''}`}></div>
                  
                  {/* STEP 4: Cierre */}
                  <div className={`step ${getStepStatus('Cierre')}`}>
                    <div className="step-icon">
                      {getStepStatus('Cierre') === 'completed' ? <CheckCircle size={16} /> : '4'}
                    </div>
                    <div className="step-content">
                      <h4>Cierre</h4>
                      <p>{getStepStatus('Cierre') === 'completed' ? 'Completado' : getStepStatus('Cierre') === 'active' ? 'En Proceso' : 'Pendiente'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEXT MEETING */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Reuniones y Asesoría</h4>
                </div>
                
                {(() => {
                  const activeMeetings = clientMeetings.filter(m => m.status !== 'completed' && m.status !== 'cancelled');
                  return (
                    <>
                      <button 
                        onClick={() => setIsMeetingModalOpen(true)} 
                        className="btn-primary" 
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem 1rem', 
                          borderRadius: '10px', 
                          fontWeight: 600, 
                          border: 'none', 
                          background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-teal) 100%)', 
                          color: 'white', 
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)', 
                          transition: 'all 0.2s', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        <Calendar size={16} /> Solicitar Nueva Reunión
                      </button>

                      {activeMeetings.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', maxHeight: '400px', paddingRight: '0.5rem' }}>
                          {activeMeetings.map(m => {
                            const dateStr = new Date(m.date_time).toLocaleString('es-MX', { 
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                            });
                            return (
                              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                <div style={{ background: 'var(--color-bg-card-inner)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                                  <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: 'var(--color-text-main)', fontWeight: 600 }}>{m.title}</h5>
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={14} /> {dateStr}
                                  </p>
                                  
                                  {m.status === 'pending' && (
                                    <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
                                      Pendiente de confirmar por asesor
                                    </span>
                                  )}
                                  {m.status === 'accepted' && (
                                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
                                      ✓ Aceptada (Enlace generado)
                                    </span>
                                  )}
                                  {m.status === 'rejected' && (
                                    <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
                                      Rechazada por el asesor
                                    </span>
                                  )}
                                  {m.status === 'proposed' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>
                                        Alternativa propuesta por asesor:
                                      </span>
                                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', paddingLeft: '0.25rem' }}>
                                        Nueva fecha: {m.proposed_date_time ? new Date(m.proposed_date_time).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No especificada'}
                                      </p>
                                      <button
                                        onClick={() => handleRespondMeeting(m.id, 'accepted')}
                                        className="btn-primary"
                                        style={{ 
                                          padding: '0.5rem 1rem', 
                                          fontSize: '0.8rem', 
                                          background: '#10b981', 
                                          border: 'none', 
                                          borderRadius: '8px', 
                                          fontWeight: 600, 
                                          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', 
                                          cursor: 'pointer',
                                          width: '100%',
                                          marginTop: '0.5rem',
                                          color: 'white'
                                        }}
                                      >
                                        ✓ Aceptar Propuesta
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {m.status === 'accepted' && m.meet_link && (
                                    <a 
                                      href={m.meet_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="btn-primary" 
                                      style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', textDecoration: 'none', alignItems: 'center' }}
                                    >
                                      <Video size={16} /> Unirse a Meet
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => {
                                      if(window.confirm('¿Estás seguro de cancelar esta reunión?')) {
                                        handleRespondMeeting(m.id, 'cancelled');
                                      }
                                    }}
                                    style={{ 
                                      padding: '0.6rem', 
                                      background: 'transparent', 
                                      border: '1px solid #ef4444', 
                                      color: '#ef4444', 
                                      borderRadius: '8px', 
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      fontSize: '0.85rem'
                                    }}
                                    title="Cancelar reunión"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>No tienes reuniones programadas.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* CONSULTOR ASIGNADO */}
              <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Tu Equipo</h4>
                </div>
                
                {clientProject && clientProject.consultants && clientProject.consultants.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    {clientProject.consultants.map((consultant) => (
                      <div key={consultant.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', background: 'var(--color-bg-card-inner)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-teal) 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', boxShadow: 'var(--neumorphic-shadow)', flexShrink: 0 }}>
                            {consultant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>{consultant.name}</h5>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Asesor NovaStrat</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <a href={`mailto:${consultant.email}`} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }} title={`Enviar correo a ${consultant.email}`}><Mail size={14} /></a>
                          {consultant.phone && (
                            <>
                              <a href={`tel:${consultant.phone}`} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }} title={`Llamar a ${consultant.phone}`}><PhoneCall size={14} /></a>
                              <a href={`https://wa.me/${consultant.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: '6px', border: '1px solid #25d366', background: 'rgba(37, 211, 102, 0.05)', color: '#25d366' }} title="Enviar WhatsApp"><MessageCircle size={14} /></a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '1px dashed var(--color-border)' }}>
                        ?
                      </div>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)' }}>Sin asesores asignados</h5>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Pendiente de asignación</p>
                      </div>
                    </div>
                    <div style={{ padding: '0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                      Te notificaremos cuando se asigne un equipo a tu proyecto.
                    </div>
                  </>
                )}
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
                  {clientDocuments.length > 0 ? clientDocuments.slice(0, 3).map(doc => {
                    const isXls = doc.file_name.endsWith('.xlsx') || doc.file_name.endsWith('.xls');
                    return (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card-inner)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={18} color={isXls ? '#14b8a6' : '#ef4444'} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{doc.file_name}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 600 }} title="Sincronizado con Google Drive">
                            Drive
                          </span>
                        </div>
                        <a 
                          href={`${API_BASE}/uploads/${doc.file_path}`} 
                          download={doc.file_name} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Download size={16} style={{ cursor: 'pointer' }} />
                        </a>
                      </div>
                    );
                  }) : (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                      Aún no has subido documentos a la bóveda.
                    </p>
                  )}
                </div>
              </div>

              {/* CLIENT ACTIVITY */}
              <div className="card glass-panel col-span-2" style={{ padding: '1.5rem' }}>
                <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad del Proyecto</h3>
                <ul className="activity-list">
                  {clientDocuments.length > 0 ? clientDocuments.map(doc => {
                    return (
                      <li key={doc.id} className="activity-item" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="activity-dot blue"></div>
                        <div className="activity-text">
                          <p style={{ margin: 0, fontWeight: 500 }}>
                            {doc.uploaded_by_name || 'Tú'} subió un documento: <strong>{doc.file_name}</strong>
                          </p>
                          <span>{formatActivityTime(doc.created_at)}</span>
                        </div>
                      </li>
                    );
                  }) : null}

                  {clientProject && (
                    <li className="activity-item">
                      <div className="activity-dot gold"></div>
                      <div className="activity-text">
                        <p style={{ margin: 0, fontWeight: 500 }}>Proyecto Iniciado Oficialmente: <strong>{clientProject.title}</strong></p>
                        <span>{formatActivityTime(clientProject.created_at)}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              {/* MODAL SOLICITAR REUNIÓN */}
              {isMeetingModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)', fontWeight: 600 }}>Solicitar Reunión</h3>
                      <button onClick={() => setIsMeetingModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
                    </div>

                    <form onSubmit={handleRequestMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Título de la reunión</label>
                        <input 
                          type="text" 
                          required 
                          value={meetingTitle} 
                          onChange={e => setMeetingTitle(e.target.value)} 
                          style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }} 
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Consultor</label>
                        <select 
                          required 
                          value={meetingConsultantId} 
                          onChange={e => setMeetingConsultantId(e.target.value)} 
                          style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }} 
                        >
                          <option value="">-- Selecciona un consultor --</option>
                          {clientProject && clientProject.consultants && clientProject.consultants.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Fecha</label>
                          <input 
                            type="date" 
                            required 
                            min={getMinDate()}
                            value={meetingDateOnly} 
                            onChange={e => setMeetingDateOnly(e.target.value)} 
                            style={{ 
                              width: '100%', 
                              padding: '0.85rem 1rem', 
                              borderRadius: '10px', 
                              border: '1px solid var(--color-border)', 
                              background: 'var(--color-bg-card-inner)', 
                              color: 'var(--color-text-main)', 
                              outline: 'none',
                              fontSize: '0.95rem',
                              boxShadow: 'var(--inner-shadow)',
                              transition: 'border-color 0.2s',
                              cursor: 'pointer'
                            }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Hora</label>
                          <input 
                            type="time" 
                            required 
                            value={meetingTimeOnly} 
                            onChange={e => setMeetingTimeOnly(e.target.value)} 
                            style={{ 
                              width: '100%', 
                              padding: '0.85rem 1rem', 
                              borderRadius: '10px', 
                              border: '1px solid var(--color-border)', 
                              background: 'var(--color-bg-card-inner)', 
                              color: 'var(--color-text-main)', 
                              outline: 'none',
                              fontSize: '0.95rem',
                              boxShadow: 'var(--inner-shadow)',
                              transition: 'border-color 0.2s',
                              cursor: 'pointer'
                            }} 
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Duración Estimada</label>
                        <select 
                          value={meetingDuration} 
                          onChange={e => setMeetingDuration(e.target.value)} 
                          style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none' }}
                        >
                          <option value="15">15 minutos</option>
                          <option value="30">30 minutos</option>
                          <option value="45">45 minutos</option>
                          <option value="60">1 hora</option>
                          <option value="90">1.5 horas</option>
                          <option value="120">2 horas</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmittingMeeting} style={{ padding: '0.75rem 1.5rem' }}>
                          {isSubmittingMeeting ? 'Solicitando...' : 'Enviar Solicitud'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {user.role !== 'client' && (
            <div className="card glass-panel col-span-2">
              <h3 style={{marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.25rem'}}>Actividad Reciente</h3>
              <ul className="activity-list">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((act, index) => {
                    let dotColor = 'blue';
                    if (act.type === 'lead') dotColor = 'green';
                    if (act.type === 'project') dotColor = 'gold';
                    
                    return (
                      <li 
                        key={index} 
                        className="activity-item" 
                        style={{ 
                          paddingBottom: '1rem', 
                          borderBottom: index < stats.recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none' 
                        }}
                      >
                        <div className={`activity-dot ${dotColor}`}></div>
                        <div className="activity-text">
                          <p style={{ margin: 0, fontWeight: 500 }}>{act.description}</p>
                          <span>{formatActivityTime(act.date)}</span>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="activity-item">
                    <div className="activity-dot blue"></div>
                    <div className="activity-text">
                      <p style={{ margin: 0, fontWeight: 500 }}>No hay actividad registrada aún.</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}

        </div>
  );
}
