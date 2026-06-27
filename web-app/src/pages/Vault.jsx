import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Columns, Settings, LogOut, Search, Bell, Menu, X, Users, UploadCloud, File, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function Vault() {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchDocuments(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchDocuments = async (currentUser) => {
    try {
      const res = await fetch('http://localhost:3000/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleFileChange = (e) => {
    setFileToUpload(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    
    setIsUploading(true);
    const toastId = toast.loading('Subiendo documento...');
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('uploaded_by', user.id);
    formData.append('project_id', 'null'); // MVP: Se sube de manera general

    try {
      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setFileToUpload(null);
        fetchDocuments(user);
        toast.success('Documento subido con éxito', { id: toastId });
      } else {
        toast.error('Error al subir documento', { id: toastId });
      }
    } catch (err) {
      toast.error('Error de conexión', { id: toastId });
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />

      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} user={user} />

        <div className="dashboard-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Zona de Subida (Drag and Drop simulado MVP) */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', border: '2px dashed var(--color-accent-teal)', background: 'var(--color-bg-card-inner)', transition: 'all 0.3s ease', boxShadow: 'var(--inner-shadow)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
              <UploadCloud size={32} color="var(--color-accent-teal)" />
            </div>
            <h2 className="title-glass" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>Sube tus Documentos</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Formatos soportados: PDF, Excel, Word (Max 10MB)</p>
            
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
              
              <label style={{ width: '100%', cursor: 'pointer', padding: '0.85rem 1.5rem', borderRadius: '12px', background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: 'var(--neumorphic-shadow)', transition: 'all 0.2s' }}>
                <File size={18} color="var(--color-accent-teal)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  {fileToUpload ? fileToUpload.name : 'Seleccionar Archivo'}
                </span>
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={!fileToUpload || isUploading}
                style={{ opacity: (!fileToUpload || isUploading) ? 0.5 : 1, width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isUploading ? 'Subiendo...' : 'Subir a Bóveda'}
              </button>
            </form>
          </div>

          {/* Lista de Archivos */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <FileText size={20} color="var(--color-accent-teal)" /> Archivos Recientes
            </h3>
            
            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                <FileText size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
                <p>La bóveda está vacía.</p>
              </div>
            ) : (
              <div className="glass-data-list">
                {documents.map(doc => (
                  <div key={doc.id} className="glass-data-item" style={{ flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', alignItems: 'center', background: 'var(--color-bg-card-inner)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--inner-shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', color: 'var(--color-accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                        <FileText size={24} />
                      </div>
                      <div className="data-item-text">
                        <h4 style={{ wordBreak: 'break-all', fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--color-text-main)' }}>{doc.file_name}</h4>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          <span style={{background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '10px'}}>{doc.uploaded_by_name}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    
                    <a href={`http://localhost:3000/uploads/${doc.file_path}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.85rem', width: 'auto' }}>
                      <Download size={16} /> <span className="hide-on-mobile">Descargar</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
