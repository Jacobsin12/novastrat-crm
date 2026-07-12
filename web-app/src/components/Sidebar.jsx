import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Columns, Settings, LogOut, Users, Target, X, User, Pin, PinOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/dashboard/Layout.css';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(localStorage.getItem('sidebarPinned') === 'true');

  useEffect(() => {
    if (isPinned && window.innerWidth > 1024) {
      setIsSidebarOpen(true);
    }
  }, [isPinned, setIsSidebarOpen]);

  const togglePin = () => {
    const newState = !isPinned;
    setIsPinned(newState);
    localStorage.setItem('sidebarPinned', newState);
    setIsSidebarOpen(newState);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItem = (path, icon, label, roles) => {
    if (roles && !roles.includes(user?.role)) return null;
    const isActive = location.pathname === path;
    
    return (
      <a 
        href="#" 
        className={`nav-item ${isActive ? 'active' : ''}`} 
        onClick={(e) => { 
          e.preventDefault(); 
          if (!isPinned || window.innerWidth <= 1024) {
            setIsSidebarOpen(false); 
          }
          navigate(path); 
        }}
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  };

  const bottomNavItem = (path, icon, label, roles) => {
    if (roles && !roles.includes(user?.role)) return null;
    const isActive = location.pathname === path;
    
    return (
      <a 
        href="#" 
        className={`bottom-nav-item ${isActive ? 'active' : ''}`} 
        onClick={(e) => { 
          e.preventDefault(); 
          navigate(path); 
        }}
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-dot"></div>
          <h2>Nova Strat</h2>
          
          <button className="icon-btn hide-on-mobile" onClick={togglePin} title={isPinned ? "Desfijar Menú" : "Dejar Menú Fijo"} style={{ marginLeft: 'auto', color: isPinned ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
            {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
          </button>
          
          <button className="mobile-close-btn hide-on-desktop" onClick={() => setIsSidebarOpen(false)} style={{ display: window.innerWidth > 1024 ? 'none' : 'block' }}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItem('/dashboard', <LayoutDashboard size={20} />, 'Resumen', ['admin', 'consultant', 'client'])}
          
          {navItem('/pipeline', <Columns size={20} />, 'Pipeline Global', ['admin', 'consultant'])}
          {navItem('/pipeline', <Columns size={20} />, 'Mi Proyecto', ['client'])}
          
          {navItem('/leads', <Target size={20} />, 'Prospectos', ['admin'])}
          {navItem('/vault', <FileText size={20} />, 'Bóveda Documental', ['admin', 'consultant', 'client'])}
          {navItem('/team', <Users size={20} />, 'Personal', ['admin'])}
          {navItem('/settings', <Settings size={20} />, 'Configuración', ['admin', 'consultant', 'client'])}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            Sesión: {user.name} ({user.role})
          </div>
          <a href="#" className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Salir</span>
          </a>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="bottom-nav">
        {bottomNavItem('/dashboard', <LayoutDashboard size={22} />, 'Inicio', ['admin', 'consultant', 'client'])}
        
        {bottomNavItem('/pipeline', <Columns size={22} />, 'Pipeline', ['consultant', 'client'])}
        {bottomNavItem('/leads', <Target size={22} />, 'Leads', ['admin'])}
        
        {bottomNavItem('/vault', <FileText size={22} />, 'Bóveda', ['admin', 'consultant', 'client'])}
        {bottomNavItem('/team', <Users size={22} />, 'Equipo', ['admin'])}
        {bottomNavItem('/settings', <User size={22} />, 'Perfil', ['admin', 'consultant', 'client'])}
      </nav>
    </>
  );
}
