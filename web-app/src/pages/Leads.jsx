import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, UserPlus, Mail, Building, Plus, Edit2, Trash2, Phone, X, CheckCircle, AlertCircle, Target , LogOut} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/dashboard/Leads.css';

export default function Leads() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [user, setUser] = useState(null);
  
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' o 'inactive'
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Forms state
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', diagnosis_score: 0, description: '' });
  const [selectedLead, setSelectedLead] = useState(null); // Para el modal de detalles
  
  const [deleteReason, setDeleteReason] = useState('No le interesó');
  const [customReason, setCustomReason] = useState('');



  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard');
      } else {
        setUser(parsedUser);
        fetchLeads();
        
        const interval = setInterval(fetchLeads, 5000);
        return () => clearInterval(interval);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', diagnosis_score: 0, description: '' });
    setIsFormModalOpen(true);
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({ 
      company_name: lead.company_name, 
      contact_name: lead.contact_name || '', 
      contact_email: lead.contact_email, 
      contact_phone: lead.contact_phone || '', 
      diagnosis_score: lead.diagnosis_score || 0,
      description: lead.description || ''
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (lead) => {
    setEditingLead(lead);
    setDeleteReason('No le interesó');
    setCustomReason('');
    setIsDeleteModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const url = editingLead ? `${API_BASE}/api/leads/${editingLead.id}` : `${API_BASE}/api/leads`;
    const method = editingLead ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingLead ? 'Lead actualizado' : 'Lead guardado exitosamente');
        setIsFormModalOpen(false);
        fetchLeads();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Error guardando el lead');
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  const handleDeleteLead = async (e) => {
    e.preventDefault();
    const finalReason = deleteReason === 'Otro' ? customReason : deleteReason;
    
    try {
      const res = await fetch(`${API_BASE}/api/leads/${editingLead.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: 0, lost_reason: finalReason })
      });
      if (res.ok) {
        toast.success('Lead descartado');
        setIsDeleteModalOpen(false);
        fetchLeads();
      } else {
        toast.error('Error al descartar el lead');
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  const handleRestoreLead = async (lead) => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: 1, lost_reason: null })
      });
      if (res.ok) {
        toast.success('Lead restaurado');
        fetchLeads();
      } else {
        toast.error('Error al restaurar el lead');
      }
    } catch (err) {
      toast.error('Error de conexión');
      console.error(err);
    }
  };

  const handleConvert = (lead) => {
    toast(
      (t) => (
        <div>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>¿Convertir a <strong>{lead.company_name}</strong> en cliente activo?</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => toast.dismiss(t.id)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
            <button onClick={() => { toast.dismiss(t.id); executeConvert(lead); }} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Convertir</button>
          </div>
        </div>
      ),
      { duration: Infinity, id: 'convert-confirm' }
    );
  };

  const executeConvert = async (lead) => {
    try {
      const rawPassword = Math.random().toString(36).slice(-8);
      const res = await fetch(`${API_BASE}/api/users/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.company_name,
          email: lead.contact_email,
          rawPassword: rawPassword,
          leadId: lead.id
        })
      });

      if (res.ok) {
        toast.success(`Cliente creado. Contraseña temporal: ${rawPassword}`, { duration: 6000 });
        fetchLeads();
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

  // Filtrar los leads según la pestaña activa y si existe is_active, ocultando los ya convertidos en la pestaña de activos
  const filteredLeads = leads.filter(lead => {
    const activeStatus = lead.is_active === undefined ? 1 : lead.is_active;
    if (activeTab === 'active') {
      return activeStatus === 1 && lead.status !== 'converted';
    } else {
      return activeStatus === 0;
    }
  });

  return (
    <>
      <div className="dashboard-grid" style={{ display: 'block' }}>
          <div className="card glass-panel" style={{ width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="title-glass" style={{ margin: 0 }}>Directorio de Leads</h2>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '12px', boxShadow: 'var(--inner-shadow)' }}>
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
                  <Plus size={18} /> Agregar Lead
                </button>
              </div>
            </div>
            
            {filteredLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <Target size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                <p>No hay prospectos en esta categoría.</p>
              </div>
            ) : (
              <div className="glass-data-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="glass-data-item" 
                    onClick={() => setSelectedLead(lead)}
                    style={{ background: 'var(--color-bg-card-inner)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)', cursor: 'pointer' }}
                  >
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: '1 1 300px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: activeTab === 'active' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === 'active' ? 'var(--color-accent-teal)' : '#ef4444', boxShadow: 'var(--inner-shadow)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Building size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{lead.company_name}</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--color-accent)' }}>Contacto: {lead.contact_name || 'Sin registrar'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> {lead.contact_email}</span>
                          {lead.contact_phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> {lead.contact_phone}</span>}
                        </div>
                        {lead.lost_reason && <p style={{ margin: '0.25rem 0 0 0', color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>Motivo de baja: {lead.lost_reason}</p>}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {lead.status === 'new' && activeTab === 'active' && (
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          Score: {lead.diagnosis_score}%
                        </span>
                      )}
                      {lead.status === 'converted' && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Convertido
                        </span>
                      )}
 
                      {/* ACTIONS */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {activeTab === 'active' ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(lead); }} style={{ background: 'var(--color-bg-card-inner)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', boxShadow: 'var(--inner-shadow)' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(lead); }} style={{ background: 'var(--color-bg-card-inner)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: 'var(--inner-shadow)' }}>
                              <Trash2 size={16} />
                            </button>
                            {lead.status === 'new' && (
                              <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleConvert(lead); }} style={{ padding: '0 1rem', height: '36px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserPlus size={16} /> Convertir
                              </button>
                            )}
                          </>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleRestoreLead(lead); }} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', borderRadius: '8px', padding: '0 1rem', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            Restaurar Lead
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* ADD / EDIT MODAL */}
      {isFormModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>{editingLead ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h3>
              <button onClick={() => setIsFormModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Nombre de la Empresa</label>
                    <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="Ej. Logística SA" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Nombre del Contacto</label>
                    <input type="text" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="Ej. Juan Pérez" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Correo Electrónico</label>
                    <input required type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="contacto@empresa.com" />
                  </div>
                </div>

                {/* Columna Derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Teléfono (Opcional)</label>
                    <input type="text" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="+52 55 1234 5678" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Descripción / A qué se dedica</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', resize: 'none', minHeight: '115px', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }} 
                      placeholder="Ej. Distribuidora de insumos médicos con presencia nacional." 
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsFormModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--inner-shadow)' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE REASON MODAL */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#ef4444' }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Baja de Prospecto</h3>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>¿Por qué vas a dar de baja a <strong>{editingLead?.company_name}</strong>?</p>
            
            <form onSubmit={handleDeleteLead} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                value={deleteReason} 
                onChange={e => setDeleteReason(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }}
              >
                <option value="No le interesó">No le interesó</option>
                <option value="Falta de Presupuesto">Falta de Presupuesto</option>
                <option value="No pudimos contactarlo">No pudimos contactarlo</option>
                <option value="Servicio no adecuado">El servicio no se adecúa a sus necesidades</option>
                <option value="Otro">Otro motivo...</option>
              </select>
              
              {deleteReason === 'Otro' && (
                <textarea 
                  required 
                  placeholder="Escribe el motivo..." 
                  value={customReason} 
                  onChange={e => setCustomReason(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }}
                />
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--inner-shadow)' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Confirmar Baja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETALLE DEL LEAD MODAL */}
      {selectedLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-overlay)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Detalles del Prospecto</h3>
              <button onClick={() => setSelectedLead(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre de la Empresa</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{selectedLead.company_name}</strong>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nombre del Contacto</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: 500 }}>{selectedLead.contact_name || 'No registrado'}</span>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Correo Electrónico</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{selectedLead.contact_email}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Teléfono de Contacto</span>
                <span style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{selectedLead.contact_phone || 'No registrado'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Descripción / Actividad</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-main)', background: 'var(--color-bg-card-inner)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {selectedLead.description || 'Sin descripción disponible.'}
                </p>
              </div>

              {selectedLead.contact_phone && (
                <a 
                  href={`https://wa.me/${selectedLead.contact_phone.replace(/[^0-9]/g, '')}`} 
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
            </div>
          </div>
        </div>
      )}

    </>
  );
}
