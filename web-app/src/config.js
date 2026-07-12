import { API_BASE } from './config.js';
export const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? `${API_BASE}` : window.location.origin);
