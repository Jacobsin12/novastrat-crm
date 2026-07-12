import { API_BASE } from '../config.js';
import React, { useState, useEffect } from 'react';
import { FileText, Search, UploadCloud, File, Download, FolderOpen, FolderPlus, ArrowLeft, Trash2, ExternalLink, Users, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/dashboard/Vault.css';

const API = `${API_BASE}`;

// ============================================================
// VISTA SIMPLE (Clientes y Consultores) — Sin cambios
// ============================================================
function SimpleVault({ user }) {
  const [documents, setDocuments] = useState([]);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  
  // Navigation stack for Drive
  const [folderStack, setFolderStack] = useState([]);
  const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;

  useEffect(() => {
    fetchDocuments();
    fetchRootDriveFolder();
  }, []);

  const fetchRootDriveFolder = async () => {
    if (user.role !== 'client') return;
    try {
      setLoadingDrive(true);
      const projRes = await fetch(`${API_BASE}/api/projects/client/${user.id}`);
      if (projRes.ok) {
        const proj = await projRes.json();
        if (proj && proj.drive_folder_id) {
          const rootFolder = { folderId: proj.drive_folder_id, folderName: 'Carpeta Principal' };
          setFolderStack([rootFolder]);
          await fetchDriveFiles(rootFolder.folderId);
        } else {
          setLoadingDrive(false);
        }
      } else {
        setLoadingDrive(false);
      }
    } catch (err) {
      console.error('Error fetching project for drive:', err);
      setLoadingDrive(false);
    }
  };

  const fetchDriveFiles = async (folderId) => {
    try {
      setLoadingDrive(true);
      const res = await fetch(`${API_BASE}/api/admin/drive/folders/${folderId}/files`);
      if (res.ok) {
        setDriveFiles(await res.json());
      }
    } catch (err) {
      console.error('Error fetching drive files:', err);
    } finally {
      setLoadingDrive(false);
    }
  };

  const enterSubfolder = (subfolder) => {
    const newFolder = { folderId: subfolder.id, folderName: subfolder.name };
    setFolderStack([...folderStack, newFolder]);
    fetchDriveFiles(subfolder.id);
  };

  const goBack = () => {
    if (folderStack.length <= 1) return;
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    fetchDriveFiles(newStack[newStack.length - 1].folderId);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const fetchDocuments = async () => {
    try {
      let url = `${API_BASE}/api/documents`;
      if (user.role === 'client') {
        const projRes = await fetch(`${API_BASE}/api/projects/client/${user.id}`);
        if (projRes.ok) {
          const proj = await projRes.json();
          if (proj) url += `?projectId=${proj.id}`;
        }
      }
      const res = await fetch(url);
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleUploadToFolder = async (e) => {
    e.preventDefault();
    if (filesToUpload.length === 0 || !currentFolder) return;
    setIsUploading(true);
    const toastId = toast.loading(`Subiendo ${filesToUpload.length} archivo(s)...`);
    
    let successCount = 0;
    const newFilesList = [];
    
    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', user.id);
      if (currentFolder.clientId) formData.append('clientId', currentFolder.clientId);
      
      try {
        const res = await fetch(`${API_BASE}/api/admin/drive/folders/${currentFolder.folderId}/upload`, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.drive_synced !== false) {
            successCount++;
            newFilesList.push({
              id: data.driveFileId,
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              modifiedTime: new Date().toISOString(),
              webViewLink: data.webViewLink,
              uploadedBy: user.id,
              uploaderName: user.name || 'Tú',
              source: 'drive'
            });
          }
        }
      } catch (err) {
        console.error('Error de conexión:', err);
      }
    }
    
    if (successCount === filesToUpload.length) {
      toast.success(`¡Se subieron ${successCount} archivos correctamente!`, { id: toastId });
    } else if (successCount > 0) {
      toast.error(`Se subieron ${successCount} de ${filesToUpload.length} archivos`, { id: toastId });
    } else {
      toast.error('Error al subir los archivos', { id: toastId });
    }
    
    setFilesToUpload([]);
    if (newFilesList.length > 0) {
      setDriveFiles(prev => [...newFilesList, ...prev]);
      fetchDocuments();
      setTimeout(() => fetchDriveFiles(currentFolder.folderId), 3000);
    }
    setIsUploading(false);
  };

  return (
    <div className="dashboard-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', color: '#10b981', fontSize: '0.9rem', fontWeight: 600, boxShadow: 'var(--inner-shadow)' }}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
        Conectado a Google Drive API (Carpeta Compartida con Asesor)
      </div>

      {folderStack.length > 1 ? (
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', boxShadow: 'var(--inner-shadow)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <FolderOpen size={24} color="#eab308" />
          </div>
          <h2 className="title-glass" style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>Modo solo lectura</h2>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.9rem', maxWidth: '400px' }}>
            Las subcarpetas creadas por tu asesor son únicamente para visualizar entregables. Si deseas subir tus propios archivos, por favor regresa a tu carpeta principal.
          </p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', border: '2px dashed var(--color-accent-teal)', background: 'var(--color-bg-card-inner)', transition: 'all 0.3s ease', boxShadow: 'var(--inner-shadow)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
            <UploadCloud size={32} color="var(--color-accent-teal)" />
          </div>
          <h2 className="title-glass" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>Subir archivo a tu Bóveda</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>Formatos soportados: PNG, JPG, TXT, PDF, Excel, Word (Max 10MB c/u)</p>
          <form onSubmit={handleUploadToFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
              <label style={{ flex: 1, cursor: 'pointer', padding: '0.85rem 1.5rem', borderRadius: '12px', background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: 'var(--neumorphic-shadow)', transition: 'all 0.2s' }}>
                <File size={18} color="var(--color-accent-teal)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                  {filesToUpload.length > 0 ? (filesToUpload.length === 1 ? filesToUpload[0].name : `${filesToUpload.length} archivos seleccionados`) : 'Seleccionar (Max 5)'}
                </span>
                <input type="file" multiple accept=".png,.jpg,.jpeg,.txt,.pdf,.xls,.xlsx,.doc,.docx" onChange={(e) => {
                  const selected = Array.from(e.target.files);
                  if (selected.length > 5) {
                    toast.error('Solo puedes subir hasta 5 archivos a la vez');
                    setFilesToUpload(selected.slice(0, 5));
                  } else {
                    setFilesToUpload(selected);
                  }
                }} style={{ display: 'none' }} />
              </label>
              {filesToUpload.length > 0 && (
                <button type="button" onClick={() => setFilesToUpload([])} title="Quitar archivos" style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={filesToUpload.length === 0 || isUploading} style={{ opacity: (filesToUpload.length === 0 || isUploading) ? 0.5 : 1, width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isUploading ? 'Subiendo...' : 'Subir a Bóveda'}
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card glass-panel col-span-2" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      <h4 style={{ wordBreak: 'break-all', fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {doc.file_name}
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600 }}>Google Drive</span>
                      </h4>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>{doc.uploaded_by_name}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <a href={`${API_BASE}/uploads/${doc.file_path}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.85rem', width: 'auto' }}>
                    <Download size={16} /> <span className="hide-on-mobile">Descargar</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card glass-panel col-span-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {folderStack.length > 1 && (
              <button onClick={goBack} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderOpen size={20} color="var(--color-accent-teal)" /> 
              {currentFolder?.folderName === 'Carpeta Principal' ? 'Carpeta Compartida (Drive)' : currentFolder?.folderName}
            </h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loadingDrive ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Cargando archivos...</div>
            ) : driveFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                <FolderOpen size={40} opacity={0.15} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem' }}>La carpeta está vacía</p>
              </div>
            ) : driveFiles.map(file => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-card-inner)', borderRadius: '12px', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                  {file.mimeType === 'application/vnd.google-apps.folder' ? <FolderOpen size={20} color="var(--color-accent-teal)" /> : <FileText size={20} color="var(--color-accent-teal)" />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minWidth: '120px', cursor: file.mimeType === 'application/vnd.google-apps.folder' ? 'pointer' : 'default' }} onClick={() => file.mimeType === 'application/vnd.google-apps.folder' && enterSubfolder(file)}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {file.mimeType !== 'application/vnd.google-apps.folder' && <span>{formatFileSize(file.size)}</span>}
                    {file.modifiedTime && <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>}
                    {file.uploaderName && <span style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent-teal)', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>Por {file.uploaderName}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {file.webViewLink && (
                    <a href={file.webViewLink} target="_blank" rel="noreferrer" title="Abrir en Drive" style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-teal)', textDecoration: 'none' }}>
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISTA ADMIN — Explorador de Carpetas de Drive
// ============================================================
function AdminVault({ user }) {
  const [folders, setFolders] = useState([]);
  const [folderStack, setFolderStack] = useState([]);
  const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;
  const [files, setFiles] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderClientId, setNewFolderClientId] = useState('');
  const [clients, setClients] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);

  useEffect(() => { 
    fetchFolders(); 
    if (user.role === 'admin') fetchClients(); 
  }, []);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      let url = `${API_BASE}/api/admin/drive/folders`;
      if (user.role === 'consultant') {
        url += `?consultantId=${user.id}`;
      }
      const res = await fetch(url);
      if (res.ok) setFolders(await res.json());
    } catch (err) { console.error('Error fetching folders:', err); }
    finally { setLoadingFolders(false); }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/clients-list`);
      if (res.ok) setClients(await res.json());
    } catch (err) { /* ignore */ }
  };

  const selectFolder = async (folder) => {
    setFolderStack([folder]);
    fetchFilesInFolder(folder.folderId);
  };

  const enterSubfolder = (subfolder) => {
    const newFolder = { folderId: subfolder.id, folderName: subfolder.name, clientName: currentFolder.clientName };
    setFolderStack([...folderStack, newFolder]);
    fetchFilesInFolder(subfolder.id);
  };

  const goBack = () => {
    if (folderStack.length <= 1) {
      setFolderStack([]);
      setFiles([]);
    } else {
      const newStack = folderStack.slice(0, -1);
      setFolderStack(newStack);
      fetchFilesInFolder(newStack[newStack.length - 1].folderId);
    }
  };

  const fetchFilesInFolder = async (folderId) => {
    setFiles([]);
    setLoadingFiles(true);
    setFileToUpload(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/drive/folders/${folderId}/files`);
      if (res.ok) setFiles(await res.json());
    } catch (err) { console.error('Error fetching files:', err); }
    finally { setLoadingFiles(false); }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreating(true);
    const toastId = toast.loading('Creando carpeta en Google Drive...');
    try {
      const res = await fetch(`${API_BASE}/api/admin/drive/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName.trim(), clientId: newFolderClientId || null, uploaded_by: user.id })
      });
      if (res.ok) {
        toast.success('Carpeta creada exitosamente', { id: toastId });
        setShowCreateModal(false);
        setNewFolderName('');
        setNewFolderClientId('');
        fetchFolders();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear carpeta', { id: toastId });
      }
    } catch (err) { toast.error('Error de conexión', { id: toastId }); }
    finally { setIsCreating(false); }
  };

  const handleUploadToFolder = async (e) => {
    e.preventDefault();
    if (!fileToUpload || !currentFolder) return;
    setIsUploading(true);
    const toastId = toast.loading('Subiendo a Google Drive...');
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('uploaded_by', user.id);
    if (currentFolder.clientId) formData.append('clientId', currentFolder.clientId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/drive/folders/${currentFolder.folderId}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        
        if (data.drive_synced === false) {
          toast.error(`Guardado localmente, pero falló en Drive: ${data.error || 'Sin cuota'}`, { id: toastId });
          setFileToUpload(null);
          return;
        }

        toast.success('Archivo subido correctamente', { id: toastId });
        setFileToUpload(null);
        
        const newFile = {
          id: data.driveFileId,
          name: fileToUpload.name,
          mimeType: fileToUpload.type || 'application/octet-stream',
          size: fileToUpload.size,
          modifiedTime: new Date().toISOString(),
          webViewLink: data.webViewLink,
          uploadedBy: user.id,
          uploaderName: user.name || 'Tú',
          source: 'drive'
        };
        setFiles(prev => [newFile, ...prev]);
        
        // Fetch para sincronizar después de un tiempo
        setTimeout(() => fetchFilesInFolder(currentFolder.folderId), 3000);
      } else { toast.error('Error al subir archivo', { id: toastId }); }
    } catch (err) { toast.error('Error de conexión', { id: toastId }); }
    finally { setIsUploading(false); }
  };

  const handleCreateSubfolder = async (e) => {
    e.preventDefault();
    if (!newSubfolderName.trim() || !currentFolder) return;
    setIsCreatingSubfolder(true);
    const toastId = toast.loading('Creando subcarpeta...');
    try {
      const res = await fetch(`${API_BASE}/api/admin/drive/folders/${currentFolder.folderId}/subfolders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newSubfolderName.trim(), clientId: currentFolder.clientId, uploaded_by: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Subcarpeta creada', { id: toastId });
        setShowSubfolderModal(false);
        setNewSubfolderName('');
        
        const newFolder = {
          id: data.id,
          name: data.name,
          mimeType: 'application/vnd.google-apps.folder',
          size: null,
          modifiedTime: new Date().toISOString(),
          webViewLink: data.webViewLink,
          uploadedBy: user.id,
          uploaderName: user.name || 'Tú',
          source: 'drive'
        };
        setFiles(prev => [newFolder, ...prev]);

        setTimeout(() => fetchFilesInFolder(currentFolder.folderId), 3000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear subcarpeta', { id: toastId });
      }
    } catch (err) { toast.error('Error de conexión', { id: toastId }); }
    finally { setIsCreatingSubfolder(false); }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`¿Eliminar "${fileName}" de Google Drive? Esta acción no se puede deshacer.`)) return;
    const toastId = toast.loading('Eliminando archivo...');
    try {
      const res = await fetch(`${API_BASE}/api/admin/drive/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Archivo eliminado', { id: toastId }); setFiles(files.filter(f => f.id !== fileId)); }
      else { toast.error('Error al eliminar', { id: toastId }); }
    } catch (err) { toast.error('Error de conexión', { id: toastId }); }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredFolders = folders.filter(f =>
    f.folderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.clientName && f.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.companyName && f.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', color: '#10b981', fontSize: '0.9rem', fontWeight: 600, boxShadow: 'var(--inner-shadow)' }}>
        <HardDrive size={20} />
        Gestor de Carpetas — Google Drive (Admin)
      </div>

      {/* Two-panel layout */}
      <div className="vault-admin-layout">
        {/* LEFT: Folder list */}
        <div className={`vault-admin-folders card glass-panel ${currentFolder ? 'vault-hide-on-mobile' : ''}`} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderOpen size={20} color="var(--color-accent-teal)" /> Carpetas
            </h3>
            {user.role === 'admin' && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FolderPlus size={16} /> Nueva
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Buscar carpeta o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.25rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '55vh' }}>
            {loadingFolders ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Cargando carpetas...</div>
            ) : filteredFolders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <FolderOpen size={36} opacity={0.2} style={{ marginBottom: '0.5rem' }} />
                <p>No hay carpetas{searchTerm ? ' que coincidan' : ''}</p>
              </div>
            ) : filteredFolders.map(folder => (
              <button key={folder.folderId} onClick={() => selectFolder(folder)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '12px',
                  border: currentFolder?.folderId === folder.folderId ? '1px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                  background: currentFolder?.folderId === folder.folderId ? 'rgba(20, 184, 166, 0.08)' : 'var(--color-bg-card-inner)',
                  cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s', color: 'var(--color-text-main)'
                }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: folder.clientId ? 'rgba(20, 184, 166, 0.1)' : 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: folder.clientId ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)' }}>
                  <FolderOpen size={20} color={folder.clientId ? 'var(--color-accent-teal)' : '#eab308'} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.folderName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                    {folder.clientId ? (<><Users size={12} /> {folder.clientName}</>) : (<span style={{ color: '#eab308' }}>Sin cliente asignado</span>)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Files */}
        <div className={`vault-admin-files card glass-panel ${!currentFolder ? 'vault-hide-on-mobile' : ''}`} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!currentFolder ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
              <FolderOpen size={56} opacity={0.15} style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>Selecciona una carpeta</p>
              <p style={{ fontSize: '0.8rem' }}>Elige una carpeta del panel izquierdo para ver sus archivos</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={goBack} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex' }}>
                  <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)' }}>{currentFolder.folderName}</h3>
                  {currentFolder.clientName && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Cliente: {currentFolder.clientName} {currentFolder.companyName ? `(${currentFolder.companyName})` : ''}</span>
                  )}
                </div>
                <button onClick={() => setShowSubfolderModal(true)} style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.4)', borderRadius: '8px', color: 'var(--color-accent-teal)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', transition: 'all 0.2s' }} 
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'; }}>
                  <FolderPlus size={16} /> Crear Subcarpeta
                </button>
              </div>

              {(user.role === 'admin' || (user.role === 'consultant' && folderStack.length > 1)) && (
                <form onSubmit={handleUploadToFolder} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem', background: 'var(--color-bg-card-inner)', borderRadius: '12px', border: '1px dashed var(--color-accent-teal)' }}>
                  <label style={{ flex: '1 1 200px', cursor: 'pointer', padding: '0.55rem 1rem', borderRadius: '10px', background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <UploadCloud size={16} color="var(--color-accent-teal)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileToUpload ? fileToUpload.name : 'Seleccionar archivo...'}</span>
                    <input type="file" onChange={(e) => setFileToUpload(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                  <button type="submit" className="btn-primary" disabled={!fileToUpload || isUploading} style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', opacity: (!fileToUpload || isUploading) ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                    {isUploading ? 'Subiendo...' : 'Subir'}
                  </button>
                </form>
              )}

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loadingFiles ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Cargando archivos...</div>
                ) : files.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                    <FileText size={40} opacity={0.15} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>Esta carpeta está vacía</p>
                  </div>
                ) : files.map(file => (
                  <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-card-inner)', borderRadius: '12px', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                      {file.mimeType === 'application/vnd.google-apps.folder' ? <FolderOpen size={20} color="var(--color-accent-teal)" /> : <FileText size={20} color="var(--color-accent-teal)" />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', minWidth: '120px', cursor: file.mimeType === 'application/vnd.google-apps.folder' ? 'pointer' : 'default' }} onClick={() => file.mimeType === 'application/vnd.google-apps.folder' && enterSubfolder(file)}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {file.mimeType !== 'application/vnd.google-apps.folder' && <span>{formatFileSize(file.size)}</span>}
                        {file.modifiedTime && <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>}
                        {file.uploaderName && <span style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-accent-teal)', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>Por {file.uploaderName}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {file.webViewLink && (
                        <a href={file.webViewLink} target="_blank" rel="noreferrer" title="Abrir en Drive" style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-teal)', textDecoration: 'none' }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {file.source === 'drive' && (user.role === 'admin' || (user.role === 'consultant' && file.uploadedBy === user.id)) && (
                        <button onClick={() => handleDeleteFile(file.id, file.name)} title="Eliminar" style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE FOLDER MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', background: 'var(--color-bg-overlay)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={20} color="var(--color-accent-teal)" /> Crear Nueva Carpeta
            </h3>
            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nombre de la carpeta</label>
                <input required type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Ej. Empresa ABC"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Asociar a cliente (opcional)</label>
                <select value={newFolderClientId} onChange={e => setNewFolderClientId(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box' }}>
                  <option value="">— Sin cliente —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''} {c.drive_folder_id ? '✓' : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); setNewFolderName(''); setNewFolderClientId(''); }}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} disabled={isCreating || !newFolderName.trim()}>
                  {isCreating ? 'Creando...' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBFOLDER MODAL */}
      {showSubfolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--color-bg-overlay)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={20} color="var(--color-accent-teal)" /> Crear Subcarpeta
            </h3>
            <form onSubmit={handleCreateSubfolder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Nombre de la subcarpeta</label>
                <input required type="text" value={newSubfolderName} onChange={e => setNewSubfolderName(e.target.value)} placeholder="Ej. Entregables"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card-inner)', color: 'var(--color-text-main)', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => { setShowSubfolderModal(false); setNewSubfolderName(''); }}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }} disabled={isCreatingSubfolder || !newSubfolderName.trim()}>
                  {isCreatingSubfolder ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Vault() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  if (user.role === 'admin' || user.role === 'consultant') {
    return <AdminVault user={user} />;
  }

  return <SimpleVault user={user} />;
}
