import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, UserPlus, Mail, User, Edit2, X, Key, ShieldAlert, LogOut, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/dashboard/Team.css';

export default function Team() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [user, setUser] = useState(null);
  
  // Suspension modal state
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('Incumplimiento de contrato');
  const [customSuspendReason, setCustomSuspendReason] = useState('');
  
  const [team, setTeam] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [roleTab, setRoleTab] = useState('consultants'); // 'consultants' or 'clients'
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', is_active: 1, phone: '', company_name: '', description: '' });
  const [selectedClient, setSelectedClient] = useState(null); // Para el modal de detalles
  const [allConsultants, setAllConsultants] = useState([]);
  const [assignedConsultants, setAssignedConsultants] = useState([]);

  useEffect(() => {
    if (selectedClient) {
      // 1. Cargar todos los consultores activos
      fetch(`${API_BASE}/api/users/consultants`)
        .then(res => res.json())
        .then(data => {
          setAllConsultants(data.filter(c => c.is_active === 1));
        })
        .catch(err => console.error('Error fetching active consultants:', err));

      // 2. Cargar IDs de consultores actualmente asignados a este cliente
      fetch(`${API_BASE}/api/users/clients/${selectedClient.id}/consultants`)
        .then(res => res.json())
        .then(ids => {
          setAssignedConsultants(ids);
        })
        .catch(err => console.error('Error fetching assigned consultants:', err));
    }
  }, [selectedClient]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard'); 
      } else {
        setUser(parsedUser);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchTeam = async () => {
    try {
      const endpoint = roleTab === 'consultants' 
        ? `${API_BASE}/api/users/consultants` 
        : `${API_BASE}/api/users/clients`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeam();
    }
  }, [roleTab, user]);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', is_active: 1, phone: '', company_name: '', description: '' });
    setIsFormModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({ 
      name: member.name, 
      email: member.email, 
      is_active: member.is_active,
      phone: member.phone || '',
      company_name: member.company_name || '',
      description: member.description || ''
    });
    setIsFormModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    const baseEndpoint = roleTab === 'consultants' ? 'consultants' : 'clients';
    
    if (editingMember) {
      // Edit
      try {
        const res = await fetch(`${API_BASE}/api/users/${baseEndpoint}/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          toast.success(roleTab === 'consultants' ? 'Consultor actualizado' : 'Cliente actualizado');
          setIsFormModalOpen(false);
          fetchTeam();
        } else {
          const err = await res.json();
          toast.error('Error: ' + err.error);
        }
      } catch (err) {
        toast.error('Error de conexión');
        console.error(err);
      }
    } else {
      // Add
      const rawPassword = Math.random().toString(36).slice(-8);
      try {
        const res = await fetch(`${API_BASE}/api/users/${baseEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, email: formData.email, rawPassword, phone: formData.phone })
        });

        if (res.ok) {
          toast.success(`${roleTab === 'consultants' ? 'Consultor' : 'Cliente'} creado. Contraseña temporal: ${rawPassword}`, { duration: 6000 });
          setIsFormModalOpen(false);
          fetchTeam();
        } else {
          const err = await res.json();
          toast.error('Error: ' + err.error);
        }
      } catch (err) {
        toast.error('Error de conexión');
        console.error(err);
      }
    }
  };

  const handleResetPassword = () => {
    if (!editingMember) return;
    toast(
      (t) => (
        <div>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>¿Resetear la contraseña de <strong>{editingMember.name}</strong>?</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => toast.dismiss(t.id)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
            <button onClick={() => { toast.dismiss(t.id); executeResetPassword(); }} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Resetear</button>
          </div>
        </div>
      ),
      { duration: Infinity, id: 'reset-confirm' }
    );
  };

  const executeResetPassword = async () => {
    const rawPassword = Math.random().toString(36).slice(-8);
    const baseEndpoint = roleTab === 'consultants' ? 'consultants' : 'clients';
    try {
      const res = await fetch(`${API_BASE}/api/users/${baseEndpoint}/${editingMember.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawPassword })
      });
      if (res.ok) {
        toast.success(`Contraseña actualizada. Nueva clave: ${rawPassword}`, { duration: 6000 });
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.error);
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  const openSuspendModal = (member) => {
    setSuspendTarget(member);
    setSuspendReason('Incumplimiento de contrato');
    setCustomSuspendReason('');
    setIsSuspendModalOpen(true);
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    const finalReason = suspendReason === 'Otro motivo' ? customSuspendReason : suspendReason;
    const baseEndpoint = roleTab === 'consultants' ? 'consultants' : 'clients';
    
    try {
      const res = await fetch(`${API_BASE}/api/users/${baseEndpoint}/${suspendTarget.id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason })
      });
      if (res.ok) {
        toast.success(`${roleTab === 'consultants' ? 'Consultor' : 'Cliente'} suspendido. Se envió notificación por correo.`);
        setIsSuspendModalOpen(false);
        setIsFormModalOpen(false);
        fetchTeam();
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.error);
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  const handleReactivate = async (member) => {
    const baseEndpoint = roleTab === 'consultants' ? 'consultants' : 'clients';
    try {
      const res = await fetch(`${API_BASE}/api/users/${baseEndpoint}/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: member.name, email: member.email, is_active: 1 })
      });
      if (res.ok) {
        toast.success(`${roleTab === 'consultants' ? 'Consultor' : 'Cliente'} reactivado`);
        fetchTeam();
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.error);
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  if (!user) return null;

  const filteredTeam = team.filter(member => {
    return activeTab === 'active' ? member.is_active === 1 : member.is_active === 0;
  });

  return (
    <>
      <div className="dashboard-grid" style={{ display: 'block' }}>
          <div className="card glass-panel" style={{ width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 className="title-glass" style={{ margin: 0, fontSize: '1.5rem' }}>{roleTab === 'consultants' ? 'Equipo de Consultores' : 'Clientes Registrados'}</h2>
                <button onClick={fetchTeam} title="Actualizar" style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: '8px', color: 'var(--color-accent-teal)', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'; }}>
                  <RefreshCw size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Selector de Rol */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-panel)', padding: '0.25rem', borderRadius: '12px', boxShadow: 'var(--inner-shadow)', border: '1px solid var(--color-border)' }}>
                  <button 
                    onClick={() => setRoleTab('consultants')}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, background: roleTab === 'consultants' ? 'var(--color-bg-card-inner)' : 'transparent', color: roleTab === 'consultants' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', boxShadow: roleTab === 'consultants' ? 'var(--neumorphic-shadow)' : 'none' }}
                  >
                    Consultores
                  </button>
                  <button 
                    onClick={() => setRoleTab('clients')}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, background: roleTab === 'clients' ? 'var(--color-bg-card-inner)' : 'transparent', color: roleTab === 'clients' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', boxShadow: roleTab === 'clients' ? 'var(--neumorphic-shadow)' : 'none' }}
                  >
                    Clientes
                  </button>
                </div>

                {/* Selector de Estado */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-panel)', padding: '0.25rem', borderRadius: '12px', boxShadow: 'var(--inner-shadow)', border: '1px solid var(--color-border)' }}>
                  <button 
                    onClick={() => setActiveTab('active')}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, background: activeTab === 'active' ? 'var(--color-bg-card-inner)' : 'transparent', color: activeTab === 'active' ? 'var(--color-accent-teal)' : 'var(--color-text-muted)', boxShadow: activeTab === 'active' ? 'var(--neumorphic-shadow)' : 'none' }}
                  >
                    Activos
                  </button>
                  <button 
                    onClick={() => setActiveTab('inactive')}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, background: activeTab === 'inactive' ? 'var(--color-bg-card-inner)' : 'transparent', color: activeTab === 'inactive' ? '#ef4444' : 'var(--color-text-muted)', boxShadow: activeTab === 'inactive' ? 'var(--neumorphic-shadow)' : 'none' }}
                  >
                    Inactivos
                  </button>
                </div>

                <button 
                  onClick={openAddModal} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                >
                  <UserPlus size={18} /> {roleTab === 'consultants' ? 'Agregar Personal' : 'Agregar Cliente'}
                </button>
              </div>
            </div>
            
            {filteredTeam.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <User size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                <p>No hay consultores en esta categoría.</p>
              </div>
            ) : (
              <div className="glass-data-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredTeam.map(member => (
                  <div 
                    key={member.id} 
                    className="glass-data-item" 
                    onClick={() => { if (roleTab === 'clients') setSelectedClient(member); }}
                    style={{ flexWrap: 'wrap', gap: '1rem', background: 'var(--color-bg-card-inner)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)', opacity: member.is_active === 0 ? 0.6 : 1, cursor: roleTab === 'clients' ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 250px' }}>
                      <div style={{ width: '48px', height: '48px', background: member.is_active === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(234, 179, 8, 0.1)', border: member.is_active === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color={member.is_active === 0 ? 'var(--color-text-muted)' : 'var(--color-gold-btn)'} />
                      </div>
                      <div className="data-item-text">
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: member.is_active === 0 ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                          {roleTab === 'clients' ? (member.company_name || member.name) : member.name}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {roleTab === 'clients' && member.company_name && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--color-accent)' }}>Contacto: {member.name}</span>}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> {member.email}</span>
                          {roleTab === 'clients' && member.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> {member.phone}</span>}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Registro: {new Date(member.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                      {member.is_active === 0 ? (
                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Inactivo</span>
                      ) : (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Activo</span>
                      )}
                      
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(member); }} style={{ background: 'var(--color-bg-card-inner)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', boxShadow: 'var(--inner-shadow)' }}>
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* MODAL AGREGAR / EDITAR */}
      {isFormModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>
                {editingMember ? 'Editar Datos' : (roleTab === 'consultants' ? 'Nuevo Consultor' : 'Nuevo Cliente')}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* Columna Izquierda: Datos de la Cuenta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nombre Completo</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="Ej. Roberto Sánchez" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
                      {roleTab === 'consultants' ? 'Correo Corporativo' : 'Correo Electrónico'}
                    </label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder={roleTab === 'consultants' ? "consultor@novastrat.com" : "cliente@correo.com"} />
                  </div>
                  {roleTab === 'clients' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nombre de la Empresa</label>
                      <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="Ej. Logística SA" />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Teléfono / WhatsApp</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="+52 55 1234 5678" />
                  </div>
                </div>

                {/* Columna Derecha: Detalles / Descripción y Seguridad */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {roleTab === 'clients' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Descripción / A qué se dedica</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', resize: 'none', minHeight: '115px', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }} 
                        placeholder="Ej. Distribuidora de insumos médicos con presencia nacional." 
                      />
                    </div>
                  )}
                  
                  {editingMember && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Estado de la Cuenta</label>
                      {editingMember.is_active === 1 ? (
                        <button 
                          type="button" 
                          onClick={() => openSuspendModal(editingMember)}
                          style={{ 
                            width: '100%', 
                            padding: '0.85rem', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            color: '#ef4444', 
                            cursor: 'pointer', 
                            fontFamily: 'inherit', 
                            fontWeight: 600, 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}
                        >
                          <AlertCircle size={16} /> Suspender Cuenta
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => handleReactivate(editingMember)}
                          style={{ 
                            width: '100%', 
                            padding: '0.85rem', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(16, 185, 129, 0.3)', 
                            background: 'rgba(16, 185, 129, 0.05)', 
                            color: '#10b981', 
                            cursor: 'pointer', 
                            fontFamily: 'inherit', 
                            fontWeight: 600, 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}
                        >
                          Reactivar Cuenta
                        </button>
                      )}
                    </div>
                  )}

                  {editingMember && (
                    <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gold-btn)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <ShieldAlert size={18} /> Seguridad
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>Si olvidó su contraseña, puedes generar una nueva de forma aleatoria.</p>
                      <button type="button" onClick={handleResetPassword} style={{ background: 'transparent', border: '1px solid var(--color-gold-btn)', color: 'var(--color-gold-btn)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <Key size={16} /> Resetear Contraseña
                      </button>
                    </div>
                  )}
                </div>

              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsFormModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--inner-shadow)' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
                  {editingMember ? 'Guardar Cambios' : (roleTab === 'consultants' ? 'Registrar Consultor' : 'Registrar Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETALLE DEL CLIENTE MODAL */}
      {selectedClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Detalles del Cliente</h3>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre de la Empresa</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{selectedClient.company_name || selectedClient.name}</strong>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre del Contacto</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 500 }}>{selectedClient.name}</span>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Correo Electrónico</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{selectedClient.email}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Teléfono de Contacto</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{selectedClient.phone || 'No registrado'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Descripción / Actividad</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-main)', background: 'var(--color-bg-card-inner)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {selectedClient.description || 'Sin descripción disponible.'}
                </p>
              </div>

              {selectedClient.phone && (
                <a 
                  href={`https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    background: '#25D366', 
                    color: '#fff', 
                    textDecoration: 'none', 
                    padding: '0.85rem', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    textAlign: 'center', 
                    marginTop: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)' 
                  }}
                >
                  <Phone size={18} /> Chatear por WhatsApp
                </a>
              )}

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Asignar Consultores/Asesores Activos
                </span>
                {allConsultants.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>No hay consultores activos disponibles.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--color-bg-card-inner)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {allConsultants.map(c => {
                      const isChecked = assignedConsultants.includes(c.id);
                      return (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAssignedConsultants(assignedConsultants.filter(id => id !== c.id));
                              } else {
                                setAssignedConsultants([...assignedConsultants, c.id]);
                              }
                            }}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-teal)' }}
                          />
                          <span>{c.name} ({c.email})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <button 
                  onClick={async () => {
                    const toastId = toast.loading('Guardando asignaciones...');
                    try {
                      const res = await fetch(`${API_BASE}/api/users/clients/${selectedClient.id}/assign-consultants`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ consultantIds: assignedConsultants })
                      });
                      if (res.ok) {
                        toast.success('Asignaciones guardadas con éxito', { id: toastId });
                        setSelectedClient(null);
                        fetchTeam();
                      } else {
                        toast.error('Error al guardar asignaciones', { id: toastId });
                      }
                    } catch (err) {
                      toast.error('Error al guardar asignaciones', { id: toastId });
                    }
                  }}
                  className="btn-primary" 
                  style={{ marginTop: '1rem', width: '100%', padding: '0.65rem' }}
                >
                  Guardar Asesores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUSPENSIÓN */}
      {isSuspendModalOpen && suspendTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Suspensión de {roleTab === 'consultants' ? 'Consultor' : 'Cliente'}</h3>
              </div>
              <button onClick={() => setIsSuspendModalOpen(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              ¿Por qué vas a suspender a <strong style={{ color: 'var(--color-text-main)' }}>{suspendTarget.company_name || suspendTarget.name}</strong>? Se le enviará un correo electrónico notificándole la suspensión con el motivo seleccionado.
            </p>

            <form onSubmit={handleSuspend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Motivo de la suspensión</label>
                <select 
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }}
                >
                  <option>Incumplimiento de contrato</option>
                  <option>Falta de pago</option>
                  <option>Inactividad prolongada</option>
                  <option>Conducta inapropiada</option>
                  <option>Reestructuración interna</option>
                  <option>Solicitud del usuario</option>
                  <option>Otro motivo</option>
                </select>
              </div>

              {suspendReason === 'Otro motivo' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Especifica el motivo</label>
                  <textarea 
                    required
                    value={customSuspendReason}
                    onChange={(e) => setCustomSuspendReason(e.target.value)}
                    placeholder="Describe el motivo de la suspensión..."
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsSuspendModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--inner-shadow)' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> Confirmar Suspensión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
