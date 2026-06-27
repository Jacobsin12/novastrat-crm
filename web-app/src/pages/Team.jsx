import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, UserPlus, Mail, User, Edit2, X, Key, ShieldAlert , LogOut} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/Dashboard.css';

export default function Team() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', is_active: 1 });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard'); 
      } else {
        setUser(parsedUser);
        fetchTeam();
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchTeam = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users/consultants');
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', is_active: 1 });
    setIsFormModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({ name: member.name, email: member.email, is_active: member.is_active });
    setIsFormModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (editingMember) {
      // Edit
      try {
        const res = await fetch(`http://localhost:3000/api/users/consultants/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          toast.success('Consultor actualizado');
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
        const res = await fetch('http://localhost:3000/api/users/consultants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, email: formData.email, rawPassword })
        });

        if (res.ok) {
          toast.success(`Consultor creado. Contraseña temporal: ${rawPassword}`, { duration: 6000 });
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
    try {
      const res = await fetch(`http://localhost:3000/api/users/consultants/${editingMember.id}/password`, {
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

  if (!user) return null;

  const filteredTeam = team.filter(member => {
    return activeTab === 'active' ? member.is_active === 1 : member.is_active === 0;
  });

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />

      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} user={user} />

        <div className="dashboard-grid" style={{ display: 'block' }}>
          <div className="card glass-panel" style={{ width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="title-glass" style={{ margin: 0, fontSize: '1.5rem' }}>Equipo de Consultores</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  <UserPlus size={18} /> Agregar Personal
                </button>
              </div>
            </div>
            
            {filteredTeam.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <User size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                <p>No hay consultores en esta categoría.</p>
              </div>
            ) : (
              <div className="glass-data-list">
                {filteredTeam.map(member => (
                  <div key={member.id} className="glass-data-item" style={{ flexWrap: 'wrap', gap: '1rem', background: 'var(--color-bg-card-inner)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)', opacity: member.is_active === 0 ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 250px' }}>
                      <div style={{ width: '48px', height: '48px', background: member.is_active === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(234, 179, 8, 0.1)', border: member.is_active === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color={member.is_active === 0 ? 'var(--color-text-muted)' : 'var(--color-gold-btn)'} />
                      </div>
                      <div className="data-item-text">
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: member.is_active === 0 ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                          {member.name}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> {member.email}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Registro: {new Date(member.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {member.is_active === 0 ? (
                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Inactivo</span>
                      ) : (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Activo</span>
                      )}
                      
                      <button onClick={() => openEditModal(member)} style={{ background: 'var(--color-bg-card-inner)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', boxShadow: 'var(--inner-shadow)' }}>
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL AGREGAR / EDITAR */}
      {isFormModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', background: 'var(--color-bg-panel)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>{editingMember ? 'Editar Consultor' : 'Nuevo Consultor'}</h3>
              <button onClick={() => setIsFormModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nombre Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="Ej. Roberto Sánchez" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Correo Corporativo</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', boxShadow: 'var(--inner-shadow)' }} placeholder="consultor@novastrat.com" />
              </div>

              {editingMember && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Estado de la Cuenta</label>
                  <select 
                    value={formData.is_active} 
                    onChange={e => setFormData({...formData, is_active: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontFamily: 'inherit', boxShadow: 'var(--inner-shadow)' }}
                  >
                    <option value={1}>Activo (Puede acceder al sistema)</option>
                    <option value={0}>Inactivo (Acceso suspendido)</option>
                  </select>
                </div>
              )}

              {/* Botón de Reset Password si estamos editando */}
              {editingMember && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gold-btn)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <ShieldAlert size={18} /> Seguridad
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>Si el consultor olvidó su contraseña, puedes generar una nueva de forma aleatoria.</p>
                  <button type="button" onClick={handleResetPassword} style={{ background: 'transparent', border: '1px solid var(--color-gold-btn)', color: 'var(--color-gold-btn)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <Key size={16} /> Resetear Contraseña
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsFormModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, boxShadow: 'var(--inner-shadow)' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>{editingMember ? 'Guardar Cambios' : 'Registrar Consultor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
